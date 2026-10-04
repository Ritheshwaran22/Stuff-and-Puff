import os
from pathlib import Path
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-stuff-and-puff-chengalpattu-secret-key-2026')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://127.0.0.1,http://localhost', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Custom Apps
    'shop.apps.ShopConfig',
    'menu.apps.MenuConfig',
    'orders.apps.OrdersConfig',
    'payments.apps.PaymentsConfig',
    'notifications.apps.NotificationsConfig',
    'dashboard.apps.DashboardConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'stuffandpuff.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'shop.context_processors.shop_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'stuffandpuff.wsgi.application'

import dj_database_url

db_url = config('DATABASE_URL', default=None)
if db_url:
    DATABASES = {
        'default': dj_database_url.parse(db_url, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' if not DEBUG else 'django.contrib.staticfiles.storage.StaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Business Constants
BUSINESS_NAME = "Stuff & Puff | Chengalpattu"
BUSINESS_TAGLINE = "MOMOS. WAFFLES. BUNS."
BUSINESS_LOCATION = "Near GH Bus Stop, Chengalpattu"
BUSINESS_LOCATION_DETAILS = "Right side near GH Bus Stop, Chengalpattu"
BUSINESS_CONTACT = "+91 83101 04426"

# Payment Gateway Configuration (Cashfree)
# Provider can be 'CASHFREE' (real Cashfree API) or 'SANDBOX' (instant local simulation)
PAYMENT_GATEWAY_PROVIDER = config('PAYMENT_GATEWAY_PROVIDER', default='CASHFREE')
CASHFREE_CLIENT_ID = config('CASHFREE_CLIENT_ID', default='')
CASHFREE_CLIENT_SECRET = config('CASHFREE_CLIENT_SECRET', default='')
CASHFREE_ENVIRONMENT = config('CASHFREE_ENVIRONMENT', default='SANDBOX') # 'SANDBOX' or 'PRODUCTION'
CASHFREE_API_VERSION = config('CASHFREE_API_VERSION', default='2023-08-01')


# Brevo Email Configuration
BREVO_API_KEY = os.getenv('BREVO_API_KEY', config('BREVO_API_KEY', default=''))
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', config('BREVO_SENDER_EMAIL', default=''))
BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', config('BREVO_SENDER_NAME', default='Stuff & Puff'))

