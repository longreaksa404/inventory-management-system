set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input

if [ "$CREATE_SUPERUSER" = "True" ]; then
  python manage.py shell << END
...
END
fi