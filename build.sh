set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input

if [ "$CREATE_SUPERUSER" = "True" ]; then
    python manage.py shell -c "
from apps.accounts.models import CustomUser
import os
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')
phone = os.environ.get('DJANGO_SUPERUSER_PHONE_NUMBER', '')
if not CustomUser.objects.filter(email=email).exists():
    CustomUser.objects.create_superuser(email=email, username=email, first_name=first_name, last_name=last_name, phone_number=phone, password=password)
    print('Superuser created.')
else:
    print('Superuser already exists.')
"
fi