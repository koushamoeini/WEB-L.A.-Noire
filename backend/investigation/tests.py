from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Suspect, Warrant, Board
from cases.models import Case
from accounts.models import Role

class InvestigationAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        # Create roles
        detective_role, _ = Role.objects.get_or_create(code='detective', defaults={'name': 'Detective'})
        
        # Create user with detective role
        self.detective = self.User.objects.create_user("det", "d@t.com", "pass", first_name="Det", last_name="One")
        self.detective.roles.add(detective_role)
        
        self.case = Case.objects.create(title="Test", creator=self.detective)
        self.suspect = Suspect.objects.create(case=self.case, first_name="John", last_name="Doe")
        Board.objects.create(case=self.case)

    def test_list_suspects(self):
        """Test 7: List suspects endpoint"""
        self.client.force_authenticate(user=self.detective)
        url = reverse("suspect-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_warrant(self):
        """Test 8: Create warrant with role-based permission"""
        self.client.force_authenticate(user=self.detective)
        url = reverse("warrant-list")
        payload = {"case": self.case.id, "suspect": self.suspect.id, "type": "ARREST", "description": "Evidence found"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_boards(self):
        """Test 9: Investigation board endpoint"""
        self.client.force_authenticate(user=self.detective)
        url = reverse("board-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_suspect_detail(self):
        """Test 10: Get suspect detail endpoint"""
        self.client.force_authenticate(user=self.detective)
        url = reverse("suspect-detail", args=[self.suspect.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'John')
