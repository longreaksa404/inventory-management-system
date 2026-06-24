from django.contrib.auth.hashers import check_password


def change_password(user, old_password, new_password):
    if not check_password(old_password, user.password):
        raise ValueError("Old password is incorrect")

    user.set_password(new_password)
    user.save()
    return user
