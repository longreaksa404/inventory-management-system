# apps/accounts/models.py
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.core.validators import RegexValidator


class CustomUserManager(BaseUserManager):

    def create_user(
            self,
            email,
            first_name,
            last_name,
            username,
            phone_number=None,
            password=None,
            role='staff',
            **extra_fields
    ):
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')
        if not first_name:
            raise ValueError('Users must have a first name')
        if not last_name:
            raise ValueError('Users must have a last name')
        # FIX: The original guard raised ValueError for missing phone_number,
        # but create_superuser() passed phone_number=None by default. When the
        # DJANGO_SUPERUSER_PHONE env var was missing, superuser creation silently
        # failed with an unhelpful ValueError instead of a clear deployment error.
        # Now we only enforce phone_number for non-superuser accounts. Superusers
        # may have a blank phone (build.sh provides a default; CI/CD won't break).
        is_superuser = extra_fields.get('is_superuser', False)
        if not phone_number and not is_superuser:
            raise ValueError('Users must have a phone number')

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=username,
            phone_number=phone_number or '',
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
            self,
            email,
            first_name,
            last_name,
            username,
            phone_number=None,
            password=None,
            **extra_fields
    ):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(
            email, first_name, last_name, username,
            phone_number, password, role='admin', **extra_fields
        )


class CustomUser(AbstractBaseUser, PermissionsMixin):
    # FIX: ROLE_CHOICES uses lowercase stored values consistently.
    # Always compare against the stored value ('admin', not 'Admin').
    # Django admin displays the human-readable label ('Admin') — that's separate.
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    )

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    username = models.CharField(max_length=255, unique=True)
    phone_validator = RegexValidator(
        regex=r'^\+855\d{8,9}$',
        message="Phone number must be in +855xxxxxxxx format.",
    )
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=13,
        blank=True,
        null=False,
        default='',
    )
    role = models.CharField(max_length=255, choices=ROLE_CHOICES, default='staff')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} ({self.role})"