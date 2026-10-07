from django.shortcuts import render
from django.db.models import Prefetch
from django.core.cache import cache
from .models import Category, MenuItem, AddOn

def home_view(request):
    menu_data = cache.get('home_menu_data')
    if menu_data is None:
        # Fetch active categories with menu items and active applicable add-ons prefetched
        active_addons = AddOn.objects.filter(is_available=True)
        items_qs = MenuItem.objects.all().order_by('display_order', 'name').prefetch_related(
            Prefetch('applicable_addons', queryset=active_addons)
        )

        categories = list(
            Category.objects.filter(is_active=True).prefetch_related(
                Prefetch('items', queryset=items_qs)
            ).order_by('display_order', 'name')
        )

        # Reuse the already prefetched items for the client customization modal (0 extra DB queries)
        all_items_with_addons = [item for cat in categories for item in cat.items.all()]

        menu_data = {
            'categories': categories,
            'all_items_with_addons': all_items_with_addons,
        }
        cache.set('home_menu_data', menu_data, 300)

    context = {
        'categories': menu_data['categories'],
        'all_items_with_addons': menu_data['all_items_with_addons'],
    }
    return render(request, 'home.html', context)

def privacy_view(request):
    return render(request, 'privacy.html')

def terms_view(request):
    return render(request, 'terms.html')

def refund_policy_view(request):
    return render(request, 'refund_policy.html')
