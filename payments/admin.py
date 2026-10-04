from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'amount',
        'payment_method',
        'gateway_provider',
        'gateway_payment_id',
        'status',
        'refund_status',
        'created_at'
    )
    list_filter = ('status', 'refund_status', 'gateway_provider', 'payment_method')
    search_fields = ('order__order_number', 'order__token', 'gateway_payment_id', 'gateway_order_id')
    readonly_fields = ('created_at', 'updated_at')
