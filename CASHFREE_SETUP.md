# Cashfree Payment Gateway Setup & Integration Guide

This guide describes how to configure and run the Cashfree Payment Gateway integration for the **Stuff & Puff** pre-ordering system.

---

## 1. Create and Configure Cashfree Account
1. Visit the [Cashfree Merchant Dashboard](https://merchants.cashfree.com/) and register for an account.
2. Complete initial verification to access developer tools.
3. Navigate to **Payment Gateway** &rarr; **Developers** &rarr; **API Keys**.

---

## 2. Obtain Sandbox (Test) Credentials
1. In the Cashfree dashboard, switch the environment toggle from **Production** to **Sandbox (Test)**.
2. Under **API Keys**, locate or generate your:
   - **App ID / Client ID** (e.g., `TEST100...`)
   - **Secret Key / Client Secret** (e.g., `cfsk_ma_test_...`)
3. Note your API Version (default and recommended: `2023-08-01`).

---

## 3. Configure Environment Variables
Copy `.env.example` to `.env` if not already created, and supply the sandbox credentials:

```ini
# Cashfree Payment Gateway
CASHFREE_CLIENT_ID=your_sandbox_client_id_here
CASHFREE_CLIENT_SECRET=your_sandbox_client_secret_here
CASHFREE_ENVIRONMENT=SANDBOX
CASHFREE_API_VERSION=2023-08-01
```

> **Security Rules:**
> - NEVER commit `.env` to version control.
> - NEVER put live production secrets in `.env.example`.
> - Do not expose secret keys to frontend JavaScript or client templates.

---

## 4. Keep CASHFREE_ENVIRONMENT=SANDBOX During Development
- During development and local testing, keep:
  ```ini
  CASHFREE_ENVIRONMENT=SANDBOX
  ```
- When `CASHFREE_ENVIRONMENT=SANDBOX`, API calls are routed to `https://sandbox.cashfree.com/pg`.
- Supported payment methods:
  - **UPI** (Google Pay, PhonePe, Paytm, BHIM)
  - **Net Banking** (State Bank of India, HDFC, ICICI, Axis, and 50+ banks)
- If credentials are not set during local testing, the application gracefully activates an instant sandbox simulator for development workflows.

---

## 5. Start the Application
Run migrations and launch the Django development server:

```bash
python manage.py migrate
python manage.py runserver
```

---

## 6. Test the Complete Payment Flow
1. Open `http://127.0.0.1:8000/` in your browser.
2. Add items to your cart and proceed to checkout.
3. Select an available pickup slot and enter your name and phone number.
4. Click **Proceed to Payment**.
5. Complete payment using Cashfree PG:
   - In Sandbox mode with active test keys, complete payment using Cashfree's test UPI or Net Banking simulators.
   - The server verifies:
     - Cashfree order/payment status = `PAID` / `SUCCESS`
     - Local order ID match
     - Amount match (server-calculated order total)
     - Currency = `INR`
   - Upon successful verification, the order transitions from `PENDING` to `CONFIRMED`.
   - A unique pickup token is generated and a confirmation email is triggered.
   - If payment verification fails, the order is NOT confirmed, and the customer is shown the payment failed screen.

---

## 7. Automated Verification
Verify the entire test suite before considering production deployment:

```bash
python manage.py check
python manage.py test
```

All payment, idempotency, refund, security, and cart tests must pass.

---

## 8. Transitioning to Production
Only after all tests pass and your merchant verification is complete:
1. In the Cashfree dashboard, switch to **Production**.
2. Generate production API credentials.
3. Update production server environment variables:
   ```ini
   CASHFREE_CLIENT_ID=prod_client_id
   CASHFREE_CLIENT_SECRET=prod_client_secret
   CASHFREE_ENVIRONMENT=PRODUCTION
   ```
4. Configure webhook URL in Cashfree dashboard pointing to `https://yourdomain.com/payments/cashfree/webhook/`.
