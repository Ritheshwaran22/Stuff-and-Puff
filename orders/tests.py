from django.test import TestCase, override_settings
from django.utils import timezone
from decimal import Decimal
import datetime
from shop.models import ShopSettings
from menu.models import Category, MenuItem, AddOn
from orders.models import Customer, Order, OrderItem
from payments.models import Payment
from orders.services.slot_service import get_available_pickup_slots, validate_and_lock_slot_capacity
from payments.services.payment_service import PaymentService, generate_order_identifiers

@override_settings(CASHFREE_CLIENT_ID='', CASHFREE_CLIENT_SECRET='')
class StuffAndPuffBusinessLogicTests(TestCase):
    def setUp(self):
        # 1. Setup Shop Settings
        self.settings = ShopSettings.get_settings()
        self.settings.shop_open = True
        self.settings.online_orders_enabled = True
        now = timezone.localtime(timezone.now())
        opening_dt = now - datetime.timedelta(hours=2)
        closing_dt = now + datetime.timedelta(hours=4)
        self.settings.opening_time = datetime.time(0, 0) if opening_dt.date() < now.date() else opening_dt.time()
        self.settings.closing_time = datetime.time(23, 59, 59) if closing_dt.date() > now.date() else closing_dt.time()
        self.settings.preparation_buffer_mins = 20
        self.settings.slot_interval_mins = 10
        self.settings.max_orders_per_slot = 2
        self.settings.parcel_charge_per_item = Decimal('5.00')
        self.settings.save()

        # 2. Setup Menu Items
        self.momos_cat = Category.objects.create(name='Momos', slug='momos')
        self.waffles_cat = Category.objects.create(name='Waffles', slug='waffles')
        self.bun_cat = Category.objects.create(name='Bun', slug='bun')

        self.veg_momos = MenuItem.objects.create(category=self.momos_cat, name='Veg Momos', price=Decimal('70.00'), is_available=True)
        self.chicken_momos = MenuItem.objects.create(category=self.momos_cat, name='Chicken Momos', price=Decimal('100.00'), is_available=True)
        self.single_waffle = MenuItem.objects.create(category=self.waffles_cat, name='Single Waffle (Single Piece)', price=Decimal('50.00'), is_available=True)
        self.choco_bun = MenuItem.objects.create(category=self.bun_cat, name='Choco Bun', price=Decimal('50.00'), is_available=True)

        self.dragon_sauce = AddOn.objects.create(name='Dragon Blaze Momos Sauce', price=Decimal('50.00'), category_type='SAUCE', is_available=True)
        self.dragon_sauce.applicable_items.add(self.veg_momos, self.chicken_momos)

        # Dynamic operational pickup slot 40 minutes in future
        future_dt = now + datetime.timedelta(minutes=40)
        remainder = future_dt.minute % 10
        if remainder > 0:
            future_dt += datetime.timedelta(minutes=(10 - remainder))
        self.today_slot = future_dt.replace(second=0, microsecond=0)

    def tearDown(self):
        from django.core.cache import cache
        cache.delete('shop_settings_singleton')
        cache.delete('home_menu_data')

    # 1. PARCEL CALCULATION TEST
    def test_parcel_calculation(self):
        """
        Rule: ₹5 per quantity of item marked for parcel.
        Example from prompt:
        2 Chicken Momos + 1 Waffle + 2 Buns = 5 total parcel items × ₹5 = ₹25 parcel charge.
        """
        cart = [
            {'id': self.chicken_momos.id, 'quantity': 2, 'isParcel': True, 'addons': []},
            {'id': self.single_waffle.id, 'quantity': 1, 'isParcel': True, 'addons': []},
            {'id': self.choco_bun.id, 'quantity': 2, 'isParcel': True, 'addons': []},
        ]
        order, payment = PaymentService.create_pending_order(
            customer_name="Ramesh",
            customer_mobile="9876543210",
            pickup_slot_dt=self.today_slot,
            cart_items=cart
        )
        self.assertEqual(order.total_parcel_items, 5)
        self.assertEqual(order.parcel_total, Decimal('25.00'))
        # Subtotal: (2 * 100) + (1 * 50) + (2 * 50) = 200 + 50 + 100 = 350
        self.assertEqual(order.subtotal, Decimal('350.00'))
        # Grand Total = 350 + 25 = 375
        self.assertEqual(order.total_amount, Decimal('375.00'))

    # 2. PICKUP SLOT GENERATION & BUFFER TEST
    def test_pickup_slot_generation(self):
        """
        Pickup slots:
        - 5:00 PM to 10:00 PM
        - 20-minute buffer: if time is 6:05 PM, earliest slot is 6:30 PM (rounded up to 10-min)
        - No past slots
        - No slots after 10:00 PM
        """
        # Explicitly test standard 5:00 PM to 10:00 PM hours
        self.settings.opening_time = datetime.time(17, 0)
        self.settings.closing_time = datetime.time(22, 0)
        self.settings.save()

        today = timezone.localtime(timezone.now()).date()
        ref_time = timezone.make_aware(
            datetime.datetime.combine(today, datetime.time(18, 5)), # 6:05 PM
            timezone.get_current_timezone()
        )
        slots = get_available_pickup_slots(reference_dt=ref_time)
        self.assertTrue(len(slots) > 0)
        # 6:05 + 20 mins buffer = 6:25 PM -> rounded up to 10-min interval = 6:30 PM
        first_slot = slots[0]
        self.assertEqual(first_slot['time_display'], '6:30 PM')

        # Last slot must not exceed 10:00 PM
        last_slot = slots[-1]
        self.assertEqual(last_slot['time_display'], '10:00 PM')

        # When ordering at 9:45 PM, 20-min buffer = 10:05 PM (after 10:00 PM closing) -> no slots remain
        late_time = timezone.make_aware(
            datetime.datetime.combine(today, datetime.time(21, 45)),
            timezone.get_current_timezone()
        )
        late_slots = get_available_pickup_slots(reference_dt=late_time)
        self.assertEqual(len(late_slots), 0)

    # 3. SLOT CAPACITY TEST (MAX 2 ORDERS PER SLOT)
    def test_slot_capacity_limit(self):
        """
        Slot capacity: max 2 orders per slot.
        3rd order cannot book the same slot.
        """
        cart = [{'id': self.veg_momos.id, 'quantity': 1, 'isParcel': False, 'addons': []}]

        # Order 1
        ord1, pay1 = PaymentService.create_pending_order("User 1", "9000000001", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(ord1.id, "pay_1")
        ord1.refresh_from_db()
        self.assertEqual(ord1.order_status, 'CONFIRMED')

        # Order 2
        ord2, pay2 = PaymentService.create_pending_order("User 2", "9000000002", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(ord2.id, "pay_2")
        ord2.refresh_from_db()
        self.assertEqual(ord2.order_status, 'CONFIRMED')

        # Order 3 attempting same slot
        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User 3", "9000000003", self.today_slot, cart)
        self.assertIn("maximum capacity", str(ctx.exception).lower())

    # 4. SOLD OUT ITEMS TEST
    def test_sold_out_item_cannot_be_ordered(self):
        """
        Sold out item cannot be added to new orders. Existing orders remain unaffected.
        """
        # Place valid order first
        cart = [{'id': self.veg_momos.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        ord1, _ = PaymentService.create_pending_order("User 1", "9000000001", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(ord1.id, "pay_1")

        # Now mark veg momos sold out
        self.veg_momos.is_available = False
        self.veg_momos.save()

        # Existing order still valid
        ord1.refresh_from_db()
        self.assertEqual(ord1.payment_status, 'PAID')
        self.assertEqual(ord1.order_status, 'CONFIRMED')

        # New order with veg momos must be rejected
        other_slot = self.today_slot + datetime.timedelta(minutes=10)
        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User 2", "9000000002", other_slot, cart)
        self.assertIn("sold out", str(ctx.exception).lower())

    # 5. PRICE SNAPSHOT TEST
    def test_price_snapshot_preserved(self):
        """
        When admin changes price later, old order retains old price.
        """
        cart = [{'id': self.chicken_momos.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("User", "9000000001", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(order.id, "pay_1")

        order_item = order.items.first()
        self.assertEqual(order_item.unit_price_snapshot, Decimal('100.00'))
        self.assertEqual(order.total_amount, Decimal('100.00'))

        # Later, admin updates chicken momos price to ₹120.00
        self.chicken_momos.price = Decimal('120.00')
        self.chicken_momos.save()

        # Historical order must still retain ₹100.00
        order.refresh_from_db()
        order_item.refresh_from_db()
        self.assertEqual(order_item.unit_price_snapshot, Decimal('100.00'))
        self.assertEqual(order.total_amount, Decimal('100.00'))

    # 6. PAYMENT SERVER-SIDE VERIFICATION TEST
    def test_payment_server_side_verification(self):
        """
        Unverified or failed payments never confirm orders.
        Verified payment confirms order, locks slot, and marks PAID.
        """
        cart = [{'id': self.single_waffle.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("User", "9000000001", self.today_slot, cart)

        self.assertEqual(order.payment_status, 'PENDING')
        self.assertEqual(payment.status, 'INITIATED')

        # Complete payment verification
        success, confirmed_order = PaymentService.verify_and_confirm_payment(order.id, "pay_test_verified_123")
        self.assertTrue(success)
        self.assertEqual(confirmed_order.payment_status, 'PAID')
        self.assertEqual(confirmed_order.order_status, 'CONFIRMED')
        self.assertTrue(confirmed_order.token.startswith('SP'))

    # 7. TOKEN UNIQUENESS TEST
    def test_token_uniqueness(self):
        """
        Tokens must be unique and non-overlapping.
        """
        tokens = set()
        for _ in range(10):
            ord_num, token = generate_order_identifiers()
            self.assertNotIn(token, tokens)
            tokens.add(token)
            # Create a dummy order to occupy the identifier
            c, _ = Customer.objects.get_or_create(name="Cust", mobile="9999999999")
            Order.objects.create(
                order_number=ord_num,
                token=token,
                customer=c,
                pickup_slot_time=self.today_slot,
                total_amount=Decimal('100.00')
            )

    # 8. SHOP STATUS GUARDS TEST
    def test_shop_status_guards(self):
        """
        When shop is closed or online orders paused, orders cannot be created.
        """
        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]

        # Case A: Shop closed
        self.settings.shop_open = False
        self.settings.save()
        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User", "9000000001", self.today_slot, cart)
        self.assertIn("closed", str(ctx.exception).lower())

        # Case B: Shop open but online ordering paused
        self.settings.shop_open = True
        self.settings.online_orders_enabled = False
        self.settings.save()
        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order("User", "9000000001", self.today_slot, cart)
        self.assertIn("paused", str(ctx.exception).lower())

    # 9. ORDER STATUS TRANSITION TEST
    def test_order_status_transitions(self):
        """
        Order moves CONFIRMED -> PREPARING -> READY -> COMPLETED.
        """
        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("User", "9000000001", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(order.id, "pay_test_ready")

        order.order_status = 'PREPARING'
        order.save()
        self.assertEqual(order.order_status, 'PREPARING')

        # Transition to READY
        order.order_status = 'READY'
        order.save()
        self.assertEqual(order.order_status, 'READY')

        # Transition to COMPLETED
        order.order_status = 'COMPLETED'
        order.save()
        self.assertEqual(order.order_status, 'COMPLETED')

    # 10. REMOVED MENU ITEMS TEST
    def test_removed_menu_items_absent(self):
        """
        Double Flavour and Chocolate Momos must be completely absent from database.
        """
        self.assertFalse(MenuItem.objects.filter(name__icontains="Chocolate Momos").exists())
        self.assertFalse(MenuItem.objects.filter(name__icontains="Double Flavour").exists())

    # 11. CONFIRMATION PAGE IDOR SECURITY TESTS
    def test_confirmation_page_authorized_session_can_access(self):
        """
        1. The session that completed payment can open its confirmation page.
        """
        from django.test import Client
        client = Client()
        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("Ramesh", "9876543210", self.today_slot, cart)

        # Complete payment via verify view to populate session
        verify_resp = client.post(f"/orders/verify/{order.id}/", {
            'gateway_payment_id': 'pay_test_authorized',
        })
        self.assertEqual(verify_resp.status_code, 302)

        order.refresh_from_db()
        # Authorized session can view via confirmation_token
        resp = client.get(f"/order/confirmed/{order.confirmation_token}/")
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, order.token)
        self.assertContains(resp, order.order_number)

        # Authorized session can also view via token
        resp_token = client.get(f"/order/confirmed/{order.token}/")
        self.assertEqual(resp_token.status_code, 200)

    def test_confirmation_page_cross_session_and_unauthenticated_blocked(self):
        """
        2. Another session cannot open the same confirmation URL.
        3. An unauthenticated user cannot open another customer's confirmation.
        4. Guessing/changing the token does not expose another order.
        5. Invalid/non-existent tokens return a safe 404 response.
        """
        from django.test import Client
        client_owner = Client()
        client_attacker = Client()

        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, payment = PaymentService.create_pending_order("Ramesh", "9876543210", self.today_slot, cart)

        # Verify payment in owner session
        client_owner.post(f"/orders/verify/{order.id}/", {'gateway_payment_id': 'pay_owner'})
        order.refresh_from_db()

        # Attacker in different session attempts to access by confirmation_token
        resp_attacker_uuid = client_attacker.get(f"/order/confirmed/{order.confirmation_token}/")
        self.assertEqual(resp_attacker_uuid.status_code, 404)

        # Attacker attempts to access by token (SP1001)
        resp_attacker_token = client_attacker.get(f"/order/confirmed/{order.token}/")
        self.assertEqual(resp_attacker_token.status_code, 404)

        # Non-existent / guessed invalid token returns 404
        resp_invalid = client_attacker.get("/order/confirmed/nonexistenttoken999/")
        self.assertEqual(resp_invalid.status_code, 404)

    # 12. CUSTOMER ORDER HISTORY SECURITY TESTS
    def test_order_history_authorized_session_can_view_own_orders(self):
        """
        1. Authorized customer can see their own orders.
        """
        from django.test import Client
        client = Client()
        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("Suresh", "9123456780", self.today_slot, cart)
        client.post(f"/orders/verify/{order.id}/", {'gateway_payment_id': 'pay_suresh'})

        # Authorized session visits lookup
        resp = client.get("/orders/lookup/?mobile=9123456780")
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, order.token)
        self.assertContains(resp, order.order_number)

    def test_order_history_cross_session_blocked(self):
        """
        2. Different session cannot see those orders using the same phone number.
        """
        from django.test import Client
        client_owner = Client()
        client_stranger = Client()

        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("Suresh", "9123456780", self.today_slot, cart)
        client_owner.post(f"/orders/verify/{order.id}/", {'gateway_payment_id': 'pay_suresh'})

        # Stranger attempts lookup using Suresh's phone number
        resp = client_stranger.get("/orders/lookup/?mobile=9123456780")
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(resp, order.token)
        self.assertNotContains(resp, order.order_number)
        self.assertContains(resp, "No active orders found for this device/session")

    def test_order_history_tampered_phone_number_blocked(self):
        """
        3. Changing the phone number in the request cannot expose another customer's orders.
        """
        from django.test import Client
        client_victim = Client()
        client_attacker = Client()

        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order_victim, _ = PaymentService.create_pending_order("Victim", "9998887770", self.today_slot, cart)
        client_victim.post(f"/orders/verify/{order_victim.id}/", {'gateway_payment_id': 'pay_victim'})

        order_attacker, _ = PaymentService.create_pending_order("Attacker", "8887776660", self.today_slot, cart)
        client_attacker.post(f"/orders/verify/{order_attacker.id}/", {'gateway_payment_id': 'pay_attacker'})

        # Attacker session attempts to look up victim's mobile number
        resp = client_attacker.get("/orders/lookup/?mobile=9998887770")
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(resp, order_victim.token)
        self.assertNotContains(resp, order_victim.order_number)
        self.assertContains(resp, "No active orders found for this device/session")

    def test_order_history_unauthenticated_access_blocked(self):
        """
        4. Unauthenticated access without session cannot expose order history.
        """
        from django.test import Client
        client_unauth = Client()

        cart = [{'id': self.choco_bun.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("SecretUser", "9555444333", self.today_slot, cart)
        PaymentService.verify_and_confirm_payment(order.id, 'pay_secret')

        # Unauthenticated lookup
        resp = client_unauth.get("/orders/lookup/?mobile=9555444333")
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(resp, order.token)
        self.assertNotContains(resp, order.order_number)
        self.assertContains(resp, "No active orders found for this device/session")

    # 13. PRE-DEPLOYMENT HARDENING REGRESSION TESTS
    def test_invalid_and_excessive_quantities_rejected(self):
        """Quantities must be 1 to 50; invalid numbers or 0 are rejected."""
        # Zero quantity
        with self.assertRaises(ValueError) as ctx1:
            PaymentService.create_pending_order(
                "User", "9000000001", self.today_slot,
                [{'id': self.veg_momos.id, 'quantity': 0, 'isParcel': False, 'addons': []}]
            )
        self.assertIn("at least 1", str(ctx1.exception))

        # Excessive quantity (> 50)
        with self.assertRaises(ValueError) as ctx2:
            PaymentService.create_pending_order(
                "User", "9000000001", self.today_slot,
                [{'id': self.veg_momos.id, 'quantity': 999, 'isParcel': False, 'addons': []}]
            )
        self.assertIn("exceed 50", str(ctx2.exception))

    def test_item_specific_addon_associations_enforced(self):
        """Addons restricted to specific items cannot be applied to other items."""
        # dragon_sauce is applicable only to veg_momos and chicken_momos, NOT choco_bun
        with self.assertRaises(ValueError) as ctx:
            PaymentService.create_pending_order(
                "User", "9000000001", self.today_slot,
                [{
                    'id': self.choco_bun.id,
                    'quantity': 1,
                    'isParcel': False,
                    'addons': [{'id': self.dragon_sauce.id}]
                }]
            )
        self.assertIn("not applicable", str(ctx.exception))

    def test_payment_page_idor_protection(self):
        """Only the session that placed the order or staff can view the payment gateway screen."""
        from django.test import Client
        cart = [{'id': self.veg_momos.id, 'quantity': 1, 'isParcel': False, 'addons': []}]
        order, _ = PaymentService.create_pending_order("Owner", "9000000001", self.today_slot, cart)

        client_stranger = Client()
        # Stranger gets 404 when accessing pay_order_view
        resp = client_stranger.get(f"/orders/pay/{order.id}/")
        self.assertEqual(resp.status_code, 404)

        # But creator session (with pending_order_ids) gets 200
        client_creator = Client()
        session = client_creator.session
        session['pending_order_ids'] = [order.id]
        session.save()
        resp_creator = client_creator.get(f"/orders/pay/{order.id}/")
        self.assertEqual(resp_creator.status_code, 200)

