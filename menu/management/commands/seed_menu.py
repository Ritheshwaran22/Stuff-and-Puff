from django.core.management.base import BaseCommand
from decimal import Decimal
from datetime import time
from shop.models import ShopSettings
from menu.models import Category, MenuItem, AddOn

class Command(BaseCommand):
    help = 'Seeds the database with exact Stuff & Puff Chengalpattu menu items and settings from the uploaded menu'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Shop Settings..."))
        settings, _ = ShopSettings.objects.get_or_create(id=1)
        settings.shop_open = True
        settings.online_orders_enabled = True
        settings.opening_time = time(17, 0)
        settings.closing_time = time(22, 0)
        settings.preparation_buffer_mins = 20
        settings.slot_interval_mins = 10
        settings.max_orders_per_slot = 2
        settings.parcel_charge_per_item = Decimal('5.00')
        settings.grace_period_mins = 15
        settings.save()
        self.stdout.write(self.style.SUCCESS("[OK] Shop Settings initialized."))

        # 1. Categories
        self.stdout.write(self.style.NOTICE("Seeding Categories..."))
        momos_cat, _ = Category.objects.get_or_create(
            slug='momos',
            defaults={'name': 'Momos', 'display_order': 1}
        )
        waffles_cat, _ = Category.objects.get_or_create(
            slug='waffles',
            defaults={'name': 'Waffles', 'display_order': 2}
        )
        bun_cat, _ = Category.objects.get_or_create(
            slug='bun',
            defaults={'name': 'Bun', 'display_order': 3}
        )
        self.stdout.write(self.style.SUCCESS("[OK] Categories created: Momos, Waffles, Bun."))

        # 2. Momos Items (Normal)
        momos_data = [
            ("Veg Momos", Decimal('70.00'), "", 0, 1),
            ("Corn Momos", Decimal('90.00'), "", 0, 2),
            ("Paneer Momos", Decimal('80.00'), "", 0, 3),
            ("Chicken Momos", Decimal('100.00'), "", 0, 4),
            ("Mixed Momos", Decimal('120.00'), "", 0, 5),
        ]
        created_momo_items = []
        for name, price, desc, spice, order in momos_data:
            item, _ = MenuItem.objects.update_or_create(
                category=momos_cat,
                name=name,
                defaults={
                    'price': price,
                    'description': desc,
                    'spice_level': spice,
                    'display_order': order,
                    'is_available': True
                }
            )
            created_momo_items.append(item)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_momo_items)} Momo items created."))

        # 3. Pan Fry Momos / Sauces (from "Pan Fry Momos - Choose Your Sauces" on menu)
        # Listed on the menu with chilis and price Rs. 50.00 each
        sauces_data = [
            ("Dragon Blaze Momos Sauce", Decimal('50.00'), 3),
            ("Fiery Fusion Momos Sauce", Decimal('50.00'), 3),
            ("Cheese Volcano Momos Sauce", Decimal('50.00'), 3),
            ("Honey Fire Momos Sauce", Decimal('50.00'), 2),
            ("Garlic Cheese Blast Momos Sauce", Decimal('50.00'), 3),
        ]
        created_sauces = []
        for name, price, spice in sauces_data:
            sauce, _ = AddOn.objects.update_or_create(
                name=name,
                category_type='SAUCE',
                defaults={
                    'price': price,
                    'spice_level': spice,
                    'is_available': True
                }
            )
            # Associate with momo items
            sauce.applicable_items.set(created_momo_items)
            created_sauces.append(sauce)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_sauces)} Momo sauces/preparations created and linked."))

        # 4. Waffles
        waffles_data = [
            ("Single Waffle (Single Piece)", Decimal('50.00'), "", 1),
            ("White", Decimal('80.00'), "", 2),
            ("Milk", Decimal('80.00'), "", 3),
            ("Dark", Decimal('100.00'), "", 4),
            ("ButterScoth", Decimal('100.00'), "", 5), # Kept exact spelling from menu: ButterScoth
            ("Hazelnut", Decimal('100.00'), "", 6),
            ("Double Choco", Decimal('110.00'), "", 7),
            ("Triple Choco", Decimal('120.00'), "", 8),
        ]
        created_waffle_items = []
        for name, price, desc, order in waffles_data:
            item, _ = MenuItem.objects.update_or_create(
                category=waffles_cat,
                name=name,
                defaults={
                    'price': price,
                    'description': desc,
                    'display_order': order,
                    'is_available': True
                }
            )
            created_waffle_items.append(item)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_waffle_items)} Waffle items created."))

        # 5. Waffle Add-ons (from menu: "Choose Chocolate Flavour Waffle - Rs. 20", "Biscoff, Cookie Add-On - Rs. 20")
        waffle_addons_data = [
            ("Chocolate Flavour Waffle", Decimal('20.00')),
            ("Biscoff, Cookie Add-On", Decimal('20.00')),
        ]
        created_waffle_addons = []
        for name, price in waffle_addons_data:
            addon, _ = AddOn.objects.update_or_create(
                name=name,
                category_type='WAFFLE',
                defaults={
                    'price': price,
                    'is_available': True
                }
            )
            addon.applicable_items.set(created_waffle_items)
            created_waffle_addons.append(addon)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_waffle_addons)} Waffle add-ons created and linked."))

        # 6. Bun Items
        bun_data = [
            ("Bun Butter Jam", Decimal('40.00'), "", 1),
            ("Bun Palkova", Decimal('50.00'), "", 2),
            ("Bun Gulgand", Decimal('50.00'), "", 3),
            ("Choco Bun", Decimal('50.00'), "", 4),
        ]
        created_buns = []
        for name, price, desc, order in bun_data:
            item, _ = MenuItem.objects.update_or_create(
                category=bun_cat,
                name=name,
                defaults={
                    'price': price,
                    'description': desc,
                    'display_order': order,
                    'is_available': True
                }
            )
            created_buns.append(item)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_buns)} Bun items created."))

        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Successfully seeded Stuff & Puff Chengalpattu database from real menu!"))
