from django.db import models
from datetime import time
from decimal import Decimal

class ShopSettings(models.Model):
    shop_open = models.BooleanField(default=True, help_text="Physical shop status: Open or Closed")
    online_orders_enabled = models.BooleanField(default=True, help_text="Online ordering status: Accepting or Paused")
    opening_time = models.TimeField(default=time(17, 0), help_text="Standard opening time (e.g. 5:00 PM)")
    closing_time = models.TimeField(default=time(22, 0), help_text="Standard closing time (e.g. 10:00 PM)")
    preparation_buffer_mins = models.PositiveIntegerField(default=20, help_text="Minutes needed to prepare food before pickup (default: 20)")
    slot_interval_mins = models.PositiveIntegerField(default=10, help_text="Minutes per pickup slot interval (default: 10)")
    max_orders_per_slot = models.PositiveIntegerField(default=2, help_text="Maximum paid orders allowed per 10-min slot (default: 2)")
    parcel_charge_per_item = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'), help_text="₹ charge per parcel item quantity (default: ₹5.00)")
    grace_period_mins = models.PositiveIntegerField(default=15, help_text="Grace period after pickup time in minutes (default: 15)")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Shop Settings"
        verbose_name_plural = "Shop Settings"

    def __str__(self):
        status = "OPEN" if self.shop_open else "CLOSED"
        ordering = "ACCEPTING" if self.online_orders_enabled else "PAUSED"
        return f"Shop: {status} | Online Orders: {ordering} ({self.opening_time.strftime('%I:%M %p')} - {self.closing_time.strftime('%I:%M %p')})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj
