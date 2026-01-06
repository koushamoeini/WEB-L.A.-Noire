from rest_framework import permissions
from cases.permissions import HasRole

class IsCaptain(HasRole):
    def __init__(self): super().__init__(['captain', 'police_chief'])

class IsDetective(HasRole):
    def __init__(self): super().__init__(['detective', 'captain', 'police_chief'])

class IsJudge(HasRole):
    def __init__(self): super().__init__(['judge', 'qazi'])
