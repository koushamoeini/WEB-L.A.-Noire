import os
import django
import sys

# Change to the current directory (backend/) to make sure imports work
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models import Q
from cases.models import Case

def test():
    cond_level0 = Q(
        crime_level=0,
        suspects__interrogations__feedback__is_chief_confirmed=True,
        suspects__interrogations__feedback__decision='GUILTY'
    )
    cond_other = Q(
        crime_level__gt=0,
        suspects__interrogations__feedback__is_confirmed=True,
        suspects__interrogations__feedback__decision='GUILTY'
    )
    conditions = (cond_level0 | cond_other)
    
    try:
        print("Querying database...")
        qs = Case.objects.filter(conditions).distinct()
        print(f"Results count: {qs.count()}")
        for c in qs:
            print(f"- Case #{c.id}: {c.title}")
        print("Done!")
    except Exception as e:
        print(f"Error executing query: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
