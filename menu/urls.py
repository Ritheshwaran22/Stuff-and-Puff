from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('privacy/', views.privacy_view, name='privacy'),
    path('terms/', views.terms_view, name='terms'),
    path('refund-policy/', views.refund_policy_view, name='refund_policy'),
]
