import base64
import hashlib
import hmac
import logging
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
import requests

logger = logging.getLogger(__name__)


class CashfreeService:
    @classmethod
    def get_config(cls):
        client_id = getattr(settings, 'CASHFREE_CLIENT_ID', '').strip()
        client_secret = getattr(settings, 'CASHFREE_CLIENT_SECRET', '').strip()
        env = getattr(settings, 'CASHFREE_ENVIRONMENT', 'SANDBOX').upper()
        api_version = getattr(settings, 'CASHFREE_API_VERSION', '2023-08-01')

        base_url = (
            "https://sandbox.cashfree.com/pg"
            if env == 'SANDBOX'
            else "https://api.cashfree.com/pg"
        )
        is_configured = bool(client_id and client_secret)
        return {
            'client_id': client_id,
            'client_secret': client_secret,
            'environment': env,
            'api_version': api_version,
            'base_url': base_url,
            'is_configured': is_configured,
        }

    @classmethod
    def get_base_url(cls):
        return cls.get_config()['base_url']

    @classmethod
    def is_configured(cls):
        return cls.get_config()['is_configured']

    @classmethod
    def get_headers(cls):
        conf = cls.get_config()
        return {
            'x-client-id': conf['client_id'],
            'x-client-secret': conf['client_secret'],
            'x-api-version': conf['api_version'],
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

    @classmethod
    def create_order(cls, order, customer, return_url, notify_url=None):
        """
        Creates an order on Cashfree Payment Gateway (PG v2023-08-01 API).
        Returns Cashfree payment_session_id and gateway_order_id.
        """
        conf = cls.get_config()
        gateway_order_id = f"SP_{order.id}_{uuid.uuid4().hex[:8]}"

        # If credentials are not configured or simulator is active, run safe sandbox simulation
        if not conf['is_configured']:
            logger.info("Cashfree credentials missing; operating in local sandbox simulation mode.")
            mock_session_id = f"session_mock_{uuid.uuid4().hex}"
            return {
                'success': True,
                'gateway_order_id': gateway_order_id,
                'payment_session_id': mock_session_id,
                'cf_order_id': f"cf_{uuid.uuid4().hex[:10]}",
                'order_status': 'ACTIVE',
                'simulated': True,
            }

        url = f"{conf['base_url']}/orders"
        payload = {
            "order_id": gateway_order_id,
            "order_amount": float(order.total_amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": f"cust_{customer.mobile}",
                "customer_name": customer.name,
                "customer_phone": customer.mobile,
                "customer_email": f"order_{order.order_number}@stuffandpuff.local",
            },
            "order_meta": {
                "return_url": return_url,
                "payment_methods": "upi,nb",  # UPI and Net Banking
            },
            "order_note": f"Stuff & Puff Chengalpattu Order #{order.order_number}",
        }
        effective_notify_url = notify_url or getattr(
            settings,
            'CASHFREE_NOTIFY_URL',
            'https://stuff-and-puff.vercel.app/payments/cashfree/webhook/'
        )
        if effective_notify_url:
            payload["order_meta"]["notify_url"] = effective_notify_url

        try:
            resp = requests.post(url, json=payload, headers=cls.get_headers(), timeout=10)
            data = resp.json()
            if resp.status_code in [200, 201]:
                return {
                    'success': True,
                    'gateway_order_id': data.get('order_id', gateway_order_id),
                    'payment_session_id': data.get('payment_session_id', ''),
                    'cf_order_id': data.get('cf_order_id', ''),
                    'order_status': data.get('order_status', 'ACTIVE'),
                    'simulated': False,
                    'raw': data,
                }
            else:
                err_msg = data.get('message') or data.get('error') or f"Cashfree HTTP {resp.status_code}"
                logger.error(f"Cashfree create_order error: {err_msg}")
                return {'success': False, 'error': str(err_msg)}
        except Exception as ex:
            logger.error(f"Cashfree create_order exception: {ex}")
            return {'success': False, 'error': str(ex)}

    @classmethod
    def get_order_status(cls, gateway_order_id):
        """
        Retrieves order details from Cashfree: GET /pg/orders/{order_id}
        """
        conf = cls.get_config()
        if not conf['is_configured']:
            return {
                'success': True,
                'order_id': gateway_order_id,
                'order_status': 'PAID',
                'order_currency': 'INR',
                'simulated': True,
            }

        url = f"{conf['base_url']}/orders/{gateway_order_id}"
        try:
            resp = requests.get(url, headers=cls.get_headers(), timeout=10)
            data = resp.json()
            if resp.status_code == 200:
                return {
                    'success': True,
                    'order_id': data.get('order_id'),
                    'order_status': data.get('order_status'),  # PAID, ACTIVE, EXPIRED
                    'order_amount': Decimal(str(data.get('order_amount', 0))),
                    'order_currency': data.get('order_currency', 'INR'),
                    'cf_order_id': data.get('cf_order_id'),
                    'raw': data,
                }
            return {'success': False, 'error': data.get('message', 'Failed to fetch order status')}
        except Exception as ex:
            return {'success': False, 'error': str(ex)}

    @classmethod
    def get_order_payments(cls, gateway_order_id):
        """
        Retrieves payment attempts for an order: GET /pg/orders/{order_id}/payments
        """
        conf = cls.get_config()
        if not conf['is_configured']:
            return {'success': True, 'payments': [{'cf_payment_id': f'cf_pay_mock_{uuid.uuid4().hex[:8]}', 'payment_status': 'SUCCESS'}]}

        url = f"{conf['base_url']}/orders/{gateway_order_id}/payments"
        try:
            resp = requests.get(url, headers=cls.get_headers(), timeout=10)
            if resp.status_code == 200:
                return {'success': True, 'payments': resp.json()}
            return {'success': False, 'error': f"HTTP {resp.status_code}"}
        except Exception as ex:
            return {'success': False, 'error': str(ex)}

    @classmethod
    def initiate_refund(cls, gateway_order_id, refund_amount, refund_note="Shop unexpected closure"):
        """
        Initiates a refund on Cashfree: POST /pg/orders/{order_id}/refunds
        """
        conf = cls.get_config()
        refund_id = f"ref_{gateway_order_id[:16]}_{int(timezone.now().timestamp())}"

        if not conf['is_configured']:
            logger.info("Simulated refund processed.")
            return {
                'success': True,
                'refund_id': refund_id,
                'cf_refund_id': f"cf_ref_mock_{uuid.uuid4().hex[:8]}",
                'refund_status': 'SUCCESS',
                'simulated': True,
            }

        url = f"{conf['base_url']}/orders/{gateway_order_id}/refunds"
        payload = {
            "refund_id": refund_id,
            "refund_amount": float(refund_amount),
            "refund_note": refund_note,
        }
        try:
            resp = requests.post(url, json=payload, headers=cls.get_headers(), timeout=10)
            data = resp.json()
            if resp.status_code in [200, 201]:
                return {
                    'success': True,
                    'refund_id': data.get('refund_id', refund_id),
                    'cf_refund_id': data.get('cf_refund_id', ''),
                    'refund_status': data.get('refund_status', 'SUCCESS'),
                    'raw': data,
                }
            err_msg = data.get('message', f"HTTP {resp.status_code}")
            return {'success': False, 'error': err_msg}
        except Exception as ex:
            return {'success': False, 'error': str(ex)}

    @classmethod
    def verify_webhook_signature(cls, timestamp, raw_body, signature):
        """
        Verifies Cashfree webhook signature:
        HMAC-SHA256 of (timestamp + raw_body) using CASHFREE_CLIENT_SECRET, base64-encoded.
        """
        conf = cls.get_config()
        secret = conf['client_secret']
        if not secret:
            return False

        data = f"{timestamp}{raw_body}"
        computed_sig = base64.b64encode(
            hmac.new(secret.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).digest()
        ).decode('utf-8')
        return hmac.compare_digest(computed_sig, signature)
