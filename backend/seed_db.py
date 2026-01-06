import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Role
from cases.models import Case
from evidence.models import BiologicalEvidence, WitnessTestimony
from investigation.models import Suspect, Interrogation, Board

User = get_user_model()

def seed_data():
    print("Seeding database...")

    # 1. Create Roles
    roles_data = [
        ('system_admin', 'مدیر کل سامانه'),
        ('police_chief', 'رییس پلیس'),
        ('captain', 'کاپیتان'),
        ('sergeant', 'گروهبان'),
        ('detective', 'کارآگاه'),
        ('police_officer', 'مامور پلیس'),
        ('trainee', 'کارآموز'),
        ('forensic_doctor', 'پزشک قانونی'),
        ('complainant', 'شاکی'),
        ('judge', 'قاضی'),
        ('base_user', 'کاربر پایه'),
    ]
    
    role_objs = {}
    for code, name in roles_data:
        role, _ = Role.objects.get_or_create(code=code, defaults={'name': name})
        role_objs[code] = role

    # 2. Create Users for each role
    passwords = "password123"
    
    users_to_create = [
        ('admin', 'system_admin'),
        ('chief', 'police_chief'),
        ('captain', 'captain'),
        ('sergeant', 'sergeant'),
        ('detective', 'detective'),
        ('doctor', 'forensic_doctor'),
        ('judge_user', 'judge'),
        ('citizen', 'complainant'),
    ]

    for username, role_code in users_to_create:
        user, created = User.objects.get_or_create(
            username=username, 
            defaults={'email': f'{username}@example.com'}
        )
        if created:
            user.set_password(passwords)
            user.save()
        user.roles.add(role_objs[role_code])
        if role_code == 'system_admin':
            user.is_superuser = True
            user.is_staff = True
            user.save()
        print(f"User '{username}' ready with role '{role_code}'")

    # 3. Create a Sample Case
    citizen = User.objects.get(username='citizen')
    detective = User.objects.get(username='detective')
    doctor = User.objects.get(username='doctor')

    case, _ = Case.objects.get_or_create(
        title="سرقت از بانک مرکزی",
        defaults={
            'description': "در تاریخ مذکور، سارقین مسلح به بانک حمله کردند.",
            'crime_level': 1, # Level 1
            'status': 'AC',  # Active
            'creator': citizen
        }
    )
    case.complainants.add(citizen)

    # 4. Add Evidence
    WitnessTestimony.objects.get_or_create(
        case=case,
        title="شهادت نگهبان",
        defaults={
            'description': "نگهبان سارقین را با ماسک دیده است.",
            'transcript': "آنها ۳ نفر بودند و با یک ون سفید فرار کردند.",
            'recorder': detective
        }
    )

    BiologicalEvidence.objects.get_or_create(
        case=case,
        title="نمونه خون در صحنه",
        defaults={
            'description': "یک قطره خون روی شیشه شکسته پیدا شد.",
            'is_verified': False,
            'recorder': detective
        }
    )

    # 5. Add Suspect & Interrogation
    suspect, _ = Suspect.objects.get_or_create(
        case=case,
        name="آرمان کلاهبردار",
        defaults={'details': "سابقه دار در سرقت مسلحانه", 'is_main_suspect': True, 'is_on_board': True}
    )

    Interrogation.objects.get_or_create(
        suspect=suspect,
        defaults={
            'interrogator': detective,
            'transcript': "من آن شب در خانه بودم و داشتم فوتبال می‌دیدم.",
            'score': 4
        }
    )
    
    # Ensure Board exists
    Board.objects.get_or_create(case=case)

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
