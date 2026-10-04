from django.contrib import admin
from .models import ShopSettings

@admin.register(ShopSettings)
class ShopSettingsAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'shop_open',
        'online_orders_enabled',
        'opening_time',
        'closing_time',
        'max_orders_per_slot',
        'parcel_charge_per_item',
        'updated_at'
    )
    fieldsets = (
        ('Physical & Online Status', {
            'fields': ('shop_open', 'online_orders_enabled')
        }),
        ('Business Hours & Slots', {
            'fields': (
                'opening_time',
                'closing_time',
                'preparation_buffer_mins',
                'slot_interval_mins',
                'max_orders_per_slot',
                'grace_period_mins'
            )
        }),
        ('Pricing & Charges', {
            'fields': ('parcel_charge_per_item',)
        }),
    )

    def has_add_permission(self, request):
        # Only allow 1 instance
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)
