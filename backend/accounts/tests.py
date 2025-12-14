from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from rest_framework import status

from .models import Role


class RoleAssignmentTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser('admin', 'admin@example.com', 'pass')
        self.staff = User.objects.create_user('staff', 'staff@example.com', 'pass')
        self.user = User.objects.create_user('user', 'user@example.com', 'pass')
        self.client = Client()
        self.role = Role.objects.create(name='manager')

    def test_superuser_can_assign_roles(self):
        self.client.login(username='admin', password='pass')
        resp = self.client.post(f'/api/users/{self.user.pk}/roles/', {'roles': [self.role.pk]})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertIn(self.role, list(self.user.roles.all()))

    def test_non_superuser_cannot_assign_roles(self):
        self.client.login(username='staff', password='pass')
        resp = self.client.post(f'/api/users/{self.user.pk}/roles/', {'roles': [self.role.pk]})
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED))
        self.user.refresh_from_db()
        self.assertNotIn(self.role, list(self.user.roles.all()))
