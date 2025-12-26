from rest_framework import viewsets, permissions
from .models import Case
from .serializers import CaseSerializer


class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all().order_by('id')
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]