import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Role, UserProfile
from cases.models import Case, CaseComplainant, CrimeScene, SceneWitness
from evidence.models import Evidence, BiologicalEvidence, WitnessTestimony
from investigation.models import (
    Suspect, Interrogation, InterrogationFeedback, 
    Board, BoardConnection, Verdict, Warrant, RewardReport
)

User = get_user_model()

def clear_db():
    print("Clearing database...")
    Verdict.objects.all().delete()
    InterrogationFeedback.objects.all().delete()
    Interrogation.objects.all().delete()
    Warrant.objects.all().delete()
    RewardReport.objects.all().delete()
    BoardConnection.objects.all().delete()
    Board.objects.all().delete()
    Suspect.objects.all().delete()
    Evidence.objects.all().delete()
    CrimeScene.objects.all().delete()
    CaseComplainant.objects.all().delete()
    Case.objects.all().delete()
    UserProfile.objects.all().delete()
    User.objects.all().delete()
    Role.objects.all().delete()
    print("Database cleared.")

def seed_data():
    clear_db()
    print("Seeding database...")

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

    password = "password123"
    users_data = [
        ('admin', 'system_admin', '1111111111'),
        ('chief', 'police_chief', '2222222222'),
        ('captain', 'captain', '3333333333'),
        ('sergeant', 'sergeant', '4444444444'),
        ('detective', 'detective', '5555555555'),
        ('officer', 'police_officer', '1010101010'),
        ('trainee_user', 'trainee', '1212121212'),
        ('doctor', 'forensic_doctor', '6666666666'),
        ('judge_user', 'judge', '7777777777'),
        ('citizen', 'complainant', '8888888888'),
        ('citizen2', 'complainant', '9999999999'),
    ]
    
    u = {}
    for username, rcode, ncode in users_data:
        user = User.objects.create(
            username=username,
            email=f"{username}@example.com",
            is_staff=(rcode == 'system_admin'),
            is_superuser=(rcode == 'system_admin')
        )
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, national_code=ncode, phone=f"09{ncode[:9]}")
        user.roles.add(role_objs[rcode])
        u[username] = user
        print(f"Created user: {username} with role: {rcode}")

    # --- PT: Pending Trainee (Created by Citizen) ---
    c1 = Case.objects.create(
        title="سرقت از منزل مسکونی",
        description="طلا و جواهرات به ارزش ۵ میلیارد ریال از گاوصندوق سرقت شده است.",
        crime_level=Case.CrimeLevel.LEVEL_2,
        status=Case.Status.PENDING_TRAINEE,
        creator=u['citizen']
    )
    CaseComplainant.objects.create(case=c1, user=u['citizen'], is_confirmed=True)

    # --- PO: Pending Officer (Checked by Trainee) ---
    c2 = Case.objects.create(
        title="کلاهبرداری ملکی",
        description="فروش یک واحد آپارتمان به چندین نفر به صورت همزمان.",
        crime_level=Case.CrimeLevel.LEVEL_1,
        status=Case.Status.PENDING_OFFICER,
        creator=u['citizen2'],
        review_notes="تایید شاکیان توسط کارآموز انجام شد."
    )

    # --- AC: Active (Detective is investigating) ---
    c3 = Case.objects.create(
        title="قتل مشکوک در هتل",
        description="جسد فردی در اتاق ۳۰۲ هتل پارسیان پیدا شده است. آثار ضرب و شتم مشهود است.",
        crime_level=Case.CrimeLevel.CRITICAL,
        status=Case.Status.ACTIVE,
        creator=u['officer']
    )
    BiologicalEvidence.objects.create(
        case=c3, title="نمونه خون", description="نمونه خون یافت شده روی فرش", 
        recorder=u['doctor'], database_follow_up="تطابق با نمونه ثبت شده",
        is_verified=True
    )
    WitnessTestimony.objects.create(
        case=c3, title="شهادت پذیرش هتل", description="مشاهده خروج فردی با هودی مشکی", 
        recorder=u['detective'], transcript="او حدود ساعت ۲ شب با عجله خارج شد."
    )
    s3 = Suspect.objects.create(
        case=c3, first_name="رضا", last_name="نامعلوم", 
        details="فردی که در دوربین‌های مداربسته دیده شده است.", 
        is_main_suspect=True, status=Suspect.Status.IDENTIFIED
    )
    Board.objects.create(case=c3)

    # --- IP: In Pursuit (Warrant issued) ---
    c4 = Case.objects.create(
        title="اختلاس در بانک مرکزی",
        description="برداشت غیرقانونی مبالغ کلان از حساب‌های راکد.",
        crime_level=Case.CrimeLevel.LEVEL_1,
        status=Case.Status.IN_PURSUIT,
        creator=u['detective']
    )
    s4 = Suspect.objects.create(
        case=c4, first_name="سعید", last_name="خاوری", 
        details="مدیر سابق بخش حسابداری.", 
        is_main_suspect=True, status=Suspect.Status.UNDER_ARREST,
        created_at=timezone.now() - timedelta(days=35)
    )
    Warrant.objects.create(
        case=c4, suspect=s4, requester=u['detective'], approver=u['sergeant'],
        type='ARREST', status='APPROVED', description="دستور جلب فوری"
    )

    # --- PS: Pending Sergeant (Interrogation done) ---
    c5 = Case.objects.create(
        title="آتش‌سوزی عمدی در انبار",
        description="حریق در انبار تجهیزات پزشکی.",
        crime_level=Case.CrimeLevel.LEVEL_2,
        status=Case.Status.PENDING_SERGEANT,
        creator=u['detective']
    )
    s5 = Suspect.objects.create(
        case=c5, first_name="بهمن", last_name="آتش‌افروز", 
        status=Suspect.Status.ARRESTED, is_arrested=True
    )
    Interrogation.objects.create(
        suspect=s5, interrogator=u['detective'], transcript="من فقط می‌خواستم گرم شوم...",
        interrogator_score=8, is_interrogator_confirmed=True
    )

    # --- PC: Pending Chief (Captain & Sergeant confirmed guilty) ---
    c6 = Case.objects.create(
        title="قاچاق گسترده مواد مخدر",
        description="کشف محموله ۱ تنی هروئین در مرز.",
        crime_level=Case.CrimeLevel.CRITICAL,
        status=Case.Status.PENDING_CHIEF,
        creator=u['detective']
    )
    s6 = Suspect.objects.create(
        case=c6, first_name="اکبر", last_name="کارتل", 
        status=Suspect.Status.ARRESTED, is_arrested=True, is_main_suspect=True
    )
    inter6 = Interrogation.objects.create(
        suspect=s6, interrogator=u['detective'], supervisor=u['sergeant'],
        transcript="من فقط یک راننده هستم و از محموله خبر نداشتم.",
        interrogator_score=9, supervisor_score=9, 
        is_interrogator_confirmed=True, is_supervisor_confirmed=True
    )
    InterrogationFeedback.objects.create(
        interrogation=inter6, captain=u['captain'], decision='GUILTY', 
        is_confirmed=True, notes="مدارک علیه ایشان قطعی است."
    )

    # --- SO: Solved (Judge issued trial result with bail/fine) ---
    c7 = Case.objects.create(
        title="زورگیری در بزرگراه",
        description="سرقت گوشی تلفن همراه با تهدید چاقو.",
        crime_level=Case.CrimeLevel.LEVEL_3,
        status=Case.Status.SOLVED,
        creator=u['detective']
    )
    s7 = Suspect.objects.create(
        case=c7, first_name="محسن", last_name="تیزی", national_code="1234567890",
        status=Suspect.Status.ARRESTED, is_arrested=True
    )
    v7 = Verdict.objects.create(
        case=c7, suspect=s7, judge=u['judge_user'], title="حکم حبس تعزیری",
        result='GUILTY', punishment="۲ سال حبس و رد مال", description="اعتراف صریح متهم",
        bail_amount=50000000, fine_amount=10000000,
        bail_tracking_code="B123456789", fine_tracking_code="F987654321"
    )
    
    # --- Another case ready for judge to issue verdict ---
    c8 = Case.objects.create(
        title="کلاهبرداری اینترنتی",
        description="فروش کالای تقلبی در شبکه‌های اجتماعی.",
        crime_level=Case.CrimeLevel.LEVEL_2,
        status=Case.Status.PENDING_CHIEF,
        creator=u['detective']
    )
    s8 = Suspect.objects.create(
        case=c8, first_name="علی", last_name="فریبکار", national_code="9876543210",
        status=Suspect.Status.ARRESTED, is_arrested=True, is_main_suspect=True
    )
    inter8 = Interrogation.objects.create(
        suspect=s8, interrogator=u['detective'], supervisor=u['sergeant'],
        transcript="من فقط واسطه بودم و از جعلی بودن کالا خبر نداشتم.",
        interrogator_score=7, supervisor_score=8,
        is_interrogator_confirmed=True, is_supervisor_confirmed=True
    )
    InterrogationFeedback.objects.create(
        interrogation=inter8, captain=u['captain'], decision='GUILTY',
        is_confirmed=True, notes="مدارک کافی برای محکومیت وجود دارد."
    )

    # Make sure all cases have a board
    for case in Case.objects.all():
        Board.objects.get_or_create(case=case)

    print("\n-------------------------------------------")
    print("Database seeding completed successfully!")
    print(f"Total Users: {User.objects.count()}")
    print(f"Total Cases: {Case.objects.count()}")
    print(f"Total Suspects: {Suspect.objects.count()}")
    print("-------------------------------------------")

if __name__ == "__main__":
    seed_data()
