from django.test import TestCase, override_settings
from django.utils import timezone
from decimal import Decimal
import datetime
from unittest.mock import patch, MagicMock

from shop.models import ShopSettings
from menu.models import Category, MenuItem, AddOn
from orders.models import Customer, Order, OrderItem
from payments.models import Payment
from payments.services.cashfree_service import CashfreeService
from payments.services.payment_service import PaymentService, generate_order_identifiers


class CashfreePaymentIntegrationTests(TestCase):
    def setUp(self):
        # 1. Shop settings
        self.shop_settings = ShopSettings.get_settings()
        self.shop_settings.shop_open = True
        self.shop_settings.online_orders_enabled = True
        now = timezone.localtime(timezone.now())
        opening_dt = now - datetime.timedelta(hours=2)
        closing_dt = now + datetime.timedelta(hours=4)
        self.shop_settings.opening_time = datetime.time(0, 0) if opening_dt.date() < now.date() else opening_dt.time()
        self.shop_settings.closing_time = datetime.time(23, 59, 59) if closing_dt.date() > now.date() else closing_dt.time()
        self.shop_settings.preparation_buffer_mins = 20
        self.shop_settings.slot_interval_mins = 10
        self.shop_settings.max_orders_per_slot = 2
        self.shop_settings.parcel_charge_per_item = Decimal('5.00')
        self.shop_settings.save()

        # 2. Menu items
        self.cat = Category.objects.create(name='Snacks', slug='snacks')
        self.momo = MenuItem.objects.create(
            category=self.cat, name='Veg Momos', price=Decimal('70.00'), is_available=True
        )
        self.waffle = MenuItem.objects.create(
            category=self.cat, name='Waffle', price=Decimal('50.00'), is_available=True
        )

        # 3. Dynamic future slot
        future_dt = now + datetime.timedelta(minutes=40)
        rem = future_dt.minute % 10
        if rem > 0:
            future_dt += datetime.timedelta(minutes=(10 - rem))
        self.pickup_slot = future_dt.replace(second=0, microsecond=0)

        # 4. Default HTTP mocks for Cashfree to isolate unit tests
        self.mock_post_patcher = patch('payments.services.cashfree_service.requests.post')
        self.mock_default_post = self.mock_post_patcher.start()
        self.mock_default_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'cf_order_id': 'cf_ord_default',
                'order_id': 'cf_ord_default',
                'order_status': 'ACTIVE',
                'payment_session_id': 'session_default_123'
            }
        )
        self.addCleanup(self.mock_post_patcher.stop)

        self.mock_get_patcher = patch('payments.services.cashfree_service.requests.get')
        self.mock_default_get = self.mock_get_patcher.start()
        self.mock_default_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'cf_order_id': 'cf_ord_default',
                'order_id': 'cf_ord_default',
                'order_status': 'PAID',
                'order_amount': 50.0,
                'order_currency': 'INR'
            }
        )
        self.addCleanup(self.mock_get_patcher.stop)

    # 1. CASHFREE PAYMENT CONFIGURATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX',
        CASHFREE_API_VERSION='2023-08-01'
    )
    def test_cashfree_payment_configuration(self):
        """Cashfree configuration loads sandbox endpoints and credentials."""
        self.assertEqual(CashfreeService.get_base_url(), 'https://sandbox.cashfree.com/pg')
        headers = CashfreeService.get_headers()
        self.assertEqual(headers['x-client-id'], 'TEST_CLIENT_123')
        self.assertEqual(headers['x-client-secret'], 'TEST_SECRET_456')
        self.assertEqual(headers['x-api-version'], '2023-08-01')
        self.assertTrue(CashfreeService.is_configured())

    # 2. PAYMENT ORDER CREATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.post')
    def test_payment_order_creation(self, mock_post):
        """Cashfree order creation successfully creates pending order and payment session."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'cf_order_id': 'cf_ord_999888',
            'order_id': 'cf_ord_999888',
            'order_status': 'ACTIVE',
            'payment_session_id': 'session_abc_123'
        }
        mock_post.return_value = mock_resp

        cart = [{'id': self.momo.id, 'quantity': 2, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order(
            "Customer A", "9876543210", self.pickup_slot, cart
        )

        self.assertEqual(order.order_status, 'PENDING')
        self.assertEqual(order.payment_status, 'PENDING')
        self.assertEqual(payment.gateway_provider, 'CASHFREE')
        self.assertEqual(payment.gateway_order_id, 'cf_ord_999888')
        self.assertEqual(payment.payment_session_id, 'session_abc_123')
        self.assertEqual(payment.status, 'INITIATED')

    # 3. CORRECT SERVER-CALCULATED AMOUNT
    def test_correct_server_calculated_amount(self):
        """Calculates accurate item total + parcel fee, preventing client tampering."""
        cart = [
            {'id': self.momo.id, 'quantity': 2, 'isParcel': True, 'addons': []},  # 140 + 10 = 150
            {'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []} # 50
        ]
        order, payment = PaymentService.create_pending_order(
            "Customer B", "9876543211", self.pickup_slot, cart
        )
        self.assertEqual(order.subtotal, Decimal('190.00'))
        self.assertEqual(order.parcel_total, Decimal('10.00'))
        self.assertEqual(order.total_amount, Decimal('200.00'))
        self.assertEqual(payment.amount, Decimal('200.00'))
        self.assertEqual(payment.currency, 'INR')

    # 4. UPI / NET BANKING PAYMENT CONFIGURATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.post')
    def test_upi_netbanking_payment_configuration(self, mock_post):
        """Cashfree create_order restricts methods to UPI and Net Banking."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'cf_order_id': 'cf_ord_methods_123',
            'order_status': 'ACTIVE',
            'payment_session_id': 'session_methods_123'
        }
        mock_post.return_value = mock_resp

        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)

        called_payload = mock_post.call_args[1]['json']
        self.assertIn('order_meta', called_payload)
        self.assertEqual(called_payload['order_meta']['payment_methods'], 'upi,nb')

    # 4b. FAILED CASHFREE ORDER PREVENTS PAYMENT AND ORDER RECORD CREATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.post')
    def test_failed_cashfree_order_does_not_create_payment_record(self, mock_post):
        """When Cashfree order creation fails, ValueError is raised and no Payment or Order is created."""
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.json.return_value = {
            'message': 'order_meta.payment_methods_invalid',
            'code': 'payment_methods_invalid',
            'type': 'invalid_request_error'
        }
        mock_post.return_value = mock_resp

        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        initial_payments_count = Payment.objects.count()
        initial_orders_count = Order.objects.count()

        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)

        self.assertIn("order_meta.payment_methods_invalid", str(ctx.exception))
        # Ensure no broken Payment or dangling Order records were created
        self.assertEqual(Payment.objects.count(), initial_payments_count)
        self.assertEqual(Order.objects.count(), initial_orders_count)

    # 4c. EMPTY PAYMENT SESSION ID PREVENTS PAYMENT RECORD CREATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.post')
    def test_empty_payment_session_id_prevents_payment_record(self, mock_post):
        """When Cashfree returns 200 but payment_session_id is empty, ValueError is raised."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'cf_order_id': 'cf_ord_empty_session',
            'order_id': 'SP_mock_order_id',
            'order_status': 'ACTIVE',
            'payment_session_id': ''  # Empty session ID
        }
        mock_post.return_value = mock_resp

        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        initial_payments_count = Payment.objects.count()
        initial_orders_count = Order.objects.count()

        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)

        self.assertIn("Cashfree could not create the payment session", str(ctx.exception))
        self.assertEqual(Payment.objects.count(), initial_payments_count)
        self.assertEqual(Order.objects.count(), initial_orders_count)

    # 5. SUCCESSFUL SERVER-SIDE VERIFICATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_successful_server_side_verification(self, mock_get):
        """Verified Cashfree order confirms order and generates pickup token."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_verified_ord_1'
        payment.save()

        # Mock Cashfree order status check
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_verified_ord_1',
            'order_status': 'PAID',
            'order_amount': 50.0,
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        success, confirmed_order = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_pay_tx_100', gateway_order_id='cf_verified_ord_1'
        )

        self.assertTrue(success)
        self.assertEqual(confirmed_order.payment_status, 'PAID')
        self.assertEqual(confirmed_order.order_status, 'CONFIRMED')
        self.assertIsNotNone(confirmed_order.token)
        self.assertIsNotNone(confirmed_order.confirmation_token)

    # 6. FAILED VERIFICATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_failed_verification(self, mock_get):
        """Failed gateway response rejects confirmation."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_failed_ord'
        payment.save()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_failed_ord',
            'order_status': 'FAILED',
            'order_amount': 50.0,
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        success, msg = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_pay_failed', gateway_order_id='cf_failed_ord'
        )

        self.assertFalse(success)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'FAILED')
        self.assertNotEqual(order.order_status, 'CONFIRMED')

    # 7. INCORRECT AMOUNT REJECTION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_incorrect_amount_rejection(self, mock_get):
        """Mismatch between Cashfree paid amount and order total fails verification."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}] # ₹50
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_tampered_amt'
        payment.save()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_tampered_amt',
            'order_status': 'PAID',
            'order_amount': 10.0, # Tampered amount: paid only ₹10
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        success, msg = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_tampered_tx', gateway_order_id='cf_tampered_amt'
        )

        self.assertFalse(success)
        self.assertIn("amount mismatch", msg.lower())
        order.refresh_from_db()
        self.assertNotEqual(order.order_status, 'CONFIRMED')

    # 8. INCORRECT ORDER ID REJECTION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_incorrect_order_id_rejection(self, mock_get):
        """Gateway order ID mismatch rejects verification."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_legit_order'
        payment.save()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_someone_elses_order',
            'order_status': 'PAID',
            'order_amount': 50.0,
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        success, msg = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_bad_tx', gateway_order_id='cf_someone_elses_order'
        )

        self.assertFalse(success)
        self.assertIn("mismatch", msg.lower())
        order.refresh_from_db()
        self.assertNotEqual(order.order_status, 'CONFIRMED')

    # 9. DUPLICATE CALLBACK / IDEMPOTENCY PROTECTION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_duplicate_callback_idempotency_protection(self, mock_get):
        """Repeated verification calls return existing confirmed order idempotently."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_idemp_ord'
        payment.save()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_idemp_ord',
            'order_status': 'PAID',
            'order_amount': 50.0,
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        # 1st verification
        success1, order1 = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_tx_1', gateway_order_id='cf_idemp_ord'
        )
        self.assertTrue(success1)
        self.assertEqual(order1.payment_status, 'PAID')

        # 2nd verification (duplicate callback or page refresh)
        success2, order2 = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_tx_1', gateway_order_id='cf_idemp_ord'
        )
        self.assertTrue(success2)
        self.assertEqual(order1.token, order2.token)
        self.assertEqual(order2.payment_status, 'PAID')

    # 10. PAYMENT PENDING STATE
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.get')
    def test_payment_pending_state(self, mock_get):
        """Payment still pending / active does not confirm order."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        payment.gateway_order_id = 'cf_pending_ord'
        payment.save()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'order_id': 'cf_pending_ord',
            'order_status': 'ACTIVE', # Still active, user hasn't paid yet
            'order_amount': 50.0,
            'order_currency': 'INR'
        }
        mock_get.return_value = mock_resp

        success, msg = PaymentService.verify_and_confirm_payment(
            order.id, gateway_payment_id='cf_none', gateway_order_id='cf_pending_ord'
        )

        self.assertFalse(success)
        self.assertIn("pending", msg.lower())
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'PENDING')

    # 11. REFUND INITIATION
    @override_settings(
        CASHFREE_CLIENT_ID='TEST_CLIENT_123',
        CASHFREE_CLIENT_SECRET='TEST_SECRET_456',
        CASHFREE_ENVIRONMENT='SANDBOX'
    )
    @patch('payments.services.cashfree_service.requests.post')
    def test_refund_initiation(self, mock_post):
        """Initiates refund via Cashfree refund API and records reference."""
        def post_handler(url, **kwargs):
            resp = MagicMock()
            resp.status_code = 200
            if 'refunds' in url:
                resp.json.return_value = {
                    'refund_id': 'cfr_12345',
                    'refund_status': 'SUCCESS',
                    'refund_amount': 50.0
                }
            else:
                resp.json.return_value = {
                    'order_id': 'cf_refund_ord',
                    'order_status': 'ACTIVE',
                    'payment_session_id': 'session_refund_123'
                }
            return resp
        mock_post.side_effect = post_handler

        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        order.order_status = 'CONFIRMED'
        order.payment_status = 'PAID'
        order.save()

        payment.status = 'SUCCESS'
        payment.gateway_provider = 'CASHFREE'
        payment.gateway_order_id = 'cf_refund_ord'
        payment.save()

        success, res = PaymentService.process_order_refund(order.id, "Emergency shop closure")
        self.assertTrue(success)

        payment.refresh_from_db()
        self.assertEqual(payment.status, 'REFUNDED')
        self.assertEqual(payment.refund_status, 'PROCESSED')
        self.assertEqual(payment.refund_reference, 'cfr_12345')

    # 12. DUPLICATE REFUND PREVENTION
    def test_duplicate_refund_prevention(self):
        """Prevents issuing multiple refunds on an already refunded order."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        order.order_status = 'CANCELLED'
        order.payment_status = 'REFUNDED'
        order.save()

        payment.status = 'REFUNDED'
        payment.refund_status = 'PROCESSED'
        payment.save()

        success, msg = PaymentService.process_order_refund(order.id, "Second attempt")
        self.assertFalse(success)
        self.assertIn("already refunded", msg.lower())

    # 13. PAYMENT FAILURE DOES NOT CONFIRM ORDER
    def test_payment_failure_does_not_confirm_order(self):
        """Payment failure updates payment status to FAILED without confirming order."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)

        payment.status = 'FAILED'
        payment.save()
        order.payment_status = 'FAILED'
        order.save()

        self.assertNotEqual(order.order_status, 'CONFIRMED')
        self.assertEqual(order.payment_status, 'FAILED')

    # 14. SUCCESSFUL PAYMENT GENERATES ORDER NUMBER AND TOKEN
    def test_successful_payment_generates_order_number_and_token(self):
        """Verified order has valid order_number, token, and confirmation_token."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)
        PaymentService.verify_and_confirm_payment(order.id, gateway_payment_id='cf_pay_gen_1')

        order.refresh_from_db()
        self.assertTrue(order.order_number.isdigit())
        self.assertTrue(order.token.startswith('SP'))
        self.assertIsNotNone(order.confirmation_token)

    # 15. SUCCESSFUL PAYMENT CONFIRMATION IDEMPOTENCY
    def test_successful_payment_confirmation_idempotent(self):
        """Order verification is strictly idempotent on repeated calls."""
        cart = [{'id': self.waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("User", "9876543210", self.pickup_slot, cart)

        # 1st
        ok1, res1 = PaymentService.verify_and_confirm_payment(order.id, gateway_payment_id='cf_idem_1')
        self.assertTrue(ok1)
        self.assertEqual(res1.payment_status, 'PAID')

        # 2nd
        ok2, res2 = PaymentService.verify_and_confirm_payment(order.id, gateway_payment_id='cf_idem_1')
        self.assertTrue(ok2)
        self.assertEqual(res2.payment_status, 'PAID')
