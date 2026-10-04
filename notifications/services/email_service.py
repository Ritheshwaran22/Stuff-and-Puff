"""
Transactional email service adapter.
Re-exports BrevoService and send_transactional_email for consistent services packaging.
"""
from notifications.brevo_service import BrevoService, send_transactional_email

__all__ = ['BrevoService', 'send_transactional_email']
