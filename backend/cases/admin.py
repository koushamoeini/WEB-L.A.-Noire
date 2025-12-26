from django.contrib import admin
from .models import Case, CrimeScene, SceneWitness

class SceneInline(admin.StackedInline): model = CrimeScene
@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'get_status_display', 'get_crime_level_display', 'creator')
    list_filter = ('status', 'crime_level')
    inlines = [SceneInline]
