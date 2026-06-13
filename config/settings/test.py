# config/settings/test.py
from .base import *

# FIX: Previously had no DATABASES override, so the DATABASE_URL from .env
# bled into test runs. If .env pointed at a shared dev Postgres server, tests
# would run against real data. Pinning to in-memory SQLite ensures tests are
# always isolated and fast, regardless of the local environment.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
SWAGGER_USE_COMPAT_RENDERERS = False

# Use in-memory email backend so mail.outbox works in tests
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Provide a default admin notification email for signal tests
ADMIN_NOTIFICATION_EMAIL = "admin@test.com"
DEFAULT_FROM_EMAIL = "noreply@test.com"