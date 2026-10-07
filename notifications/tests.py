from unittest.mock import patch, MagicMock
from decimal import Decimal
from django.test import TestCase, override_settings, Client
from django.utils import timezone
from django.core.management import call_command
import datetime
import json

from notifications.models import EmailLog
from notifications.brevo_service import BrevoService, send_transactional_email, _sanitize_string
from orders.models import Customer, Order, OrderItem
from payments.models import Payment
from payments.services.payment_service import PaymentService
from menu.models import Category, MenuItem
from shop.models import ShopSettings


class BrevoSanitizationTests(TestCase):
    def test_sanitize_string_replaces_api_key(self):
        secret = "secret-key-12345"
        text = f"API error with key {secret} failed"
        sanitized = _sanitize_string(text, secret)
        self.assertNotIn(secret, sanitized)
        self.assertIn("[REDACTED_API_KEY]", sanitized)

    def test_sanitize_string_handles_empty(self):
        self.assertEqual(_sanitize_string("", "secret"), "")
        self.assertEqual(_sanitize_string(None, "secret"), "")


@override_settings(
    BREVO_API_KEY='test-brevo-key-123',
    BREVO_SENDER_EMAIL='sender@stuffandpuff.test',
    BREVO_SENDER_NAME='Stuff & Puff Test'
)
class BrevoServiceUnitTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            name="John Doe",
            mobile="9876543210",
            email="johndoe@example.com"
        )
        self.customer_no_email = Customer.objects.create(
            name="No Email Cust",
            mobile="9876543211",
            email=""
        )
        self.category = Category.objects.create(name="Momos", slug="momos")
        self.item = MenuItem.objects.create(
            category=self.category,
            name="Steamed Veg Momos",
            price=Decimal("70.00"),
            is_available=True
        )
        now = timezone.now()
        self.order = Order.objects.create(
            order_number="9901",
            token="SP9901",
            customer=self.customer,
            pickup_slot_time=now + datetime.timedelta(minutes=30),
            subtotal=Decimal("70.00"),
            total_amount=Decimal("70.00"),
            order_status="PENDING",
            payment_status="PENDING"
        )
        OrderItem.objects.create(
            order=self.order,
            menu_item=self.item,
            item_name_snapshot="Steamed Veg Momos",
            quantity=1,
            unit_price_snapshot=Decimal("70.00"),
            line_total=Decimal("70.00")
        )

    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    def test_send_transactional_email_success(self, mock_api_cls):
        mock_instance = MagicMock()
        mock_api_cls.return_value = mock_instance
        mock_response = MagicMock()
        mock_response.message_id = "msg-uuid-abc-123"
        mock_instance.send_transac_email.return_value = mock_response

        res = send_transactional_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Hello Test</p>",
            to_name="Test User"
        )

        self.assertTrue(res['success'])
        self.assertEqual(res['message_id'], "msg-uuid-abc-123")
        self.assertEqual(EmailLog.objects.count(), 1)
        log = EmailLog.objects.first()
        self.assertEqual(log.recipient_email, "test@example.com")
        self.assertEqual(log.status, 'SENT')
        self.assertEqual(log.message_id, "msg-uuid-abc-123")

    @override_settings(BREVO_API_KEY='')
    def test_send_transactional_email_missing_api_key(self):
        res = send_transactional_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test</p>"
        )
        self.assertFalse(res['success'])
        self.assertIn("not configured", res['error'])
        log = EmailLog.objects.first()
        self.assertEqual(log.status, 'FAILED')

    def test_send_transactional_email_missing_recipient(self):
        res = send_transactional_email(
            to_email="",
            subject="Test",
            html_content="<p>Test</p>"
        )
        self.assertFalse(res['success'])
        self.assertIn("Recipient email is missing", res['error'])

    @patch('sib_api_v3_sdk.TransactionalEmailsApi')
    def test_send_transactional_email_api_exception_safety(self, mock_api_cls):
        mock_instance = MagicMock()
        mock_api_cls.return_value = mock_instance
        mock_instance.send_transac_email.side_effect = Exception("Brevo connection timeout with test-brevo-key-123")

        res = send_transactional_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Hello Test</p>"
        )

        self.assertFalse(res['success'])
        # Verify secret was sanitized
        self.assertNotIn("test-brevo-key-123", res['error'])
        self.assertIn("[REDACTED_API_KEY]", res['error'])
        log = EmailLog.objects.first()
        self.assertEqual(log.status, 'FAILED')
        self.assertNotIn("test-brevo-key-123", log.error_message)

    @patch.object(BrevoService, 'send_email')
    def test_send_order_created_email_with_email(self, mock_send):
        mock_send.return_value = {'success': True, 'message_id': 'created-123'}
        res = BrevoService.send_order_created_email(self.order)
        self.assertTrue(res['success'])
        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args[1]
        self.assertEqual(call_kwargs['to_email'], "johndoe@example.com")
        self.assertIn("SP9901", call_kwargs['subject'])
        self.order.refresh_from_db()
        self.assertTrue(self.order.created_email_sent)

    def test_send_order_created_email_without_email(self):
        self.order.customer = self.customer_no_email
        self.order.save()
        res = BrevoService.send_order_created_email(self.order)
        self.assertFalse(res['success'])
        self.assertTrue(res.get('skipped'))

    @patch.object(BrevoService, 'send_email')
    def test_send_order_payment_success_email(self, mock_send):
        mock_send.return_value = {'success': True, 'message_id': 'paid-123'}
        res = BrevoService.send_order_payment_success_email(self.order)
        self.assertTrue(res['success'])
        mock_send.assert_called_once()
        self.assertIn("Payment Confirmed", mock_send.call_args[1]['subject'])
        self.order.refresh_from_db()
        self.assertTrue(self.order.payment_email_sent)

    @patch.object(BrevoService, 'send_email')
    def test_send_order_ready_email(self, mock_send):
        mock_send.return_value = {'success': True, 'message_id': 'ready-123'}
        res = BrevoService.send_order_ready_email(self.order)
        self.assertTrue(res['success'])
        mock_send.assert_called_once()
        self.assertIn("READY", mock_send.call_args[1]['subject'])
        self.order.refresh_from_db()
        self.assertTrue(self.order.ready_email_sent)

    @patch.object(BrevoService, 'send_email')
    def test_send_order_refund_email(self, mock_send):
        mock_send.return_value = {'success': True, 'message_id': 'refund-123'}
        res = BrevoService.send_order_refund_email(self.order, Decimal("70.00"), "Shop closure")
        self.assertTrue(res['success'])
        mock_send.assert_called_once()
        self.assertIn("Refund", mock_send.call_args[1]['subject'])
        self.order.refresh_from_db()
        self.assertTrue(self.order.refund_email_sent)

    @patch.object(BrevoService, 'send_test_email')
    def test_test_brevo_email_management_command(self, mock_test):
        mock_test.return_value = {'success': True, 'message_id': 'test-cmd-123'}
        call_command('test_brevo_email')
        mock_test.assert_called_once()


@override_settings(
    BREVO_API_KEY='test-brevo-key-123',
    BREVO_SENDER_EMAIL='sender@stuffandpuff.test',
    BREVO_SENDER_NAME='Stuff & Puff Test',
    CASHFREE_CLIENT_ID='',
    CASHFREE_CLIENT_SECRET=''
)
class BrevoOrderWorkflowIntegrationTests(TestCase):
    def setUp(self):
        self.shop_settings = ShopSettings.get_settings()
        self.shop_settings.shop_open = True
        self.shop_settings.online_orders_enabled = True
        self.shop_settings.opening_time = datetime.time(0, 0)
        self.shop_settings.closing_time = datetime.time(23, 59)
        self.shop_settings.preparation_buffer_mins = 20
        self.shop_settings.slot_interval_mins = 10
        self.shop_settings.max_orders_per_slot = 2
        self.shop_settings.parcel_charge_per_item = Decimal('5.00')
        self.shop_settings.save()

        self.category = Category.objects.create(name="Momos", slug="momos")
        self.item = MenuItem.objects.create(
            category=self.category,
            name="Veg Momos",
            price=Decimal("70.00"),
            is_available=True
        )
        self.client = Client()

    @patch('payments.services.cashfree_service.CashfreeService.create_order')
    @patch.object(BrevoService, 'send_email')
    def test_1_order_created_does_not_send_email_before_payment(self, mock_email, mock_cf_create):
        """Pre-payment order creation must NEVER send an order confirmation or pending email."""
        mock_cf_create.return_value = {
            'success': True,
            'gateway_order_id': 'cf_order_test_101',
            'payment_session_id': 'sess_101'
        }
        mock_email.return_value = {'success': True, 'message_id': 'brevo-create-101'}

        future_slot = timezone.now() + datetime.timedelta(minutes=40)
        order, payment = PaymentService.create_pending_order(
            customer_name="Alice",
            customer_mobile="9876543210",
            pickup_slot_dt=future_slot,
            cart_items=[{'id': self.item.id, 'quantity': 1, 'isParcel': False, 'addons': []}],
            customer_email="alice@example.com"
        )

        self.assertEqual(order.payment_status, 'PENDING')
        mock_email.assert_not_called()
        order.refresh_from_db()
        self.assertFalse(order.payment_email_sent)
        self.assertFalse(order.created_email_sent)

    @patch.object(BrevoService, 'send_email')
    def test_2_duplicate_created_email_prevented(self, mock_email):
        mock_email.return_value = {'success': True, 'message_id': 'msg-1'}
        cust = Customer.objects.create(name="Bob", mobile="9876543212", email="bob@example.com")
        order = Order.objects.create(
            order_number="7001",
            token="SP7001",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            created_email_sent=True
        )

        res = BrevoService.send_order_created_email(order)
        self.assertTrue(res['skipped'])
        mock_email.assert_not_called()

    @patch('payments.services.cashfree_service.CashfreeService.get_order_status')
    @patch.object(BrevoService, 'send_email')
    def test_3_payment_success_email_only_after_verified_cashfree_success(self, mock_email, mock_cf_status):
        mock_cf_status.return_value = {
            'success': True,
            'order_id': 'cf_order_7002',
            'order_status': 'PAID',
            'order_amount': 70.00,
            'order_currency': 'INR'
        }
        mock_email.return_value = {'success': True, 'message_id': 'brevo-paid-7002'}

        cust = Customer.objects.create(name="Charlie", mobile="9876543213", email="charlie@example.com")
        order = Order.objects.create(
            order_number="7002",
            token="SP7002",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PENDING'
        )
        Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7002',
            payment_session_id='sess_7002',
            status='INITIATED'
        )

        success, verified_order = PaymentService.verify_and_confirm_payment(
            order_id=order.id,
            gateway_order_id='cf_order_7002'
        )

        self.assertTrue(success)
        self.assertEqual(verified_order.payment_status, 'PAID')
        mock_email.assert_called_once()
        call_kwargs = mock_email.call_args[1]
        self.assertIn("Payment Confirmed", call_kwargs['subject'])
        self.assertIn("Payment Successful", call_kwargs['html_content'])
        verified_order.refresh_from_db()
        self.assertTrue(verified_order.payment_email_sent)

    @patch('payments.services.cashfree_service.CashfreeService.get_order_status')
    @patch.object(BrevoService, 'send_email')
    def test_4_payment_redirect_alone_cannot_trigger_payment_success_email(self, mock_email, mock_cf_status):
        # Gateway returns not paid (e.g. USER_DROPPED or ACTIVE)
        mock_cf_status.return_value = {
            'success': True,
            'order_id': 'cf_order_7003',
            'order_status': 'ACTIVE',
            'order_amount': 70.00,
            'order_currency': 'INR'
        }

        cust = Customer.objects.create(name="David", mobile="9876543214", email="david@example.com")
        order = Order.objects.create(
            order_number="7003",
            token="SP7003",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PENDING'
        )
        Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7003',
            payment_session_id='sess_7003',
            status='INITIATED'
        )

        # Customer arrives at cashfree_return_view
        resp = self.client.get(f'/payments/cashfree/return/?order_id=cf_order_7003')
        order.refresh_from_db()

        self.assertNotEqual(order.payment_status, 'PAID')
        self.assertFalse(order.payment_email_sent)
        mock_email.assert_not_called()

    @patch('payments.services.cashfree_service.CashfreeService.get_order_status')
    @patch.object(BrevoService, 'send_email')
    def test_5_repeated_requests_do_not_create_duplicate_payment_emails(self, mock_email, mock_cf_status):
        mock_cf_status.return_value = {
            'success': True,
            'order_id': 'cf_order_7004',
            'order_status': 'PAID',
            'order_amount': 70.00,
            'order_currency': 'INR'
        }
        mock_email.return_value = {'success': True, 'message_id': 'brevo-paid-7004'}

        cust = Customer.objects.create(name="Eve", mobile="9876543215", email="eve@example.com")
        order = Order.objects.create(
            order_number="7004",
            token="SP7004",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PENDING'
        )
        payment = Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7004',
            payment_session_id='sess_7004',
            status='INITIATED'
        )

        # First verification succeeds and sends email
        PaymentService.verify_and_confirm_payment(order_id=order.id, gateway_order_id='cf_order_7004')
        self.assertEqual(mock_email.call_count, 1)

        # Repeated call (e.g. browser refresh or duplicate webhook)
        PaymentService.verify_and_confirm_payment(order_id=order.id, gateway_order_id='cf_order_7004')
        self.assertEqual(mock_email.call_count, 1)

    @patch('payments.services.cashfree_service.CashfreeService.get_order_status')
    @patch.object(BrevoService, 'send_email')
    def test_6_brevo_failure_does_not_break_order_workflow(self, mock_email, mock_cf_status):
        mock_cf_status.return_value = {
            'success': True,
            'order_id': 'cf_order_7005',
            'order_status': 'PAID',
            'order_amount': 70.00,
            'order_currency': 'INR'
        }
        # Brevo fails
        mock_email.side_effect = Exception("Brevo network timeout")

        cust = Customer.objects.create(name="Frank", mobile="9876543216", email="frank@example.com")
        order = Order.objects.create(
            order_number="7005",
            token="SP7005",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PENDING'
        )
        payment = Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7005',
            payment_session_id='sess_7005',
            status='INITIATED'
        )

        # Payment confirmation MUST still succeed
        success, confirmed_order = PaymentService.verify_and_confirm_payment(
            order_id=order.id,
            gateway_order_id='cf_order_7005'
        )

        self.assertTrue(success)
        self.assertEqual(confirmed_order.payment_status, 'PAID')
        self.assertEqual(confirmed_order.order_status, 'CONFIRMED')
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'SUCCESS')

    def test_7_invalid_email_syntax_handled_safely(self):
        res = send_transactional_email(
            to_email="invalid-not-an-email",
            subject="Test",
            html_content="<p>Test</p>"
        )
        self.assertFalse(res['success'])
        self.assertIn("Invalid recipient email format", res['error'])
        log = EmailLog.objects.filter(recipient_email="invalid-not-an-email").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, 'FAILED')

    @patch('payments.services.cashfree_service.CashfreeService.create_order')
    @patch.object(BrevoService, 'send_email')
    def test_8_order_creation_never_calls_brevo(self, mock_email, mock_cf_create):
        mock_cf_create.return_value = {
            'success': True,
            'gateway_order_id': 'cf_order_test_7006',
            'payment_session_id': 'sess_7006'
        }

        future_slot = timezone.now() + datetime.timedelta(minutes=40)
        order, payment = PaymentService.create_pending_order(
            customer_name="Grace",
            customer_mobile="9876543217",
            pickup_slot_dt=future_slot,
            cart_items=[{'id': self.item.id, 'quantity': 1, 'isParcel': False, 'addons': []}],
            customer_email="grace@example.com"
        )

        # Order creation must succeed with 0 email calls
        self.assertIsNotNone(order.id)
        self.assertEqual(order.payment_status, 'PENDING')
        self.assertEqual(payment.status, 'INITIATED')
        mock_email.assert_not_called()

    @patch('payments.services.cashfree_service.CashfreeService.initiate_refund')
    @patch.object(BrevoService, 'send_email')
    def test_9_refund_email_triggered_and_idempotent(self, mock_email, mock_cf_refund):
        mock_cf_refund.return_value = {'success': True, 'cf_refund_id': 'cf_ref_123'}
        mock_email.return_value = {'success': True, 'message_id': 'brevo-ref-123'}

        cust = Customer.objects.create(name="Hannah", mobile="9876543218", email="hannah@example.com")
        order = Order.objects.create(
            order_number="7007",
            token="SP7007",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PAID',
            order_status='CONFIRMED'
        )
        Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7007',
            payment_session_id='sess_7007',
            status='SUCCESS'
        )

        success, msg = PaymentService.process_order_refund(order.id, reason="Emergency closure")
        self.assertTrue(success)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'REFUNDED')
        self.assertEqual(order.order_status, 'CANCELLED')
        self.assertTrue(order.refund_email_sent)
        self.assertEqual(mock_email.call_count, 1)

        # Repeated refund attempt is rejected and duplicate email is NOT sent
        success_2, msg_2 = PaymentService.process_order_refund(order.id, reason="Emergency closure")
        self.assertFalse(success_2)
        self.assertEqual(mock_email.call_count, 1)

    @patch('payments.services.cashfree_service.CashfreeService.initiate_refund')
    @patch.object(BrevoService, 'send_email')
    def test_10_brevo_failure_does_not_break_refund_processing(self, mock_email, mock_cf_refund):
        mock_cf_refund.return_value = {'success': True, 'cf_refund_id': 'cf_ref_456'}
        mock_email.side_effect = Exception("Brevo refund email down")

        cust = Customer.objects.create(name="Ivan", mobile="9876543219", email="ivan@example.com")
        order = Order.objects.create(
            order_number="7008",
            token="SP7008",
            customer=cust,
            pickup_slot_time=timezone.now() + datetime.timedelta(minutes=40),
            total_amount=Decimal("70.00"),
            payment_status='PAID',
            order_status='CONFIRMED'
        )
        Payment.objects.create(
            order=order,
            amount=Decimal("70.00"),
            currency='INR',
            gateway_provider='CASHFREE',
            gateway_order_id='cf_order_7008',
            payment_session_id='sess_7008',
            status='SUCCESS'
        )

        success, msg = PaymentService.process_order_refund(order.id, reason="Rain closure")
        self.assertTrue(success)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'REFUNDED')

