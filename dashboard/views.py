from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import user_passes_test, login_required
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from decimal import Decimal
from shop.models import ShopSettings
from menu.models import Category, MenuItem, AddOn
from orders.models import Order
from notifications.brevo_service import BrevoService
from payments.services.payment_service import PaymentService

def staff_check(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)

@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
def staff_dashboard_view(request):
    shop_settings = ShopSettings.get_settings()
    today = timezone.localtime(timezone.now()).date()

    # Query today's orders
    today_orders = Order.objects.filter(
        created_at__date=today
    ).prefetch_related('items__addons', 'customer').order_by('-created_at')

    # Metrics
    total_orders = today_orders.count()
    paid_orders = today_orders.filter(payment_status='PAID')
    total_sales = sum((o.total_amount for o in paid_orders), Decimal('0.00'))

    confirmed_count = today_orders.filter(order_status='CONFIRMED', payment_status='PAID').count()
    preparing_count = today_orders.filter(order_status='PREPARING').count()
    ready_count = today_orders.filter(order_status='READY').count()
    completed_count = today_orders.filter(order_status='COMPLETED').count()

    # Menu items for quick sold-out toggling
    all_menu_items = MenuItem.objects.select_related('category').order_by('category__display_order', 'display_order', 'name')

    context = {
        'shop_settings': shop_settings,
        'today_orders': today_orders,
        'total_orders': total_orders,
        'total_sales': total_sales,
        'confirmed_count': confirmed_count,
        'preparing_count': preparing_count,
        'ready_count': ready_count,
        'completed_count': completed_count,
        'all_menu_items': all_menu_items,
        'today_date': today,
    }
    return render(request, 'dashboard/index.html', context)


@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
@require_POST
def toggle_shop_status(request):
    """Independent toggle for physical shop open / closed"""
    settings = ShopSettings.get_settings()
    settings.shop_open = not settings.shop_open
    settings.save()
    status_str = "OPEN" if settings.shop_open else "CLOSED"
    messages.success(request, f"Shop status updated to {status_str}.")
    return redirect('staff_dashboard')


@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
@require_POST
def toggle_online_ordering(request):
    """Independent toggle for online ordering accepting / paused"""
    settings = ShopSettings.get_settings()
    settings.online_orders_enabled = not settings.online_orders_enabled
    settings.save()
    status_str = "ACCEPTING" if settings.online_orders_enabled else "PAUSED"
    messages.success(request, f"Online ordering updated to {status_str}.")
    return redirect('staff_dashboard')


@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
@require_POST
def update_order_status(request, order_id):
    """
    Moves order through states: CONFIRMED -> PREPARING -> READY -> COMPLETED.
    When moving to READY, dispatches the Ready email automatically.
    """
    order = get_object_or_404(Order, id=order_id)
    new_status = request.POST.get('status')

    valid_statuses = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
    if new_status in valid_statuses:
        old_status = order.order_status
        order.order_status = new_status

        # If marking READY, send Ready Email if not already sent
        if new_status == 'READY':
            if not order.ready_email_sent:
                try:
                    BrevoService.send_order_ready_email(order)
                    messages.success(request, f"Order {order.token} marked READY and email dispatched to {order.customer.email or order.customer.name}!")
                except Exception as e:
                    messages.warning(request, f"Order marked READY, but email could not be sent: {e}")
            else:
                messages.success(request, f"Order {order.token} marked READY.")
        else:
            messages.success(request, f"Order {order.token} status updated to {new_status}.")

        order.save()

    return redirect('staff_dashboard')


@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
@require_POST
def toggle_item_availability(request, item_id):
    """Quick single-click toggle between Available and Sold Out"""
    item = get_object_or_404(MenuItem, id=item_id)
    item.is_available = not item.is_available
    item.save()
    status_label = "AVAILABLE" if item.is_available else "SOLD OUT"
    messages.info(request, f"'{item.name}' marked {status_label}.")
    return redirect('staff_dashboard')


@user_passes_test(staff_check, login_url='/admin/login/?next=/dashboard/')
@require_POST
def emergency_closure_refund(request, order_id):
    """Triggers automated refund and customer email notification for an unfulfilled order"""
    success, msg = PaymentService.process_order_refund(order_id, reason="Shop unexpected closure")
    if success:
        messages.success(request, msg)
    else:
        messages.error(request, msg)
    return redirect('staff_dashboard')
