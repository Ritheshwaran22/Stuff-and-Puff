from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True, help_text="Short description from real menu (optional)")
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True, help_text="Uncheck when sold out")
    spice_level = models.PositiveSmallIntegerField(default=0, help_text="Number of chilis (0-3) for spicy items")
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__display_order', 'display_order', 'name']

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({'Available' if self.is_available else 'Sold Out'})"


class AddOn(models.Model):
    CATEGORY_TYPES = [
        ('SAUCE', 'Momo Sauce / Preparation'),
        ('WAFFLE', 'Waffle Add-On'),
        ('GENERAL', 'General Add-On'),
    ]

    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES, default='SAUCE')
    is_available = models.BooleanField(default=True)
    spice_level = models.PositiveSmallIntegerField(default=0, help_text="Spice level (0-3)")
    applicable_items = models.ManyToManyField(
        MenuItem,
        related_name='applicable_addons',
        blank=True,
        help_text="Menu items that this sauce/add-on can be added to"
    )

    class Meta:
        ordering = ['category_type', 'price', 'name']

    def __str__(self):
        return f"{self.name} (+₹{self.price})"
