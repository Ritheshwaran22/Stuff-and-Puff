from django.test import TestCase, Client
from decimal import Decimal
from django.core.cache import cache
from shop.models import ShopSettings
from menu.models import Category, MenuItem, AddOn

class MenuFeatureTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.shop_settings = ShopSettings.get_settings()
        self.shop_settings.shop_open = True
        self.shop_settings.online_orders_enabled = True
        self.shop_settings.save()

        # Categories
        self.momos_cat = Category.objects.create(name='Momos', slug='momos', display_order=1)
        self.waffles_cat = Category.objects.create(name='Waffles', slug='waffles', display_order=2)
        self.bun_cat = Category.objects.create(name='Bun', slug='bun', display_order=3)

        # Items
        self.chicken_momos = MenuItem.objects.create(
            category=self.momos_cat,
            name='Chicken Momos',
            price=Decimal('100.00'),
            is_available=True,
            display_order=1
        )
        self.veg_momos = MenuItem.objects.create(
            category=self.momos_cat,
            name='Veg Momos',
            price=Decimal('70.00'),
            is_available=True,
            display_order=2
        )
        self.waffle = MenuItem.objects.create(
            category=self.waffles_cat,
            name='Single Waffle (Single Piece)',
            price=Decimal('50.00'),
            is_available=True,
            display_order=1
        )
        self.bun = MenuItem.objects.create(
            category=self.bun_cat,
            name='Bun Butter Jam',
            price=Decimal('40.00'),
            is_available=True,
            display_order=1
        )

        # Momo Sauces
        self.dragon_sauce = AddOn.objects.create(
            name='Dragon Blaze Momos Sauce',
            price=Decimal('50.00'),
            category_type='SAUCE',
            spice_level=3,
            is_available=True
        )
        self.fiery_sauce = AddOn.objects.create(
            name='Fiery Fusion Momos Sauce',
            price=Decimal('50.00'),
            category_type='SAUCE',
            spice_level=3,
            is_available=True
        )
        self.cheese_volcano = AddOn.objects.create(
            name='Cheese Volcano Momos Sauce',
            price=Decimal('50.00'),
            category_type='SAUCE',
            spice_level=3,
            is_available=True
        )
        self.honey_garlic = AddOn.objects.create(
            name='Honey Garlic Cheese Blast Momos Sauce',
            price=Decimal('50.00'),
            category_type='SAUCE',
            spice_level=2,
            is_available=True
        )
        self.garlic_cheese = AddOn.objects.create(
            name='Garlic Cheese Blast Momos Sauce',
            price=Decimal('50.00'),
            category_type='SAUCE',
            spice_level=3,
            is_available=True
        )

        for sauce in [self.dragon_sauce, self.fiery_sauce, self.cheese_volcano, self.honey_garlic, self.garlic_cheese]:
            sauce.applicable_items.add(self.chicken_momos, self.veg_momos)

    def tearDown(self):
        cache.clear()

    def test_homepage_renders_categories_and_items(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Chicken Momos')
        self.assertContains(response, '₹100')
        self.assertContains(response, 'Veg Momos')
        self.assertContains(response, '₹70')
        self.assertContains(response, 'Single Waffle (Single Piece)')
        self.assertContains(response, 'Bun Butter Jam')

    def test_homepage_renders_all_five_signature_sauces(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Pan Fry Momos: Choose Your Signature Sauce')
        self.assertContains(response, 'Dragon Blaze Momos Sauce')
        self.assertContains(response, 'Fiery Fusion Momos Sauce')
        self.assertContains(response, 'Cheese Volcano Momos Sauce')
        self.assertContains(response, 'Honey Garlic Cheese Blast Momos Sauce')
        self.assertContains(response, 'Garlic Cheese Blast Momos Sauce')

    def test_homepage_diet_badges(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'diet-badge non-veg')
        self.assertContains(response, 'diet-badge veg')

    def test_how_pickup_works_section_present(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'how-pickup-works')
        self.assertContains(response, 'Zero Waiting At The Cart')
