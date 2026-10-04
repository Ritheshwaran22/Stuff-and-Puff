from django.db import models


class EmailLog(models.Model):
    EMAIL_TYPES = [
        ('TEST', 'Test Email'),
        ('ORDER_CREATED', 'Order Created / Pre-booking'),
        ('PAYMENT_SUCCESS', 'Payment Successful'),
        ('READY', 'Order Ready for Pickup'),
        ('REFUND', 'Order Refund / Closure'),
    ]

    STATUS_CHOICES = [
        ('SENT', 'Sent Successfully'),
        ('FAILED', 'Failed'),
        ('SKIPPED', 'Skipped (No Email / Duplicate)'),
    ]

    recipient_email = models.EmailField(db_index=True)
    subject = models.CharField(max_length=255)
    email_type = models.CharField(max_length=30, choices=EMAIL_TYPES, default='ORDER_CREATED')
    message_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SENT')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Email to {self.recipient_email} [{self.email_type}] - {self.status}"

