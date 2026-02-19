set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [ "$CREATE_SUPERUSER" ]; then
  python manage.py createsuperuser \
    --no-input \
    --username "$DJANGO_SUPERUSER_USERNAME" \
    --email "$DJANGO_SUPERUSER_EMAIL" \
    --first_name "$DJANGO_SUPERUSER_FIRST_NAME" \
    --last_name "$DJANGO_SUPERUSER_LAST_NAME" \
    --phone_number "$DJANGO_SUPERUSER_PHONE_NUMBER" || true
fi