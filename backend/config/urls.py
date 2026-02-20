"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from investigation.views import CriminalRankingView, GlobalStatsView

from . import views

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/ranking/', CriminalRankingView.as_view(), name='criminal-ranking'),
    path('api/global-stats/', GlobalStatsView.as_view(), name='global-stats'),

    path('', TemplateView.as_view(template_name='landing/index.html'), name='landing'),

    path('register/', TemplateView.as_view(template_name='landing/register.html'), name='register'),
    path('login/', TemplateView.as_view(template_name='landing/login.html'), name='login'),
    path('dashboard/', TemplateView.as_view(template_name='landing/dashboard_router.html'), name='dashboard'),
    path('dashboard/admin/', TemplateView.as_view(template_name='landing/dashboard.html'), name='dashboard-admin'),
    path('dashboard/user/', TemplateView.as_view(template_name='landing/dashboard_user.html'), name='dashboard-user'),
    path('dashboard/judge/', TemplateView.as_view(template_name='landing/dashboard_judge.html'), name='dashboard-judge'),
    path('dashboard/role/<slug:role_code>/', views.role_dashboard, name='dashboard-role'),
    path('cases/', TemplateView.as_view(template_name='landing/cases.html'), name='cases'),
    path('evidence/', TemplateView.as_view(template_name='landing/evidence.html'), name='evidence'),
    path('court/', TemplateView.as_view(template_name='landing/court.html'), name='court'),
    path('investigation/', TemplateView.as_view(template_name='landing/investigation.html'), name='investigation'),
    path('suspects/status/', TemplateView.as_view(template_name='landing/suspect_status.html'), name='suspect-status'),
    path('rewards/', TemplateView.as_view(template_name='landing/reward_report.html'), name='reward-report'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('cases.urls')),
    path('api/evidence/', include('evidence.urls')),
    path('api/investigation/', include('investigation.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
