import datetime
from django.utils import timezone
from django.db import transaction
from shop.models import ShopSettings
from orders.models import Order

def get_slot_configuration():
    settings = ShopSettings.get_settings()
    return {
        'shop_open': settings.shop_open,
        'online_orders_enabled': settings.online_orders_enabled,
        'opening_time': settings.opening_time,
        'closing_time': settings.closing_time,
        'buffer_mins': settings.preparation_buffer_mins,
        'interval_mins': settings.slot_interval_mins,
        'max_orders_per_slot': settings.max_orders_per_slot,
        'grace_period_mins': settings.grace_period_mins,
    }

def get_available_pickup_slots(reference_dt=None):
    """
    Generates valid pickup slots for the current operational day.
    Respects:
      - 5:00 PM to 10:00 PM operational window
      - 20-minute preparation buffer from reference_dt (or current time)
      - 10-minute intervals
      - Capacity limit: max 2 orders per slot
    """
    conf = get_slot_configuration()
    if not conf['shop_open'] or not conf['online_orders_enabled']:
        return []

    now = reference_dt or timezone.localtime(timezone.now())
    today = now.date()

    # Build shop opening and closing datetime for today
    shop_open_dt = timezone.make_aware(
        datetime.datetime.combine(today, conf['opening_time']),
        timezone.get_current_timezone()
    )
    shop_close_dt = timezone.make_aware(
        datetime.datetime.combine(today, conf['closing_time']),
        timezone.get_current_timezone()
    )

    # Minimum valid preparation time: now + buffer (default 20 mins)
    min_prep_time = now + datetime.timedelta(minutes=conf['buffer_mins'])

    # The earliest possible pickup slot cannot be before shop opening
    earliest_allowed = max(shop_open_dt, min_prep_time)

    # If earliest allowed is already past closing time, no slots remain today
    if earliest_allowed > shop_close_dt:
        return []

    # Round earliest_allowed UP to the next slot_interval_mins
    interval = conf['interval_mins']
    remainder = earliest_allowed.minute % interval
    if remainder > 0 or earliest_allowed.second > 0 or earliest_allowed.microsecond > 0:
        minutes_to_add = interval - remainder
        curr_slot = earliest_allowed.replace(second=0, microsecond=0) + datetime.timedelta(minutes=minutes_to_add)
    else:
        curr_slot = earliest_allowed.replace(second=0, microsecond=0)

    # Collect existing confirmed paid orders for today
    active_statuses = ['CONFIRMED', 'PREPARING', 'READY']
    existing_orders = Order.objects.filter(
        pickup_slot_time__gte=shop_open_dt,
        pickup_slot_time__lte=shop_close_dt,
        payment_status='PAID',
        order_status__in=active_statuses
    ).values('pickup_slot_time')

    # Count orders per slot time
    booked_counts = {}
    for o in existing_orders:
        slot_iso = o['pickup_slot_time'].isoformat()
        booked_counts[slot_iso] = booked_counts.get(slot_iso, 0) + 1

    slots = []
    while curr_slot <= shop_close_dt:
        slot_iso = curr_slot.isoformat()
        booked = booked_counts.get(slot_iso, 0)
        is_available = booked < conf['max_orders_per_slot']

        slots.append({
            'datetime': curr_slot,
            'iso': slot_iso,
            'time_display': curr_slot.strftime('%I:%M %p').lstrip('0'),
            'booked_count': booked,
            'max_capacity': conf['max_orders_per_slot'],
            'is_available': is_available,
            'is_full': not is_available,
        })

        curr_slot += datetime.timedelta(minutes=interval)

    return slots

def validate_and_lock_slot_capacity(slot_datetime, exclude_order_id=None):
    """
    Validates that a chosen slot has remaining capacity (< 2 paid orders)
    within a transaction lock to prevent race conditions.
    Returns (True, "OK") or (False, "Reason").
    """
    conf = get_slot_configuration()
    if not conf['shop_open']:
        return False, "Shop is currently closed."
    if not conf['online_orders_enabled']:
        return False, "Online ordering is currently paused."

    now = timezone.localtime(timezone.now())
    min_prep = now + datetime.timedelta(minutes=conf['buffer_mins'])

    # Slot must be at least buffer minutes in the future
    if slot_datetime < (min_prep - datetime.timedelta(seconds=45)):
        return False, "Selected pickup time is no longer valid. Food requires a 20-minute preparation buffer."

    # Slot must not be after closing
    shop_close_dt = timezone.make_aware(
        datetime.datetime.combine(slot_datetime.date(), conf['closing_time']),
        timezone.get_current_timezone()
    )
    if slot_datetime > shop_close_dt:
        return False, "Selected pickup time is after shop closing hours (10:00 PM)."

    active_statuses = ['CONFIRMED', 'PREPARING', 'READY']
    # Lock matching order rows to serialize concurrent checks
    query = Order.objects.select_for_update().filter(
        pickup_slot_time=slot_datetime,
        payment_status='PAID',
        order_status__in=active_statuses
    )
    if exclude_order_id:
        query = query.exclude(id=exclude_order_id)

    booked_count = query.count()

    if booked_count >= conf['max_orders_per_slot']:
        return False, f"Selected pickup slot ({slot_datetime.strftime('%I:%M %p')}) has reached maximum capacity (2/2 orders). Please select the next available slot."

    return True, "Slot capacity available."
