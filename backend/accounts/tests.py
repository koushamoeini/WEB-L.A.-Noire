from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class RegistrationTests(APITestCase):
    def test_register_without_first_and_last_name(self):
        payload = {
            'username': 'testuser1',
            'password': 's3cretpass!',
            'email': 'test1@example.com',
            'phone': '09123456789',
            'national_code': '0123456789',
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.data)
        User = get_user_model()
        self.assertTrue(User.objects.filter(username=payload['username']).exists())
