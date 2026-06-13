# config/settings/local.py
#
# Local development settings — safe to use without PostgreSQL or Redis.
# Uses SQLite for the database and prints emails to the console.
#
# Run the server with:
#   $env:DJANGO_SETTINGS_MODULE="config.settings.local"; python manage.py runserver

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# SQLite — no PostgreSQL install needed for local dev
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Prints emails to the terminal instead of sending them
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Celery runs tasks synchronously in the same process — no Redis needed
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# Disable SSL redirect for local HTTP
SECURE_SSL_REDIRECT = False

SWAGGER_USE_COMPAT_RENDERERS = False