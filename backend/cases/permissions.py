from rest_framework import permissions

class HasRole(permissions.BasePermission):
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles
    def has_permission(self, request, view):
        if not request.user.is_authenticated: return False
        return request.user.roles.filter(code__in=self.allowed_roles).exists()

class IsTrainee(HasRole):
    def __init__(self): super().__init__(['trainee'])

class IsOfficerOrHigher(HasRole):
    def __init__(self): super().__init__(['police_officer', 'captain', 'police_chief', 'sergeant', 'detective'])

class IsChief(HasRole):
    def __init__(self): super().__init__(['police_chief'])

class IsSergeant(HasRole):
    def __init__(self): super().__init__(['sergeant', 'captain', 'police_chief'])

class IsDetective(HasRole):
    def __init__(self): super().__init__(['detective', 'captain', 'police_chief'])
