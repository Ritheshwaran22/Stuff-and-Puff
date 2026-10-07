from django.conf import settings

def shop_context(request):
    try:
        from shop.models import ShopSettings
        shop_settings = ShopSettings.get_settings()
        is_shop_open = shop_settings.shop_open
        is_online_orders_enabled = shop_settings.online_orders_enabled
    except Exception:
        shop_settings = None
        is_shop_open = True
        is_online_orders_enabled = True

    return {
        'shop_settings': shop_settings,
        'is_shop_open': is_shop_open,
        'is_online_orders_enabled': is_online_orders_enabled,
        'business_name': getattr(settings, 'BUSINESS_NAME', 'Stuff & Puff | Chengalpattu'),
        'business_tagline': getattr(settings, 'BUSINESS_TAGLINE', 'MOMOS. WAFFLES. BUNS.'),
        'business_location': getattr(settings, 'BUSINESS_LOCATION', 'Near GH Bus Stop, Chengalpattu'),
        'business_location_details': getattr(settings, 'BUSINESS_LOCATION_DETAILS', 'Right side near GH Bus Stop, Chengalpattu'),
        'business_contact': getattr(settings, 'BUSINESS_CONTACT', '+91 83101 04426'),
        'business_hours': "5:00 PM – 10:00 PM",
        'google_maps_directions_url': getattr(
            settings,
            'GOOGLE_MAPS_DIRECTIONS_URL',
            'https://www.google.com/maps/dir/?api=1&destination=12.679571,79.9808547'
        ),
    }
