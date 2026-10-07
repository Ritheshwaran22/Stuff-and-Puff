import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest, Http404
from django.db.models import Q
from django.conf import settings
from django.views.decorators.http import require_http_methods, require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from shop.models import ShopSettings
from orders.models import Order
from orders.services.slot_service import get_available_pickup_slots
from payments.services.payment_service import PaymentService, InvalidCartItemError

def checkout_view(request):
    shop_settings = ShopSettings.get_settings()
    if not shop_settings.shop_open or not shop_settings.online_orders_enabled:
        return render(request, 'orders/checkout_disabled.html', {
            'shop_settings': shop_settings
        })

    available_slots = get_available_pickup_slots()
    context = {
        'available_slots': available_slots,
        'shop_settings': shop_settings,
    }
    return render(request, 'orders/checkout.html', context)


@require_GET
def api_get_slots(request):
    """Returns real-time available slots as JSON"""
    slots = get_available_pickup_slots()
    clean_slots = []
    for s in slots:
        clean_slots.append({
            'iso': s['iso'],
            'time_display': s['time_display'],
            'booked_count': s['booked_count'],
            'max_capacity': s['max_capacity'],
            'is_available': s['is_available'],
        })
    return JsonResponse({'slots': clean_slots})


@require_POST
def api_create_order(request):
    """
    Validates cart and slot from client, creates a pending order,
    and returns payment initialization data.
    """
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON body.'}, status=400)

    customer_name = data.get('customer_name')
    customer_mobile = data.get('customer_mobile')
    customer_email = data.get('customer_email', '')
    slot_iso = data.get('pickup_slot')
    cart_items = data.get('cart_items', [])
    payment_method = data.get('payment_method', 'UPI')

    if not slot_iso:
        return JsonResponse({'success': False, 'error': 'Please select a valid pickup time slot.'}, status=400)

    slot_dt = parse_datetime(slot_iso)
    if not slot_dt:
        return JsonResponse({'success': False, 'error': 'Invalid pickup time format.'}, status=400)

    if timezone.is_naive(slot_dt):
        slot_dt = timezone.make_aware(slot_dt, timezone.get_current_timezone())

    try:
        order, payment = PaymentService.create_pending_order(
            customer_name=customer_name,
            customer_mobile=customer_mobile,
            pickup_slot_dt=slot_dt,
            cart_items=cart_items,
            payment_method=payment_method,
            request=request,
            customer_email=customer_email
        )
        # Track pending order in browser session
        pending_ids = request.session.get('pending_order_ids', [])
        if order.id not in pending_ids:
            pending_ids.append(order.id)
            request.session['pending_order_ids'] = pending_ids
            request.session.modified = True

        return JsonResponse({
            'success': True,
            'order_id': order.id,
            'order_number': order.order_number,
            'token': order.token,
            'amount': float(order.total_amount),
            'gateway_provider': payment.gateway_provider,
            'gateway_order_id': payment.gateway_order_id,
            'redirect_url': f"/orders/pay/{order.id}/"
        })
    except InvalidCartItemError as inv_err:
        return JsonResponse({
            'success': False,
            'error': str(inv_err),
            'invalid_item_id': inv_err.item_id
        }, status=400)
    except ValueError as val_err:
        return JsonResponse({'success': False, 'error': str(val_err)}, status=400)
    except Exception as ex:
        return JsonResponse({'success': False, 'error': f"Failed to initiate order: {str(ex)}"}, status=500)


def pay_order_view(request, order_id):
    """
    Payment gateway screen. Supports Cashfree checkout and sandbox simulation.
    Protected against IDOR: only the session that created the order or authorized staff can access.
    """
    order = get_object_or_404(Order.objects.select_related('payment'), id=order_id)
    payment = getattr(order, 'payment', None)

    if order.payment_status == 'PAID':
        return redirect('order_confirmation', token=order.confirmation_token or order.token)

    pending_ids = request.session.get('pending_order_ids', [])
    authorized_ids = request.session.get('authorized_order_ids', [])
    is_staff = request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)
    token_param = request.GET.get('token', '').strip()

    is_allowed = (
        order.id in pending_ids
        or order.id in authorized_ids
        or is_staff
        or (token_param and (token_param == order.confirmation_token or token_param == order.token))
    )
    if not is_allowed:
        raise Http404("Order not found or authorization expired.")

    context = {
        'order': order,
        'payment': payment,
        'cashfree_environment': getattr(settings, 'CASHFREE_ENVIRONMENT', 'SANDBOX').lower(),
    }
    return render(request, 'orders/payment.html', context)


@require_POST
def verify_payment_view(request, order_id):
    """
    Server-side verification endpoint.
    Authorizes the current session upon verified payment.
    """
    gateway_payment_id = request.POST.get('gateway_payment_id', '')
    gateway_order_id = request.POST.get('gateway_order_id', '')
    simulate_fail = request.POST.get('simulate_fail', 'false') == 'true'

    if simulate_fail:
        order = get_object_or_404(Order, id=order_id)
        if hasattr(order, 'payment'):
            order.payment.status = 'FAILED'
            order.payment.save()
        order.payment_status = 'FAILED'
        order.save()
        return render(request, 'orders/payment_failed.html', {
            'order': order,
            'error_message': 'Simulated payment failure or bank authorization denied.'
        })

    if not gateway_payment_id:
        gateway_payment_id = f"pay_{timezone.now().strftime('%Y%m%d%H%M%S')}"

    success, result = PaymentService.verify_and_confirm_payment(
        order_id=order_id,
        gateway_payment_id=gateway_payment_id,
        gateway_order_id=gateway_order_id
    )

    if success:
        # Securely associate order with current browser session
        authorized_order_ids = request.session.get('authorized_order_ids', [])
        if result.id not in authorized_order_ids:
            authorized_order_ids.append(result.id)
        request.session['authorized_order_ids'] = authorized_order_ids

        confirmed_order_tokens = request.session.get('confirmed_order_tokens', [])
        if result.token not in confirmed_order_tokens:
            confirmed_order_tokens.append(result.token)
        if result.confirmation_token and result.confirmation_token not in confirmed_order_tokens:
            confirmed_order_tokens.append(result.confirmation_token)
        request.session['confirmed_order_tokens'] = confirmed_order_tokens

        request.session['verified_customer_mobile'] = result.customer.mobile
        request.session.modified = True

        return redirect('order_confirmation', token=result.confirmation_token or result.token)
    else:
        order = get_object_or_404(Order, id=order_id)
        return render(request, 'orders/payment_failed.html', {
            'order': order,
            'error_message': result
        })


def order_confirmation_view(request, token):
    """
    Order Confirmed page displaying large token, pickup time, amount, and instructions.
    Strictly verifies that the current browser session is authorized to view this order.
    """
    order = Order.objects.filter(
        Q(confirmation_token=token) | Q(token=token)
    ).select_related('customer').prefetch_related('items__addons').first()
    if not order:
        raise Http404("Order not found.")

    authorized_order_ids = request.session.get('authorized_order_ids', [])
    confirmed_order_tokens = request.session.get('confirmed_order_tokens', [])
    is_staff = request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)

    is_authorized = (
        order.id in authorized_order_ids
        or order.token in confirmed_order_tokens
        or (order.confirmation_token and order.confirmation_token in confirmed_order_tokens)
        or is_staff
    )

    if not is_authorized:
        # Return safe 404 response to prevent token enumeration or information leakage
        raise Http404("Order not found or authorization expired.")

    context = {
        'order': order,
    }
    return render(request, 'orders/confirmation.html', context)


def customer_lookup_view(request):
    """
    Secure customer order lookup strictly restricted to the current authorized browser session.
    Never exposes another customer's orders through raw phone number queries.
    """
    session_mobile = request.session.get('verified_customer_mobile')
    authorized_order_ids = request.session.get('authorized_order_ids', [])

    raw_mobile = (request.GET.get('mobile') or '').strip()
    orders = None
    error_message = None
    has_searched = bool(raw_mobile)

    if not session_mobile or not authorized_order_ids:
        # Unauthenticated / unauthorized session has no active order authorization
        if has_searched:
            error_message = "No active orders found for this device/session. For your security, order tracking is only available on the device where your order was placed."
    else:
        # Session is authorized for session_mobile
        if has_searched:
            if raw_mobile != session_mobile:
                # User typed a different mobile number than the verified session mobile
                error_message = "No active orders found for this device/session. For your security, order tracking is only available on the device where your order was placed."
            else:
                orders = Order.objects.filter(
                    id__in=authorized_order_ids,
                    customer__mobile=session_mobile
                ).prefetch_related('items__addons').order_by('-created_at')[:10]
        else:
            # Automatically load authorized orders for this session
            orders = Order.objects.filter(
                id__in=authorized_order_ids,
                customer__mobile=session_mobile
            ).prefetch_related('items__addons').order_by('-created_at')[:10]

    context = {
        'mobile': session_mobile if (session_mobile and not error_message) else raw_mobile,
        'orders': orders,
        'error_message': error_message,
        'is_authorized_session': bool(session_mobile and authorized_order_ids),
    }
    return render(request, 'orders/lookup.html', context)
