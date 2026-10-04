import uuid
from django.db import models
from django.utils import timezone
from menu.models import MenuItem, AddOn

class Customer(models.Model):
    name = models.CharField(max_length=120)
    mobile = models.CharField(max_length=15, db_index=True)
    email = models.EmailField(max_length=254, blank=True, default='', verbose_name="Email Address")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.mobile})"


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('CONFIRMED', 'Confirmed'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready for Pickup'),
        ('COMPLETED', 'Completed / Collected'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('PAID', 'Paid & Verified'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    order_number = models.CharField(max_length=30, unique=True, db_index=True)
    token = models.CharField(max_length=20, unique=True, db_index=True)
    confirmation_token = models.CharField(max_length=64, blank=True, default='', db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    pickup_slot_time = models.DateTimeField(db_index=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    addon_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    parcel_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='CONFIRMED', db_index=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)

    created_email_sent = models.BooleanField(default=False)
    payment_email_sent = models.BooleanField(default=False)
    ready_email_sent = models.BooleanField(default=False)
    refund_email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.confirmation_token:
            self.confirmation_token = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} ({self.token}) - {self.customer.name} - ₹{self.total_amount}"

    @property
    def total_parcel_items(self):
        return sum(item.parcel_quantity for item in self.items.all())

    @property
    def is_active(self):
        return self.order_status in ['CONFIRMED', 'PREPARING', 'READY']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT, related_name='order_items')
    item_name_snapshot = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_snapshot = models.DecimalField(max_digits=8, decimal_places=2)
    parcel_quantity = models.PositiveIntegerField(default=0)
    parcel_charge_snapshot = models.DecimalField(max_digits=8, decimal_places=2, default=5.00)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.item_name_snapshot} for Order #{self.order.order_number}"

    @property
    def total_addons_price(self):
        return sum(addon.price_snapshot for addon in self.addons.all())


class OrderItemAddOn(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='addons')
    addon = models.ForeignKey(AddOn, on_delete=models.PROTECT, related_name='order_item_addons')
    addon_name_snapshot = models.CharField(max_length=120)
    price_snapshot = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"+ {self.addon_name_snapshot} (₹{self.price_snapshot})"
