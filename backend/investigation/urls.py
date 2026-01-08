from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SuspectViewSet, InterrogationViewSet, BoardConnectionViewSet, 
    BoardViewSet, VerdictViewSet, WarrantViewSet, RewardReportViewSet
)

router = DefaultRouter()
router.register(r'boards', BoardViewSet)
router.register(r'suspects', SuspectViewSet)
router.register(r'interrogations', InterrogationViewSet)
router.register(r'board-connections', BoardConnectionViewSet)
router.register(r'verdicts', VerdictViewSet)
router.register(r'warrants', WarrantViewSet, basename='warrant')
router.register(r'reward-reports', RewardReportViewSet, basename='reward-report')



urlpatterns = [
    path('', include(router.urls)),
]
