
import urllib.request
import json
import re
from decimal import Decimal

def test_endpoints():
    print("Testing live Django server on http://127.0.0.1:8000 ...")

    # 1. Homepage
    with urllib.request.urlopen('http://127.0.0.1:8000/') as resp:
        html = resp.read().decode('utf-8')
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        assert 'STUFF' in html and 'CHENGALPATTU' in html, "Brand missing"
        assert 'Momos' in html and 'Veg Momos' in html, "Momos missing"
        assert 'Waffles' in html and 'Bun' in html, "Waffles / Buns missing"
        assert 'Dragon Blaze' in html, "Sauces missing"
        assert '5:00 PM – 10:00 PM' in html, "Timings missing"
        print("[OK] Homepage responded with 200 OK and complete menu contents.")

    # 2. Slots API
    with urllib.request.urlopen('http://127.0.0.1:8000/api/slots/') as resp:
        data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200
        assert 'slots' in data
        slots = data['slots']
        print(f"[OK] Slots API responded with 200 OK ({len(slots)} slots available today).")

    # 3. Checkout Page
    with urllib.request.urlopen('http://127.0.0.1:8000/checkout/') as resp:
        checkout_html = resp.read().decode('utf-8')
        assert resp.status == 200
        assert 'Pickup Checkout' in checkout_html
        assert '20-min buffer' in checkout_html
        assert 'Pack as Parcel' in checkout_html or 'Parcel Charges' in checkout_html
        print("[OK] Checkout page responded with 200 OK.")

    # 4. Lookup Page
    with urllib.request.urlopen('http://127.0.0.1:8000/orders/lookup/?mobile=9876543210') as resp:
        lookup_html = resp.read().decode('utf-8')
        assert resp.status == 200
        assert 'Track Your Orders' in lookup_html
        print("[OK] Customer lookup page responded with 200 OK.")

    # 5. Policy Pages
    for path in ['/privacy/', '/terms/', '/refund-policy/']:
        with urllib.request.urlopen(f'http://127.0.0.1:8000{path}') as resp:
            assert resp.status == 200
            print(f"[OK] Policy page {path} responded with 200 OK.")

    print("\n[SUCCESS] All live HTTP server endpoints verified successfully!")

if __name__ == '__main__':
    test_endpoints()
