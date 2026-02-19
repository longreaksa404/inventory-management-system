#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Force create superuser using a Python script to handle the custom fields
if [ "$CREATE_SUPERUSER" = "True" ]; then
  python manage.py shell << END
from accounts.models import CustomUser
import os

username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')
phone = os.environ.get('DJANGO_SUPERUSER_PHONE_NUMBER', '+85512345678')

if not CustomUser.objects.filter(email=email).exists():
    CustomUser.objects.create_superuser(
        email=email,
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone
    )
    print("Superuser created successfully")
else:
    print("Superuser already exists")
END
fi