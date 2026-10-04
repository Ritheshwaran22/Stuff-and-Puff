from django.db import models
from orders.models import Order

class Payment(models.Model):
    STATUS_CHOICES = [
        ('INITIATED', 'Initiated'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    REFUND_STATUS_CHOICES = [
        ('NONE', 'None'),
        ('REQUESTED', 'Requested'),
        ('PROCESSED', 'Processed / Refunded'),
        ('FAILED', 'Failed'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    payment_method = models.CharField(max_length=50, default='UPI', help_text="UPI, NETBANKING, etc.")
    gateway_provider = models.CharField(max_length=50, default='CASHFREE', help_text="SANDBOX, CASHFREE")
    gateway_order_id = models.CharField(max_length=100, blank=True, help_text="Cashfree / Gateway Order ID")
    gateway_payment_id = models.CharField(max_length=100, blank=True, help_text="Cashfree Payment ID (cf_payment_id)")
    payment_session_id = models.CharField(max_length=255, blank=True, help_text="Cashfree Payment Session ID")
    gateway_signature = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='NONE')
    refund_reference = models.CharField(max_length=100, blank=True, help_text="Cashfree Refund ID")
    refund_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment ₹{self.amount} for Order #{self.order.order_number} ({self.status})"
