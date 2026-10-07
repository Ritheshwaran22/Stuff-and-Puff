import hmac
import hashlib
import uuid
import logging
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from shop.models import ShopSettings
from menu.models import MenuItem, AddOn
from orders.models import Customer, Order, OrderItem, OrderItemAddOn
from payments.models import Payment
from notifications.brevo_service import BrevoService
from orders.services.slot_service import validate_and_lock_slot_capacity
from payments.services.cashfree_service import CashfreeService

logger = logging.getLogger(__name__)

def generate_order_identifiers():
    """
    Generates unique Order Number (e.g. 1001) and Pickup Token (e.g. SP1001).
    Ensures absolute uniqueness across existing orders.
    """
    last_order = Order.objects.order_by('-id').first()
    next_seq = (last_order.id + 1001) if last_order else 1001

    while True:
        order_number = str(next_seq)
        token = f"SP{next_seq}"
        if not Order.objects.filter(order_number=order_number).exists() and not Order.objects.filter(token=token).exists():
            return order_number, token
        next_seq += 1


class InvalidCartItemError(ValueError):
    """Raised when an item in the cart is no longer present or valid in the database."""
    def __init__(self, message, item_id=None, item_name=None):
        super().__init__(message)
        self.item_id = item_id
        self.item_name = item_name


class PaymentService:
    @classmethod
    def create_pending_order(cls, customer_name, customer_mobile, pickup_slot_dt, cart_items, payment_method='UPI', request=None, customer_email=None):
        """
        Validates cart items and database prices, checks slot capacity,
        and creates a PENDING order with an INITIATED payment record.
        """
        # 0. Check shop operational status directly
        shop_conf = ShopSettings.get_settings()
        if not shop_conf.shop_open:
            raise ValueError("Shop is currently closed.")
        if not shop_conf.online_orders_enabled:
            raise ValueError("Online ordering is currently paused.")

        # 1. Validate customer inputs
        customer_name = (customer_name or '').strip()
        customer_mobile = (customer_mobile or '').strip()
        customer_email = (customer_email or '').strip()

        if not customer_name:
            raise ValueError("Customer name is required.")
        if not customer_mobile or len(customer_mobile) < 10:
            raise ValueError("A valid 10-digit mobile number is required.")
        if not cart_items or len(cart_items) == 0:
            raise ValueError("Your cart is empty.")

        # 2. Check slot capacity preliminarily
        is_slot_ok, slot_err = validate_and_lock_slot_capacity(pickup_slot_dt)
        if not is_slot_ok:
            raise ValueError(slot_err)

        # 3. Fetch or create Customer
        customer, _ = Customer.objects.get_or_create(
            mobile=customer_mobile,
            defaults={'name': customer_name, 'email': customer_email}
        )
        customer_updated = False
        if customer.name != customer_name:
            customer.name = customer_name
            customer_updated = True
        if customer_email and customer.email != customer_email:
            customer.email = customer_email
            customer_updated = True
        if customer_updated:
            customer.save()

        # 4. Calculate prices directly from database (Do NOT trust client prices)
        parcel_rate = shop_conf.parcel_charge_per_item

        items_subtotal = Decimal('0.00')
        addons_total = Decimal('0.00')
        parcel_total = Decimal('0.00')

        validated_order_lines = []

        # Batch fetch all menu items and add-ons in advance to eliminate round-trip DB latency
        all_item_ids = []
        for line in cart_items:
            raw_id = line.get('id')
            if raw_id is not None:
                try:
                    all_item_ids.append(int(raw_id))
                except (ValueError, TypeError):
                    pass

        all_addon_ids = []
        for line in cart_items:
            for a in line.get('addons', []):
                raw_aid = a.get('id')
                if raw_aid is not None:
                    try:
                        all_addon_ids.append(int(raw_aid))
                    except (ValueError, TypeError):
                        pass

        # Populate maps supporting both int and str keys so frontend JSON IDs match seamlessly
        items_by_id = {}
        for item in MenuItem.objects.filter(id__in=all_item_ids):
            items_by_id[item.id] = item
            items_by_id[str(item.id)] = item

        addons_by_id = {}
        for addon in AddOn.objects.filter(id__in=all_addon_ids).prefetch_related('applicable_items'):
            addons_by_id[addon.id] = addon
            addons_by_id[str(addon.id)] = addon

        for line in cart_items:
            item_id = line.get('id')
            try:
                qty = int(line.get('quantity', 1))
            except (ValueError, TypeError):
                raise ValueError("Item quantity must be a valid number.")

            if qty <= 0:
                raise ValueError("Item quantity must be at least 1.")
            if qty > 50:
                raise ValueError("Item quantity cannot exceed 50 per item.")

            is_parcel = bool(line.get('isParcel', False))
            addon_entries = line.get('addons', [])

            db_item = items_by_id.get(item_id)
            if not db_item:
                item_name = line.get('name') or (f"Item #{item_id}" if item_id is not None else "Selected item")
                raise InvalidCartItemError(
                    f"'{item_name}' is no longer available on our menu and has been removed from your cart. Please select items from our current menu.",
                    item_id=item_id,
                    item_name=item_name
                )

            if not db_item.is_available:
                raise InvalidCartItemError(
                    f"'{db_item.name}' is currently SOLD OUT and has been removed from your cart. Please update your cart.",
                    item_id=item_id,
                    item_name=db_item.name
                )

            line_item_total = db_item.price * qty
            items_subtotal += line_item_total

            # Addons
            validated_addons = []
            line_addons_sum = Decimal('0.00')
            for a in addon_entries:
                a_id = a.get('id')
                db_addon = addons_by_id.get(a_id)
                if not db_addon or not db_addon.is_available:
                    continue

                applicable_ids = {i.id for i in db_addon.applicable_items.all()}
                if applicable_ids and db_item.id not in applicable_ids:
                    raise ValueError(f"Add-on '{db_addon.name}' is not applicable to '{db_item.name}'.")

                validated_addons.append(db_addon)
                line_addons_sum += db_addon.price

            addons_total += line_addons_sum * qty

            # Parcel charge: ₹5 per quantity marked for parcel
            line_parcel_charge = (parcel_rate * qty) if is_parcel else Decimal('0.00')
            if is_parcel:
                parcel_total += line_parcel_charge

            total_line_amount = line_item_total + (line_addons_sum * qty)

            validated_order_lines.append({
                'db_item': db_item,
                'qty': qty,
                'is_parcel': is_parcel,
                'parcel_qty': qty if is_parcel else 0,
                'parcel_charge': line_parcel_charge,
                'line_total': total_line_amount,
                'addons': validated_addons
            })

        if not validated_order_lines:
            raise ValueError("Your cart does not contain any valid items.")

        grand_total = items_subtotal + addons_total + parcel_total
        order_number, token = generate_order_identifiers()

        # 5. Create Order and Payment records
        with transaction.atomic():
            order = Order.objects.create(
                order_number=order_number,
                token=token,
                customer=customer,
                pickup_slot_time=pickup_slot_dt,
                subtotal=items_subtotal,
                addon_total=addons_total,
                parcel_total=parcel_total,
                total_amount=grand_total,
                order_status='PENDING',
                payment_status='PENDING'
            )

            for vl in validated_order_lines:
                oi = OrderItem.objects.create(
                    order=order,
                    menu_item=vl['db_item'],
                    item_name_snapshot=vl['db_item'].name,
                    quantity=vl['qty'],
                    unit_price_snapshot=vl['db_item'].price,
                    parcel_quantity=vl['parcel_qty'],
                    parcel_charge_snapshot=parcel_rate,
                    line_total=vl['line_total']
                )

                for add_on in vl['addons']:
                    OrderItemAddOn.objects.create(
                        order_item=oi,
                        addon=add_on,
                        addon_name_snapshot=add_on.name,
                        price_snapshot=add_on.price
                    )

            # Create payment record via Cashfree
            provider = 'CASHFREE'
            if request:
                return_url = request.build_absolute_uri(
                    "/payments/cashfree/return/?order_id={order_id}"
                )
            else:
                return_url = "https://stuff-and-puff.vercel.app/payments/cashfree/return/?order_id={order_id}"

            notify_url = getattr(
                settings,
                'CASHFREE_NOTIFY_URL',
                'https://stuff-and-puff.vercel.app/payments/cashfree/webhook/'
            )
            cf_res = CashfreeService.create_order(
                order=order,
                customer=customer,
                return_url=return_url,
                notify_url=notify_url
            )

            if not cf_res.get('success') or not cf_res.get('payment_session_id'):
                raise ValueError(
                    cf_res.get('error') or
                    "Cashfree could not create the payment session. Please try again."
                )

            gateway_order_id = cf_res.get('gateway_order_id')
            payment_session_id = cf_res.get('payment_session_id')

            payment = Payment.objects.create(
                order=order,
                amount=grand_total,
                currency='INR',
                payment_method=payment_method,
                gateway_provider=provider,
                gateway_order_id=gateway_order_id,
                payment_session_id=payment_session_id,
                status='INITIATED'
            )

        return order, payment

    @classmethod
    def verify_and_confirm_payment(cls, order_id, gateway_payment_id=None, gateway_order_id=None, **kwargs):
        """
        Strict server-side Cashfree payment verification.
        Locks the pickup slot, queries Cashfree status server-side, validates amount/currency,
        marks order PAID, and triggers the confirmation email.
        Idempotent: Repeated calls return the confirmed order without duplicating emails or changes.
        """
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            payment = Payment.objects.select_for_update().get(order=order)

            # Idempotency guard: If already verified, return safely
            if payment.status == 'SUCCESS' and order.payment_status == 'PAID':
                return True, order

            # 1. Atomic re-verification of slot capacity
            is_slot_ok, slot_err = validate_and_lock_slot_capacity(order.pickup_slot_time, exclude_order_id=order.id)
            if not is_slot_ok:
                payment.status = 'FAILED'
                payment.refund_status = 'REQUESTED'
                payment.refund_notes = f"Payment deducted but slot was full during verification: {slot_err}"
                payment.save()
                order.payment_status = 'FAILED'
                order.order_status = 'CANCELLED'
                order.save()
                # Initiate refund on Cashfree
                if payment.gateway_provider == 'CASHFREE':
                    try:
                        CashfreeService.initiate_refund(
                            payment.gateway_order_id,
                            order.total_amount,
                            f"Slot full during verification: {slot_err}"
                        )
                    except Exception:
                        pass
                return False, slot_err

            # 2. Server-side Gateway Verification
            target_order_id = gateway_order_id or payment.gateway_order_id
            cf_order_res = CashfreeService.get_order_status(target_order_id)
            if not cf_order_res.get('success'):
                payment.status = 'FAILED'
                payment.save()
                order.payment_status = 'FAILED'
                order.save()
                return False, f"Cashfree order verification failed: {cf_order_res.get('error')}"

            # Verify Cashfree order belongs to the correct local order ID
            cf_ret_order_id = cf_order_res.get('order_id')
            if cf_ret_order_id and cf_ret_order_id != payment.gateway_order_id:
                payment.status = 'FAILED'
                payment.save()
                order.payment_status = 'FAILED'
                order.save()
                return False, f"Cashfree order ID mismatch: expected {payment.gateway_order_id}, got {cf_ret_order_id}."

            # Verify Cashfree order status is PAID
            if cf_order_res.get('order_status') != 'PAID':
                # Do not confirm order if not paid
                is_failed = cf_order_res.get('order_status') in ['EXPIRED', 'TERMINATED', 'FAILED']
                payment.status = 'FAILED' if is_failed else 'INITIATED'
                payment.save()
                order.payment_status = 'FAILED' if is_failed else 'PENDING'
                order.save()
                return False, f"Payment is not confirmed (pending). Cashfree status: {cf_order_res.get('order_status')}"

            # Verify amount and currency
            verified_amount = cf_order_res.get('order_amount')
            if verified_amount is not None and Decimal(str(verified_amount)) != order.total_amount:
                payment.status = 'FAILED'
                payment.save()
                order.payment_status = 'FAILED'
                order.save()
                return False, f"Payment amount mismatch: expected ₹{order.total_amount}, got ₹{verified_amount}."

            if cf_order_res.get('order_currency') != 'INR':
                payment.status = 'FAILED'
                payment.save()
                order.payment_status = 'FAILED'
                order.save()
                return False, "Invalid payment currency."

            # Retrieve payment attempt reference
            if not gateway_payment_id:
                cf_payments = CashfreeService.get_order_payments(target_order_id)
                if cf_payments.get('success'):
                    payments_list = cf_payments.get('payments', [])
                    if isinstance(payments_list, list):
                        successful_payments = [
                            p for p in payments_list
                            if isinstance(p, dict) and p.get('payment_status') == 'SUCCESS'
                        ]
                        if successful_payments:
                            gateway_payment_id = str(successful_payments[0].get('cf_payment_id', ''))

            # 3. Verification Succeeded! Update state atomically
            payment.gateway_payment_id = gateway_payment_id or payment.gateway_payment_id or f"cf_pay_{uuid.uuid4().hex[:10]}"
            payment.status = 'SUCCESS'
            payment.save()

            order.payment_status = 'PAID'
            order.order_status = 'CONFIRMED'
            order.save()

            # 4. Send Payment Confirmation Email (Milestone 2 - strictly server-side verified)
            try:
                BrevoService.send_order_payment_success_email(order)
            except Exception as e:
                logger.warning("Order #%s payment confirmation email dispatch caught safely: %s", order.order_number, e)

        return True, order

    @classmethod
    def process_order_refund(cls, order_id, reason="Shop unexpected closure"):
        """
        Initiates a full refund for a paid order via Cashfree API and alerts customer via email.
        Idempotent: Duplicate requests are prevented.
        """
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            payment = getattr(order, 'payment', None)

            if (payment and (payment.status == 'REFUNDED' or payment.refund_status == 'PROCESSED')) or order.payment_status == 'REFUNDED':
                return False, f"Order #{order.order_number} was already refunded."

            if order.payment_status != 'PAID':
                return False, "Order is not in paid status."

            if not payment:
                return False, "Payment record not found."

            # Call Cashfree Refund API
            cf_refund = CashfreeService.initiate_refund(
                payment.gateway_order_id,
                order.total_amount,
                reason
            )

            payment.status = 'REFUNDED'
            payment.refund_status = 'PROCESSED' if cf_refund.get('success') else 'REQUESTED'
            payment.refund_reference = cf_refund.get('cf_refund_id', '') or cf_refund.get('refund_id', '')
            payment.refund_notes = reason
            payment.save()

            order.payment_status = 'REFUNDED'
            order.order_status = 'CANCELLED'
            order.save()

            # Dispatch refund email (Milestone 4 - unexpected closure / refund)
            try:
                BrevoService.send_order_refund_email(order, refund_amount=order.total_amount, reason=reason)
            except Exception as e:
                logger.warning("Order #%s refund email dispatch caught safely: %s", order.order_number, e)

        return True, f"Refund of ₹{order.total_amount:.2f} processed for Order #{order.order_number}."
