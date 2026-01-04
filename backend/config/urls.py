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

from . import views

urlpatterns = [
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
    path('investigation/', TemplateView.as_view(template_name='landing/investigation.html'), name='investigation'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('cases.urls')),
    path('api/evidence/', include('evidence.urls')),
    path('api/investigation/', include('investigation.urls')),
]
