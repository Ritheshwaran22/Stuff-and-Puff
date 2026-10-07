import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from notifications.models import EmailLog

logger = logging.getLogger(__name__)


def _sanitize_string(text: Any, secret: str) -> str:
    """Sanitizes text to guarantee that API secrets are never revealed in logs or returned strings."""
    if not text:
        return ""
    str_text = str(text)
    if secret and secret in str_text:
        str_text = str_text.replace(secret, "[REDACTED_API_KEY]")
    # Also sanitize Cashfree client secret if present
    cf_secret = getattr(settings, 'CASHFREE_CLIENT_SECRET', '')
    if cf_secret and cf_secret in str_text:
        str_text = str_text.replace(cf_secret, "[REDACTED_SECRET]")
    return str_text


def _safe_log_email(recipient_email: str, subject: str, email_type: str, status: str, message_id: str = '', error_message: str = ''):
    """Safely writes an entry to EmailLog without allowing database errors to propagate to callers."""
    try:
        EmailLog.objects.create(
            recipient_email=recipient_email,
            subject=subject,
            email_type=email_type,
            status=status,
            message_id=message_id,
            error_message=error_message
        )
    except Exception as log_ex:
        logger.warning("Failed to record EmailLog entry: %s", log_ex)


def send_transactional_email(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: Optional[str] = None,
    text_content: Optional[str] = None,
    email_type: str = 'TEST'
) -> Dict[str, Any]:
    """
    Sends a transactional email using Brevo's API (sib-api-v3-sdk).
    
    Guarantees:
    - Never exposes API keys in logs or responses.
    - Validates recipient email syntax.
    - Captures and logs all Brevo API and network exceptions safely.
    - Records dispatch history in EmailLog for auditability.
    - Returns a structured dictionary: {'success': bool, 'message_id'?: str, 'error'?: str}.
    """
    to_email = (to_email or '').strip()
    if not to_email:
        logger.warning("Brevo email dispatch aborted: recipient email is missing.")
        return {'success': False, 'error': 'Recipient email is missing.'}

    # Validate email syntax
    try:
        validate_email(to_email)
    except ValidationError:
        err_msg = f"Invalid recipient email format: {to_email}"
        logger.warning("Brevo email dispatch aborted: %s", err_msg)
        _safe_log_email(to_email, subject, email_type, status='FAILED', error_message=err_msg)
        return {'success': False, 'error': err_msg}

    api_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    sender_email = getattr(settings, 'BREVO_SENDER_EMAIL', '').strip()
    sender_name = getattr(settings, 'BREVO_SENDER_NAME', 'Stuff & Puff').strip()

    if not api_key:
        err_msg = "Brevo API key is not configured in settings."
        logger.error(err_msg)
        _safe_log_email(to_email, subject, email_type, status='FAILED', error_message=err_msg)
        return {'success': False, 'error': err_msg}

    if not sender_email:
        err_msg = "Brevo sender email is not configured in settings."
        logger.error(err_msg)
        _safe_log_email(to_email, subject, email_type, status='FAILED', error_message=err_msg)
        return {'success': False, 'error': err_msg}

    # If plain-text content was not explicitly provided, generate it from HTML
    if not text_content:
        text_content = strip_tags(html_content).strip()

    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException

        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = api_key

        api_client = sib_api_v3_sdk.ApiClient(configuration)
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)

        to_recipient = sib_api_v3_sdk.SendSmtpEmailTo(
            email=to_email,
            name=(to_name or to_email).strip()
        )
        sender = sib_api_v3_sdk.SendSmtpEmailSender(
            email=sender_email,
            name=sender_name
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[to_recipient],
            sender=sender,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

        response = api_instance.send_transac_email(send_smtp_email, _request_timeout=10)
        message_id = getattr(response, 'message_id', str(response)) or 'accepted'

        logger.info("Brevo transactional email sent successfully to %s (message_id: %s)", to_email, message_id)
        _safe_log_email(to_email, subject, email_type, status='SENT', message_id=str(message_id))

        return {
            'success': True,
            'message_id': str(message_id)
        }

    except Exception as exc:
        raw_error = str(exc)
        safe_error = _sanitize_string(raw_error, api_key)
        
        # If ApiException, extract cleaner status and reason
        if hasattr(exc, 'status') and hasattr(exc, 'reason'):
            status_code = getattr(exc, 'status', 'Unknown')
            reason = getattr(exc, 'reason', '')
            safe_error = f"Brevo API error ({status_code}): {reason} - {_sanitize_string(getattr(exc, 'body', ''), api_key)}"

        logger.error("Failed to send Brevo email to %s: %s", to_email, safe_error)
        _safe_log_email(to_email, subject, email_type, status='FAILED', error_message=safe_error)

        return {
            'success': False,
            'error': safe_error
        }


class BrevoService:
    """
    High-level Brevo transactional notification service for Stuff & Puff.
    Provides targeted helpers for customer order milestones.
    """

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        to_name: Optional[str] = None,
        text_content: Optional[str] = None,
        email_type: str = 'TEST'
    ) -> Dict[str, Any]:
        """Direct transactional email dispatch wrapper."""
        return send_transactional_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            to_name=to_name,
            text_content=text_content,
            email_type=email_type
        )

    @classmethod
    def send_test_email(cls, to_email: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends a safe connection test email to the sender email address or specified recipient.
        """
        recipient = (to_email or getattr(settings, 'BREVO_SENDER_EMAIL', '')).strip()
        sender_name = getattr(settings, 'BREVO_SENDER_NAME', 'Stuff & Puff')
        subject = "Stuff & Puff — Brevo Test Email"

        context = {
            'recipient_email': recipient,
            'sender_name': sender_name,
            'timestamp': timezone.localtime(timezone.now()),
            'subject': subject
        }

        html_content = render_to_string('emails/test_email.html', context)
        return cls.send_email(
            to_email=recipient,
            subject=subject,
            html_content=html_content,
            to_name=sender_name,
            email_type='TEST'
        )

    @classmethod
    def send_order_created_email(cls, order) -> Dict[str, Any]:
        """
        Customer Milestone 1: Pre-booking / order created.
        Includes order number, pickup token, pickup date/time, total amount, and payment status.
        Guarantees idempotency via order.created_email_sent.
        """
        if getattr(order, 'created_email_sent', False):
            logger.info("Order #%s pre-booking email was already dispatched. Skipping duplicate.", order.order_number)
            return {'success': True, 'skipped': True, 'reason': 'Duplicate order created email prevented'}

        customer_email = getattr(order.customer, 'email', '').strip()
        if not customer_email:
            logger.info("Order #%s customer has no email address. Skipping order created email.", order.order_number)
            return {'success': False, 'skipped': True, 'reason': 'No customer email'}

        pickup_time = timezone.localtime(order.pickup_slot_time)
        pickup_time_str = pickup_time.strftime('%I:%M %p').lstrip('0')
        pickup_date_str = pickup_time.strftime('%b %d, %Y')
        full_pickup_str = f"{pickup_date_str} at {pickup_time_str}"

        # Accurately reflect payment status
        if order.payment_status == 'PAID':
            payment_status_display = "Paid & Verified"
        else:
            payment_status_display = "Payment Pending"

        subject = f"Order #{order.order_number} Received — Token {order.token} | Stuff & Puff"
        context = {
            'order': order,
            'pickup_time_str': full_pickup_str,
            'payment_status_display': payment_status_display,
            'subject': subject
        }

        html_content = render_to_string('emails/order_created.html', context)
        res = cls.send_email(
            to_email=customer_email,
            subject=subject,
            html_content=html_content,
            to_name=order.customer.name,
            email_type='ORDER_CREATED'
        )

        if res.get('success'):
            order.created_email_sent = True
            order.save(update_fields=['created_email_sent'])

        return res

    @classmethod
    def send_order_payment_success_email(cls, order) -> Dict[str, Any]:
        """
        Customer Milestone 2: Successful Cashfree payment.
        Triggered strictly after server-side payment verification.
        Includes order number, pickup token, pickup time, amount paid, and verified payment status.
        Guarantees idempotency via order.payment_email_sent.
        """
        if getattr(order, 'payment_email_sent', False):
            logger.info("Order #%s payment success email was already dispatched. Skipping duplicate.", order.order_number)
            return {'success': True, 'skipped': True, 'reason': 'Duplicate payment success email prevented'}

        customer_email = getattr(order.customer, 'email', '').strip()
        if not customer_email:
            logger.info("Order #%s customer has no email address. Skipping payment success email.", order.order_number)
            return {'success': False, 'skipped': True, 'reason': 'No customer email'}

        pickup_time = timezone.localtime(order.pickup_slot_time)
        pickup_time_str = pickup_time.strftime('%I:%M %p').lstrip('0')
        full_pickup_str = f"{pickup_time.strftime('%b %d, %Y')} at {pickup_time_str}"

        payment = getattr(order, 'payment', None)
        gateway_order_id = getattr(payment, 'gateway_order_id', '') if payment else ''

        subject = f"Payment Confirmed: Order #{order.order_number} (Token {order.token}) | Stuff & Puff"
        context = {
            'order': order,
            'pickup_time_str': full_pickup_str,
            'gateway_order_id': gateway_order_id,
            'subject': subject
        }

        html_content = render_to_string('emails/payment_success.html', context)
        res = cls.send_email(
            to_email=customer_email,
            subject=subject,
            html_content=html_content,
            to_name=order.customer.name,
            email_type='PAYMENT_SUCCESS'
        )

        if res.get('success'):
            order.payment_email_sent = True
            order.save(update_fields=['payment_email_sent'])

        return res

    @classmethod
    def send_order_ready_email(cls, order) -> Dict[str, Any]:
        """
        Customer Milestone 3: Order marked READY by staff.
        Includes order number, pickup token, pickup time, and collection reminder.
        Guarantees idempotency via order.ready_email_sent.
        """
        if getattr(order, 'ready_email_sent', False):
            logger.info("Order #%s ready email was already dispatched. Skipping duplicate.", order.order_number)
            return {'success': True, 'skipped': True, 'reason': 'Duplicate ready email prevented'}

        customer_email = getattr(order.customer, 'email', '').strip()
        if not customer_email:
            logger.info("Order #%s customer has no email address. Skipping order ready email.", order.order_number)
            return {'success': False, 'skipped': True, 'reason': 'No customer email'}

        pickup_time = timezone.localtime(order.pickup_slot_time)
        pickup_time_str = pickup_time.strftime('%I:%M %p').lstrip('0')
        full_pickup_str = f"{pickup_time.strftime('%b %d, %Y')} at {pickup_time_str}"

        subject = f"Your Order {order.token} is READY for Pickup! | Stuff & Puff"
        context = {
            'order': order,
            'pickup_time_str': full_pickup_str,
            'subject': subject
        }

        html_content = render_to_string('emails/order_ready.html', context)
        res = cls.send_email(
            to_email=customer_email,
            subject=subject,
            html_content=html_content,
            to_name=order.customer.name,
            email_type='READY'
        )

        if res.get('success'):
            order.ready_email_sent = True
            order.save(update_fields=['ready_email_sent'])

        return res

    @classmethod
    def send_order_refund_email(cls, order, refund_amount=None, reason="Unexpected shop closure") -> Dict[str, Any]:
        """
        Customer Milestone 4: Unexpected shop closure / refund.
        Includes order number, refund status, amount, and explanation.
        Guarantees idempotency via order.refund_email_sent.
        """
        if getattr(order, 'refund_email_sent', False):
            logger.info("Order #%s refund email was already dispatched. Skipping duplicate.", order.order_number)
            return {'success': True, 'skipped': True, 'reason': 'Duplicate refund email prevented'}

        customer_email = getattr(order.customer, 'email', '').strip()
        if not customer_email:
            logger.info("Order #%s customer has no email address. Skipping order refund email.", order.order_number)
            return {'success': False, 'skipped': True, 'reason': 'No customer email'}

        if refund_amount is None:
            refund_amount = order.total_amount

        subject = f"Refund Initiated: Order #{order.order_number} ({order.token}) | Stuff & Puff"
        context = {
            'order': order,
            'refund_amount': refund_amount,
            'refund_status': 'INITIATED / PROCESSED',
            'reason': reason,
            'subject': subject
        }

        html_content = render_to_string('emails/order_refund.html', context)
        res = cls.send_email(
            to_email=customer_email,
            subject=subject,
            html_content=html_content,
            to_name=order.customer.name,
            email_type='REFUND'
        )

        if res.get('success'):
            order.refund_email_sent = True
            order.save(update_fields=['refund_email_sent'])

        return res
