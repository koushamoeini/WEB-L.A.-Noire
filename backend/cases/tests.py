from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Case
from django.contrib.auth import get_user_model

class CaseAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user('complainant', 'c@test.com', 'pass')
        self.case = Case.objects.create(title='Test Case', description='desc', creator=self.user)

    def test_list_cases(self):
        """Test 4: List all cases (GET endpoint)"""
        self.client.force_authenticate(user=self.user)
        url = reverse('case-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_case(self):
        """Test 5: Create new case (POST endpoint)"""
        self.client.force_authenticate(user=self.user)
        url = reverse('case-list')
        payload = {'title': 'New Case', 'description': 'New desc'}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_case_detail(self):
        """Test 6: Get case detail (GET by ID)"""
        self.client.force_authenticate(user=self.user)
        url = reverse('case-detail', args=[self.case.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Case')
