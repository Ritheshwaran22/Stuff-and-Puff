import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from payments.models import Payment
from payments.services.payment_service import PaymentService
from payments.services.cashfree_service import CashfreeService

logger = logging.getLogger(__name__)


def cashfree_return_view(request):
    """
    Handles customer redirection after completing payment on Cashfree.
    Verifies the payment server-side with Cashfree before confirming the order.
    """
    gateway_order_id = request.GET.get('order_id', '').strip()
    if not gateway_order_id:
        return render(request, 'orders/payment_failed.html', {
            'error_message': 'Missing order identifier from payment gateway.'
        })

    payment = Payment.objects.filter(gateway_order_id=gateway_order_id).select_related('order', 'order__customer').first()
    if not payment:
        return render(request, 'orders/payment_failed.html', {
            'error_message': f"No local order found matching gateway reference {gateway_order_id}."
        })

    order = payment.order

    # If already verified, authorize session and proceed to confirmation
    if payment.status == 'SUCCESS' and order.payment_status == 'PAID':
        _authorize_session_for_order(request, order)
        return redirect('order_confirmation', token=order.confirmation_token or order.token)

    # Perform strict server-side verification with Cashfree
    success, result = PaymentService.verify_and_confirm_payment(
        order_id=order.id,
        gateway_order_id=gateway_order_id
    )

    if success:
        _authorize_session_for_order(request, order)
        return redirect('order_confirmation', token=order.confirmation_token or order.token)
    else:
        return render(request, 'orders/payment_failed.html', {
            'order': order,
            'error_message': result if isinstance(result, str) else "Payment was not authorized by Cashfree."
        })


@csrf_exempt
@require_POST
def cashfree_webhook_view(request):
    """
    Asynchronous webhook handler for Cashfree PG events.
    Verifies HMAC-SHA256 signature and idempotently confirms the order.
    """
    signature = request.headers.get('x-webhook-signature', '')
    timestamp = request.headers.get('x-webhook-timestamp', '')
    raw_body = request.body.decode('utf-8')

    # Verify signature
    is_valid = CashfreeService.verify_webhook_signature(timestamp, raw_body, signature)
    if not is_valid:
        logger.warning("Unauthorized Cashfree webhook received (signature mismatch).")
        return HttpResponseBadRequest("Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    event_type = payload.get('type', '')
    data = payload.get('data', {})
    order_data = data.get('order', {})
    gateway_order_id = order_data.get('order_id') or payload.get('order_id')

    if not gateway_order_id:
        return JsonResponse({'status': 'ignored', 'reason': 'missing order_id'})

    payment = Payment.objects.filter(gateway_order_id=gateway_order_id).select_related('order').first()
    if not payment:
        return JsonResponse({'status': 'ignored', 'reason': 'order not found'})

    # If successful payment event, confirm order idempotently
    if 'SUCCESS' in event_type.upper() or 'PAID' in event_type.upper():
        payment_data = data.get('payment', {})
        cf_payment_id = str(payment_data.get('cf_payment_id', ''))
        PaymentService.verify_and_confirm_payment(
            order_id=payment.order.id,
            gateway_payment_id=cf_payment_id,
            gateway_order_id=gateway_order_id
        )

    return JsonResponse({'status': 'ok'})


def _authorize_session_for_order(request, order):
    """Stores order authorization in the current browser session."""
    authorized_order_ids = request.session.get('authorized_order_ids', [])
    if order.id not in authorized_order_ids:
        authorized_order_ids.append(order.id)
    request.session['authorized_order_ids'] = authorized_order_ids

    confirmed_order_tokens = request.session.get('confirmed_order_tokens', [])
    if order.token not in confirmed_order_tokens:
        confirmed_order_tokens.append(order.token)
    if order.confirmation_token and order.confirmation_token not in confirmed_order_tokens:
        confirmed_order_tokens.append(order.confirmation_token)
    request.session['confirmed_order_tokens'] = confirmed_order_tokens

    request.session['verified_customer_mobile'] = order.customer.mobile
    request.session.modified = True
