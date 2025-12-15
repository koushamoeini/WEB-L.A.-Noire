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

urlpatterns = [
    path('', TemplateView.as_view(template_name='landing/index.html'), name='landing'),
    path('register/', TemplateView.as_view(template_name='landing/register.html'), name='register'),
    path('login/', TemplateView.as_view(template_name='landing/login.html'), name='login'),
    path('dashboard/', TemplateView.as_view(template_name='landing/dashboard.html'), name='dashboard'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
]
