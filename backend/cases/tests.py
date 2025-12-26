from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Case


class CaseAPITest(APITestCase):
    def setUp(self):
        Case.objects.create(title='Test case 1', description='desc')

    def test_list_cases(self):
        url = reverse('case-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)