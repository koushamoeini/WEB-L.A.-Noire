from django.shortcuts import render


def role_dashboard(request, role_code: str):
    return render(request, 'landing/dashboard_role.html', {'role_code': role_code})
