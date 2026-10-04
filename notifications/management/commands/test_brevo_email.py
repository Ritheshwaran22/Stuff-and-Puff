import sys
from django.core.management.base import BaseCommand
from django.conf import settings
from notifications.brevo_service import BrevoService


class Command(BaseCommand):
    help = "Sends a single test email through Brevo to verify API connectivity and credentials."

    def add_arguments(self, parser):
        parser.add_argument(
            '--recipient',
            type=str,
            default='',
            help='Optional destination email. Defaults to BREVO_SENDER_EMAIL.'
        )

    def handle(self, *args, **options):
        sender_email = getattr(settings, 'BREVO_SENDER_EMAIL', '').strip()
        sender_name = getattr(settings, 'BREVO_SENDER_NAME', 'Stuff & Puff').strip()
        has_api_key = bool(getattr(settings, 'BREVO_API_KEY', '').strip())

        recipient = options.get('recipient', '').strip() or sender_email

        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(self.style.NOTICE("Stuff & Puff — Brevo Transactional Email Test"))
        self.stdout.write(self.style.NOTICE("=" * 60))

        self.stdout.write(f"Sender Name  : {sender_name}")
        self.stdout.write(f"Sender Email : {sender_email or '[NOT CONFIGURED]'}")
        self.stdout.write(f"Recipient    : {recipient or '[NOT CONFIGURED]'}")
        self.stdout.write(f"API Key      : {'[CONFIGURED]' if has_api_key else '[MISSING]'}")
        self.stdout.write("Subject      : Stuff & Puff — Brevo Test Email")
        self.stdout.write("-" * 60)

        if not has_api_key:
            self.stdout.write(self.style.ERROR("ERROR: BREVO_API_KEY is not set in environment or settings."))
            sys.exit(1)

        if not recipient:
            self.stdout.write(self.style.ERROR("ERROR: Neither recipient nor BREVO_SENDER_EMAIL is configured."))
            sys.exit(1)

        self.stdout.write("Sending test email via Brevo API...")
        result = BrevoService.send_test_email(to_email=recipient)

        if result.get('success'):
            msg_id = result.get('message_id', 'N/A')
            self.stdout.write(self.style.SUCCESS(f"SUCCESS: Email accepted by Brevo!"))
            self.stdout.write(self.style.SUCCESS(f"Message ID   : {msg_id}"))
            self.stdout.write(self.style.SUCCESS("Brevo transactional email integration is operational."))
        else:
            err = result.get('error', 'Unknown error')
            self.stdout.write(self.style.ERROR(f"FAILURE: Brevo email could not be sent."))
            self.stdout.write(self.style.ERROR(f"Error Details: {err}"))
            sys.exit(1)
