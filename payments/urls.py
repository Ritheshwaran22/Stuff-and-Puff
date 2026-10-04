from django.urls import path
from . import views

urlpatterns = [
    path('cashfree/return/', views.cashfree_return_view, name='cashfree_return'),
    path('cashfree/webhook/', views.cashfree_webhook_view, name='cashfree_webhook'),
]
