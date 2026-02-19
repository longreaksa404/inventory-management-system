#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser if the flag is set
if [ "$CREATE_SUPERUSER" = "True" ]; then
  python manage.py shell << END
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()

# Fetch variables from the environment
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not email or not password:
    print("--- ERROR: DJANGO_SUPERUSER_EMAIL or PASSWORD not found in environment ---")
else:
    if not User.objects.filter(email=email).exists():
        print(f"--- Creating superuser for {email} ---")
        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            first_name="Admin",
            last_name="User"
        )
        print("--- Superuser created successfully ---")
    else:
        # If it exists, we update the password to match your current env var
        print(f"--- Superuser {email} already exists. Updating password... ---")
        u = User.objects.get(email=email)
        u.set_password(password)
        u.is_staff = True
        u.is_superuser = True
        u.save()
        print("--- Password updated successfully ---")
END
fi