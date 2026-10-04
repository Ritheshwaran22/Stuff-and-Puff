from django.shortcuts import render
from django.db.models import Prefetch
from .models import Category, MenuItem, AddOn

def home_view(request):
    # Fetch active categories with their menu items ordered by display_order
    categories = Category.objects.filter(is_active=True).prefetch_related(
        Prefetch(
            'items',
            queryset=MenuItem.objects.all().order_by('display_order', 'name')
        )
    ).order_by('display_order', 'name')

    # All items with active applicable add-ons for the client customization modal
    all_items_with_addons = MenuItem.objects.prefetch_related(
        Prefetch(
            'applicable_addons',
            queryset=AddOn.objects.filter(is_available=True)
        )
    )

    context = {
        'categories': categories,
        'all_items_with_addons': all_items_with_addons,
    }
    return render(request, 'home.html', context)

def privacy_view(request):
    return render(request, 'privacy.html')

def terms_view(request):
    return render(request, 'terms.html')

def refund_policy_view(request):
    return render(request, 'refund_policy.html')
