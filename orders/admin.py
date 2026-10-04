from django.contrib import admin
from .models import Customer, Order, OrderItem, OrderItemAddOn

class OrderItemAddOnInline(admin.TabularInline):
    model = OrderItemAddOn
    extra = 0
    readonly_fields = ('addon', 'addon_name_snapshot', 'price_snapshot')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'menu_item',
        'item_name_snapshot',
        'quantity',
        'unit_price_snapshot',
        'parcel_quantity',
        'parcel_charge_snapshot',
        'line_total'
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'mobile', 'email', 'created_at')
    search_fields = ('name', 'mobile', 'email')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number',
        'token',
        'customer',
        'pickup_slot_time',
        'total_amount',
        'order_status',
        'payment_status',
        'created_email_sent',
        'payment_email_sent',
        'ready_email_sent',
        'refund_email_sent',
        'created_at'
    )
    list_filter = ('order_status', 'payment_status', 'created_at')
    search_fields = ('order_number', 'token', 'customer__name', 'customer__mobile', 'customer__email')
    readonly_fields = (
        'order_number',
        'token',
        'customer',
        'pickup_slot_time',
        'subtotal',
        'addon_total',
        'parcel_total',
        'total_amount',
        'created_email_sent',
        'payment_email_sent',
        'ready_email_sent',
        'refund_email_sent',
        'created_at',
        'updated_at'
    )
    inlines = [OrderItemInline]
    actions = ['mark_as_ready']

    @admin.action(description="Mark selected orders as READY for pickup")
    def mark_as_ready(self, request, queryset):
        from notifications.brevo_service import BrevoService
        count = 0
        for order in queryset:
            order.order_status = 'READY'
            if not order.ready_email_sent:
                try:
                    BrevoService.send_order_ready_email(order)
                except Exception:
                    pass
            order.save()
            count += 1
        self.message_user(request, f"{count} order(s) marked READY.")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.order_status == 'READY':
            from notifications.brevo_service import BrevoService
            if not obj.ready_email_sent:
                try:
                    BrevoService.send_order_ready_email(obj)
                except Exception:
                    pass
