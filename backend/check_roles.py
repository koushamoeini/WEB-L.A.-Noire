import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
for u in User.objects.all():
    print(f"User: {u.username} (ID: {u.id}), Names: {u.get_full_name()}, Roles: {[r.code for r in u.roles.all()]}")
