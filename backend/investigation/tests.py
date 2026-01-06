from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Suspect, Warrant
from cases.models import Case

class InvestigationAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.detective = self.User.objects.create_user("det", "d@t.com", "pass", first_name="Det", last_name="One")
        self.sergeant = self.User.objects.create_user("sgt", "s@t.com", "pass", first_name="Sgt", last_name="One")
        self.case = Case.objects.create(title="Test", creator=self.detective)
        self.suspect = Suspect.objects.create(case=self.case, name="John Doe", national_id="123")

    def test_list_suspects(self):
        self.client.force_authenticate(user=self.detective)
        url = reverse("suspect-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_suspect_ranking(self):
        self.client.force_authenticate(user=self.detective)
        url = reverse("suspect-ranking")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_create_warrant(self):
        self.client.force_authenticate(user=self.detective)
        url = reverse("warrant-list")
        payload = {"case": self.case.id, "type": "arrest", "reason": "Evidence found"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_boards(self):
        self.client.force_authenticate(user=self.detective)
        url = reverse("board-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_interrogation_access(self):
        self.client.force_authenticate(user=self.detective)
        url = reverse("interrogation-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
