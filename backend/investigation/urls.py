from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuspectViewSet, InterrogationViewSet, BoardConnectionViewSet, BoardViewSet, VerdictViewSet, WarrantViewSet

router = DefaultRouter()
router.register(r'boards', BoardViewSet)
router.register(r'suspects', SuspectViewSet)
router.register(r'interrogations', InterrogationViewSet)
router.register(r'board-connections', BoardConnectionViewSet)
router.register(r'verdicts', VerdictViewSet)
router.register(r'warrants', WarrantViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
