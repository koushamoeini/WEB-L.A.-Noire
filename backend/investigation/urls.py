from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuspectViewSet, InterrogationViewSet, BoardConnectionViewSet, BoardViewSet, VerdictViewSet

router = DefaultRouter()
router.register(r'boards', BoardViewSet)
router.register(r'suspects', SuspectViewSet)
router.register(r'interrogations', InterrogationViewSet)
router.register(r'board-connections', BoardConnectionViewSet)
router.register(r'verdicts', VerdictViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
