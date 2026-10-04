from django.contrib import admin
from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ('recipient_email', 'subject', 'email_type', 'status', 'message_id', 'created_at')
    list_filter = ('email_type', 'status', 'created_at')
    search_fields = ('recipient_email', 'subject', 'message_id')
    readonly_fields = ('recipient_email', 'subject', 'email_type', 'message_id', 'status', 'error_message', 'created_at')

