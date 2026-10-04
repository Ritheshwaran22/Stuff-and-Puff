from django.contrib import admin
from .models import Category, MenuItem, AddOn

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'display_order', 'is_active')
    list_editable = ('display_order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'spice_level', 'display_order')
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'description')
    list_editable = ('price', 'is_available', 'display_order')
    actions = ['mark_available', 'mark_sold_out']

    @admin.action(description="Mark selected items as AVAILABLE")
    def mark_available(self, request, queryset):
        queryset.update(is_available=True)

    @admin.action(description="Mark selected items as SOLD OUT")
    def mark_sold_out(self, request, queryset):
        queryset.update(is_available=False)


@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'price', 'is_available', 'spice_level')
    list_filter = ('category_type', 'is_available')
    list_editable = ('price', 'is_available')
    filter_horizontal = ('applicable_items',)
    actions = ['mark_available', 'mark_unavailable']

    @admin.action(description="Mark selected add-ons as AVAILABLE")
    def mark_available(self, request, queryset):
        queryset.update(is_available=True)

    @admin.action(description="Mark selected add-ons as UNAVAILABLE")
    def mark_unavailable(self, request, queryset):
        queryset.update(is_available=False)
