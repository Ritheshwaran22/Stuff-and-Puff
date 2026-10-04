from django.urls import path
from . import views

urlpatterns = [
    path('', views.staff_dashboard_view, name='staff_dashboard'),
    path('toggle-shop/', views.toggle_shop_status, name='toggle_shop_status'),
    path('toggle-ordering/', views.toggle_online_ordering, name='toggle_online_ordering'),
    path('order/<int:order_id>/status/', views.update_order_status, name='update_order_status'),
    path('item/<int:item_id>/availability/', views.toggle_item_availability, name='toggle_item_availability'),
    path('order/<int:order_id>/refund/', views.emergency_closure_refund, name='emergency_closure_refund'),
]
