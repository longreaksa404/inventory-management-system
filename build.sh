set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

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
# Default phone number to satisfy your model's requirement
phone = os.environ.get('DJANGO_SUPERUSER_PHONE', '+85512345678')

if not email or not password:
    print("--- ERROR: DJANGO_SUPERUSER_EMAIL or PASSWORD not found ---")
else:
    if not User.objects.filter(email=email).exists():
        print(f"--- Creating superuser for {email} ---")
        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            first_name="admin",
            last_name="user",
            phone_number=phone
        )
        print("--- Superuser created successfully ---")
    else:
        print(f"--- Superuser {email} already exists. Updating password/phone... ---")
        u = User.objects.get(email=email)
        u.set_password(password)
        u.phone_number = phone
        u.is_staff = True
        u.is_superuser = True
        u.save()
        print("--- User updated successfully ---")
END
fi