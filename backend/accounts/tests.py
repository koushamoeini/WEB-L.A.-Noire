from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Role

class AccountsAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.admin = self.User.objects.create_superuser('admin', 'admin@test.com', 'pass123')
        self.role_base, _ = Role.objects.get_or_create(code='base_user', defaults={'name': 'Base User'})
        
    def test_register_success(self):
        url = reverse('register')
        payload = {
            'username': 'newuser', 'password': 'password123', 'email': 'new@test.com',
            'first_name': 'Ali', 'last_name': 'Alavi', 'phone': '09121112233', 'national_code': '0012345678'
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)

    def test_login_success(self):
        self.User.objects.create_user('user1', 'u1@test.com', 'pass123')
        url = reverse('login')
        payload = {'identifier': 'user1', 'password': 'pass123'}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_me_endpoint(self):
        user = self.User.objects.create_user('user2', 'u2@test.com', 'pass123')
        self.client.force_authenticate(user=user)
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'user2')

    def test_admin_list_users(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_unauthorized_profile_access(self):
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
