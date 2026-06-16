set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input

if [ "$CREATE_SUPERUSER" = "True" ]; then
  python manage.py shell << END
from apps.accounts.models import CustomUser
import os

email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME')
last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME')
phone_number = os.environ.get('DJANGO_SUPERUSER_PHONE_NUMBER', '')
username = email

if not CustomUser.objects.filter(email=email).exists():
    CustomUser.objects.create_superuser(
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        password=password,
    )
    print("Superuser created.")
else:
    print("Superuser already exists.")
END
fi