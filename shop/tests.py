from django.test import TestCase, Client
from django.urls import reverse
from shop.models import ShopSettings

class HomepagePickupLocationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.settings = ShopSettings.get_settings()
        self.settings.shop_open = True
        self.settings.online_orders_enabled = True
        self.settings.save()

    def test_homepage_renders_pickup_location_and_directions(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')

        # 1. Location section heading and icon
        self.assertIn('Pickup Location', content)
        self.assertIn('id="location"', content)

        # 2. Authoritative customer-facing address text
        self.assertIn('Near GH Bus Stop, Chengalpattu, Tamil Nadu', content)

        # 3. Exact Google Maps authoritative URL
        exact_maps_url = 'https://www.google.com/maps/dir/?api=1&destination=12.679571,79.9808547'
        self.assertIn(exact_maps_url, content)
        self.assertIn('id="getDirectionsBtn"', content)
        self.assertIn('Get Directions', content)

        # 4. Target blank and security attributes
        self.assertIn('target="_blank"', content)
        self.assertIn('rel="noopener noreferrer"', content)

        # 5. Interactive embedded map
        self.assertIn('id="googleMapsEmbed"', content)
        self.assertIn('class="location-map-frame"', content)
