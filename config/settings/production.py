# config/settings/production.py
from .base import *
import os
import dj_database_url

DEBUG = False

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".render.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://*.render.com",
]

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
    )
}

# Security settings
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")

# FIX: Use os.environ[] (KeyError) not .get() so a missing REDIS_URL in
# production fails loudly at startup instead of silently connecting to
# localhost (which doesn't exist on cloud hosts) and hanging.
CELERY_BROKER_URL = os.environ["REDIS_URL"]
CELERY_RESULT_BACKEND = os.environ["REDIS_URL"]
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = True

if CELERY_BROKER_URL.startswith('rediss://'):
    CELERY_BROKER_USE_SSL = {'ssl_cert_reqs': None}
    CELERY_REDIS_BACKEND_USE_SSL = {'ssl_cert_reqs': None}

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

ROOT_URLCONF = "config.urls"