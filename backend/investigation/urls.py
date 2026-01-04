from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuspectViewSet, InterrogationViewSet, BoardConnectionViewSet, BoardViewSet

router = DefaultRouter()
router.register(r'boards', BoardViewSet)
router.register(r'suspects', SuspectViewSet)
router.register(r'interrogations', InterrogationViewSet)
router.register(r'board-connections', BoardConnectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
