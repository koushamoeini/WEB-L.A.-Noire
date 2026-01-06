from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'payments', PaymentViewSet)


urlpatterns = [path('', include(router.urls))]
