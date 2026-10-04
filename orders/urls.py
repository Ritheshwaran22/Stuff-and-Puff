from django.urls import path
from . import views

urlpatterns = [
    path('checkout/', views.checkout_view, name='checkout'),
    path('api/slots/', views.api_get_slots, name='api_get_slots'),
    path('api/orders/create/', views.api_create_order, name='api_create_order'),
    path('orders/pay/<int:order_id>/', views.pay_order_view, name='pay_order'),
    path('orders/verify/<int:order_id>/', views.verify_payment_view, name='verify_payment'),
    path('order/confirmed/<str:token>/', views.order_confirmation_view, name='order_confirmation'),
    path('orders/lookup/', views.customer_lookup_view, name='customer_lookup'),
]
