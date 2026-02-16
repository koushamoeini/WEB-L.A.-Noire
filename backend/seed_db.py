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
        ('admin', 'system_admin', '1111111111', '09111111111'),
        ('chief', 'police_chief', '2222222222', '09222222222'),
        ('captain', 'captain', '3333333333', '09333333333'),
        ('sergeant', 'sergeant', '4444444444', '09444444444'),
        ('detective', 'detective', '5555555555', '09555555555'),
        ('officer', 'police_officer', '1010101010', '09101010101'),
        ('trainee_user', 'trainee', '1212121212', '09121212121'),
        ('doctor', 'forensic_doctor', '6666666666', '09666666666'),
        ('judge_user', 'judge', '7777777777', '09777777777'),
        ('citizen', 'complainant', '8888888888', '09888888888'),
        ('base', 'base_user', '1313131313', '09131313131'),
    ]
    
    user_objs = {}
    for username, rcode, ncode, phone in users_to_create:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@police.ir',
                'is_staff': (username == 'admin'),
                'is_superuser': (username == 'admin'),
            }
        )
        if created:
            user.set_password(passwords)
            user.save()
        
        # Profile fields
        from accounts.models import UserProfile
        UserProfile.objects.update_or_create(
            user=user,
            defaults={'national_code': ncode, 'phone': phone}
        )
        
        user.roles.add(role_objs[rcode])
        user_objs[username] = user
        print(f"User '{username}' ready with role '{rcode}'")

    # 3. Create Sample Cases
    chief = user_objs['chief']
    detective = user_objs['detective']
    citizen = user_objs['citizen']

    # Case 1: Active
    case1, _ = Case.objects.get_or_create(
        title="سرقت از بانک ملت",
        defaults={
            'description': "سرقت مسلحانه از شعبه مرکزی در ساعت ۱۰ شب.",
            'creator': chief,
            'status': 'AC', # Active
            'crime_level': 2 # Critical
        }
    )

    # Case 2: Pending (Citizen Complaint)
    case2, _ = Case.objects.get_or_create(
        title="شکایت کلاهبرداری تلفنی",
        defaults={
            'description': "فردی با تماس تلفنی اقدام به تخلیه حساب بانکی کرده است.",
            'creator': citizen,
            'status': 'PT', # Pending Trainee
            'crime_level': 1 # Normal
        }
    )

    # Case 3: Solved
    case3, _ = Case.objects.get_or_create(
        title="نزاع خیابانی در پارک",
        defaults={
            'description': "درگیری فیزیکی گزارش شده در تاریخ ۱۴۰۴/۰۱/۱۰.",
            'creator': chief,
            'status': 'SL', # Solved
            'crime_level': 1 # Normal
        }
    )

    # 4. Add Evidence to Case 1
    BiologicalEvidence.objects.get_or_create(
        case=case1,
        defaults={
            'title': "اثر انگشت روی گاوصندوق",
            'description': "اثر انگشت در گوشه سمت چپ گاوصندوق پیدا شد.",
            'is_verified': False,
            'recorder': detective
        }
    )

    WitnessTestimony.objects.get_or_create(
        case=case1,
        defaults={
            'title': "شهادت نگهبان بانک",
            'description': "نگهبان که در اتاق مانیتورینگ بود.",
            'transcript': "سارقان سه نفر بودند و با دستکش وارد شدند.",
            'recorder': detective
        }
    )

    # 5. Add Suspects
    s1, _ = Suspect.objects.get_or_create(
        case=case1,
        national_code="1234567890",
        defaults={
            'first_name': "آرمان",
            'last_name': "کلاهبردار",
            'details': "سابقه دار در سرقت مسلحانه",
            'is_main_suspect': True,
            'is_on_board': True
        }
    )
    
    s2, _ = Suspect.objects.get_or_create(
        case=case3,
        national_code="0987654321",
        defaults={
            'first_name': "کامران",
            'last_name': "شرور",
            'details': "متهم ردیف اول نزاع خیابانی",
            'is_main_suspect': True
        }
    )

    # 6. Add Interrogation
    Interrogation.objects.get_or_create(
        suspect=s1,
        defaults={
            'interrogator': detective,
            'transcript': "من آن شب در خانه بودم و داشتم فوتبال می‌دیدم.",
            'score': 4
        }
    )
    
    # 7. Add Verdict for Case 3
    from investigation.models import Verdict
    Verdict.objects.get_or_create(
        case=case3,
        suspect=s2,
        defaults={
            'judge': user_objs['judge_user'],
            'description': "مجرم شناخته شد بر اساس شواهد موجود.",
            'result': 'GUILTY'
        }
    )

    # Ensure Boards exist
    Board.objects.get_or_create(case=case1)
    Board.objects.get_or_create(case=case2)
    Board.objects.get_or_create(case=case3)

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
