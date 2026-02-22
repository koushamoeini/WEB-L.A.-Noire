# 🔍 Complete Testing Guide - Police Case Management System (L.A. Noire)

**Course:** Web Programming (Fall 2025)  
**Project:** Django REST Framework + React/NextJS Police System  
**Version:** 1.0  
**Date:** February 2026

---

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Test Environment Setup](#test-environment-setup)
3. [Complete Feature Testing Scenarios](#complete-feature-testing-scenarios)
4. [Backend API Testing (Checkpoint 1)](#backend-api-testing-checkpoint-1)
5. [Frontend UI Testing (Checkpoint 2)](#frontend-ui-testing-checkpoint-2)
6. [Role-Based Access Control Tests](#role-based-access-control-tests)
7. [Scoring Checklist](#scoring-checklist)
8. [Common Issues & Debugging](#common-issues--debugging)

---

## 🎯 Quick Reference

### Document Section → Test Scenario Mapping

| Document Section | Feature | Test Scenarios | Priority |
|-----------------|---------|----------------|----------|
| 4.1 | User Registration & Login | TS-001 to TS-003 | CRITICAL |
| 4.2 | Case Creation | TS-004 to TS-008 | CRITICAL |
| 4.3 | Evidence Management | TS-009 to TS-013 | HIGH |
| 4.4 | Case Solving Process | TS-014 to TS-018 | HIGH |
| 4.5 | Suspect Identification & Interrogation | TS-019 to TS-024 | HIGH |
| 4.6 | Trial Process | TS-025 to TS-027 | MEDIUM |
| 4.7 | Most Wanted & Ranking | TS-028 to TS-030 | MEDIUM |
| 4.8 | Reward System | TS-031 to TS-033 | MEDIUM |
| 4.9 | Bail & Fine Payment | TS-034 to TS-036 | LOW |

### User Roles & Credentials (From seed_db.py)

| Username | Password | Role | National Code | Use For Testing |
|----------|----------|------|---------------|-----------------|
| admin | password123 | system_admin | 1111111111 | Admin panel, user management |
| chief | password123 | police_chief | 2222222222 | Final case approval, reporting |
| captain | password123 | captain | 3333333333 | Interrogation review, guilty verdict |
| sergeant | password123 | sergeant | 4444444444 | Interrogation supervision, warrants |
| detective | password123 | detective | 5555555555 | Investigation, suspects, board |
| officer | password123 | police_officer | 1010101010 | Case validation, crime scenes |
| trainee_user | password123 | trainee | 1212121212 | Complainant verification |
| doctor | password123 | forensic_doctor | 6666666666 | Evidence recording |
| judge_user | password123 | judge | 7777777777 | Trial verdicts, bail/fine |
| citizen | password123 | complainant | 8888888888 | Case creation, complaints |
| citizen2 | password123 | complainant | 9999999999 | Additional complainant testing |

---

## 🛠️ Test Environment Setup

### Prerequisites Check

```bash
# Backend (Django)
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
python manage.py check
python manage.py showmigrations

# Frontend (React)
cd frontend
npm list react react-dom

# Docker
docker --version
docker-compose --version
```

### Database Seeding

```bash
cd backend
python seed_db.py
```

**Expected Output:**
```
Database cleared.
Seeding database...
Created user: admin with role: system_admin
Created user: chief with role: police_chief
[... 11 users total ...]
-------------------------------------------
Database seeding completed successfully!
Total Users: 11
Total Cases: 8
Total Suspects: 7
-------------------------------------------
```

### Starting the Application

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Docker Mode (Production):**
```bash
docker-compose up --build
```

**Verify Services:**
- Backend API: http://localhost:8000/api/
- Swagger Docs: http://localhost:8000/api/swagger/
- Frontend: http://localhost:3000 (or 5173 for Vite)
- Admin Panel: http://localhost:8000/admin/

---

## 🧪 Complete Feature Testing Scenarios

### Section 4.1: User Registration & Login

#### TS-001: User Registration (Complainant/Citizen)

**Objective:** Test citizen registration with automatic role assignment

**API Endpoint:** `POST /api/auth/register/`

**Test Steps:**
1. Navigate to registration page
2. Fill form:
   - Username: `test_citizen_1`
   - Email: `test1@example.com`
   - Password: `SecurePass123!`
   - National Code: `0123456789`
   - Phone: `09123456789`
3. Submit form

**Expected Results:**
- ✅ Status Code: 201 Created
- ✅ Response includes: `user`, `token`, `roles`
- ✅ User automatically assigned `complainant` role
- ✅ Token stored in localStorage/cookies
- ✅ Redirect to dashboard

**API Request:**
```json
POST /api/auth/register/
{
  "username": "test_citizen_1",
  "email": "test1@example.com",
  "password": "SecurePass123!",
  "national_code": "0123456789",
  "phone": "09123456789"
}
```

**Expected Response:**
```json
{
  "user": {
    "id": 12,
    "username": "test_citizen_1",
    "email": "test1@example.com",
    "roles": [{"code": "complainant", "name": "شاکی"}]
  },
  "token": "a1b2c3d4e5f6...",
  "refresh": "f6e5d4c3b2a1..."
}
```

**Validation Points:**
- National code must be exactly 10 digits
- Phone must start with 09 and be 11 digits
- Password minimum 8 characters
- Username unique
- Email unique

**Edge Cases to Test:**
- Duplicate username → 400 Bad Request
- Invalid national code (9 digits, letters) → 400
- Missing required fields → 400
- Weak password → 400

---

#### TS-002: User Login (Token-Based)

**Objective:** Test JWT token authentication

**API Endpoint:** `POST /api/auth/login/`

**Test Steps:**
1. Navigate to login page
2. Enter credentials:
   - Username: `detective`
   - Password: `password123`
3. Submit

**Expected Results:**
- ✅ Status Code: 200 OK
- ✅ Response includes access_token and refresh_token
- ✅ Token stored in localStorage
- ✅ User redirected to role-specific dashboard
- ✅ Sidebar shows role-appropriate menu items

**API Request:**
```json
POST /api/auth/login/
{
  "username": "detective",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 5,
    "username": "detective",
    "roles": [{"code": "detective", "name": "کارآگاه"}]
  }
}
```

**Test All Roles:**
- System Admin → Full access dashboard
- Police Chief → Reporting & approval dashboard
- Captain → Interrogation review dashboard
- Sergeant → Interrogation supervision dashboard
- Detective → Investigation dashboard
- Police Officer → Case validation dashboard
- Trainee → Complainant verification dashboard
- Forensic Doctor → Evidence recording dashboard
- Judge → Trial & verdict dashboard
- Complainant → Limited case creation dashboard

**Edge Cases:**
- Wrong password → 401 Unauthorized
- Non-existent user → 401
- Expired token → 401 with refresh option
- No token provided → 401

---

#### TS-003: Role-Based Dashboard Access

**Objective:** Verify each role sees appropriate dashboard

**Test for Detective Role:**
1. Login as `detective`
2. Verify dashboard shows:
   - Active cases assigned to me
   - Cases "In Investigation" status
   - Quick actions: Add Evidence, Add Suspect, View Board
   - Statistics: My cases, Evidence collected, Suspects identified

**Test for Citizen Role:**
1. Login as `citizen`
2. Verify dashboard shows:
   - My filed complaints
   - Case status tracking
   - Quick action: File New Complaint
   - Limited visibility (no internal investigation details)

**Navigation Tests:**
- Detective can access `/investigation/board`
- Citizen CANNOT access `/investigation/board` → 403 Forbidden
- Judge can access `/trial/verdicts`
- Detective CANNOT issue verdicts → 403 Forbidden

---

### Section 4.2: Case Creation

#### TS-004: Case Creation via Complaint (Citizen Initiated)

**Objective:** Test complaint-based case creation workflow

**Flow:** Citizen → Trainee → Officer → Detective

**API Endpoint:** `POST /api/cases/`

**Test Steps (as Citizen):**
1. Login as `citizen`
2. Navigate to "File Complaint"
3. Fill form:
   - Title: `سرقت خودرو در پارکینگ عمومی`
   - Description: `خودروی پژو 206 به رنگ سفید با پلاک ایران ۱۲-۳۴۵ الف ۶۷ پس از پارک کردن در پارکینگ مرکز خرید مفقود شده است.`
   - Crime Type: `سرقت`
   - Crime Level: `LEVEL_2`
   - Location: `پارکینگ مرکز خرید پارادایس، تهران`
   - Incident Date: `2026-02-20`
   - Upload: Photos (optional)
4. Submit

**Expected Results:**
- ✅ Case created with status `PENDING_TRAINEE`
- ✅ Citizen automatically added as complainant (confirmed)
- ✅ Case visible in citizen's "My Cases"
- ✅ Case appears in trainee's review queue
- ✅ Case ID generated and returned

**API Request:**
```json
POST /api/cases/
Authorization: Bearer {citizen_token}
{
  "title": "سرقت خودرو در پارکینگ عمومی",
  "description": "خودروی پژو 206...",
  "crime_level": "LEVEL_2",
  "location": "پارکینگ مرکز خرید پارادایس",
  "incident_date": "2026-02-20"
}
```

**Expected Response:**
```json
{
  "id": 9,
  "title": "سرقت خودرو در پارکینگ عمومی",
  "status": "PENDING_TRAINEE",
  "crime_level": "LEVEL_2",
  "creator": {
    "username": "citizen",
    "role": "complainant"
  },
  "complainants": [
    {
      "user": "citizen",
      "is_confirmed": true
    }
  ],
  "created_at": "2026-02-22T10:30:00Z"
}
```

**Validation Points:**
- Title: max 200 chars, required
- Description: min 50 chars, required
- Crime level: one of [LEVEL_1, LEVEL_2, LEVEL_3, CRITICAL]
- Incident date: cannot be in future

---

#### TS-005: Complainant Verification (Trainee Review)

**Objective:** Test trainee validation of complainants

**3-Strike Rule:** If complaint rejected 3 times, automatically dismissed

**Test Steps (as Trainee):**
1. Login as `trainee_user`
2. Navigate to "Pending Cases" (PENDING_TRAINEE status)
3. Open case #9 (created in TS-004)
4. Review complaint details
5. Decision Options:
   - **Approve:** Move to PENDING_OFFICER
   - **Request More Info:** Add notes, keep PENDING_TRAINEE
   - **Reject:** Increment rejection count

**Approval Flow:**
1. Click "Approve Complaint"
2. Add notes: `شاکی معتبر تأیید شد. مدارک کامل است.`
3. Submit

**Expected Results:**
- ✅ Case status changes to `PENDING_OFFICER`
- ✅ Trainee added to `reviewed_by` field
- ✅ Case removed from trainee queue
- ✅ Case appears in officer queue
- ✅ Notification sent to citizen: "Complaint validated"

**API Request:**
```json
POST /api/cases/9/trainee_review/
Authorization: Bearer {trainee_token}
{
  "action": "approve",
  "notes": "شاکی معتبر تأیید شد"
}
```

**Rejection Flow (Test 3-Strike Rule):**

Create 3 test complaints as citizen2:

**Rejection 1:**
```json
POST /api/cases/10/trainee_review/
{
  "action": "reject",
  "notes": "مدارک ناقص - لطفاً گواهی پلیس 10+ ارسال کنید"
}
```
- Case status: `PENDING_TRAINEE`
- Rejection count: 1
- Citizen can re-submit with corrections

**Rejection 2:**
```json
POST /api/cases/10/trainee_review/
{
  "action": "reject",
  "notes": "هنوز مدارک کافی نیست"
}
```
- Rejection count: 2
- Warning sent to citizen

**Rejection 3:**
```json
POST /api/cases/10/trainee_review/
{
  "action": "reject",
  "notes": "شکایت غیرقابل پیگیری"
}
```
- ✅ Case status → `REJECTED`
- ✅ Case closed automatically
- ✅ Rejection count: 3
- ✅ Citizen cannot re-open
- ✅ Notification: "Complaint dismissed after 3 rejections"

---

#### TS-006: Officer Validation (PENDING_OFFICER → ACTIVE)

**Objective:** Test officer approval to activate case

**Test Steps (as Officer):**
1. Login as `officer`
2. Navigate to "Cases for Review"
3. Select case #9 (PENDING_OFFICER)
4. Review:
   - Complaint details
   - Trainee notes
   - Complainant verification status
5. Decision:
   - **Approve:** Assign detective, move to ACTIVE
   - **Send Back:** Return to trainee with notes
   - **Reject:** Close case

**Approval:**
```json
POST /api/cases/9/officer_review/
Authorization: Bearer {officer_token}
{
  "action": "approve",
  "assign_to": 5,  // detective user_id
  "priority": "MEDIUM",
  "notes": "پرونده تأیید و به کارآگاه محول شد"
}
```

**Expected Results:**
- ✅ Case status → `ACTIVE`
- ✅ Detective assigned to case
- ✅ Detective receives notification
- ✅ Case visible in detective's dashboard
- ✅ Investigation board auto-created

---

#### TS-007: Crime Scene Case Creation (No Complaint)

**Objective:** Test officer-initiated case from crime scene

**Scenario:** Officer discovers crime scene without prior complaint

**Test Steps (as Officer):**
1. Login as `officer`
2. Navigate to "Report Crime Scene"
3. Fill form:
   - Title: `صحنه قتل در خیابان ولیعصر`
   - Description: `جسد مرد میانسال با آثار خونریزی شدید در کوچه...`
   - Crime Level: `CRITICAL`
   - Location: GPS coordinates or address
   - Crime Scene Photos: Upload multiple images
   - Initial Evidence: Blood samples, fingerprints found
4. Submit

**Expected Results:**
- ✅ Case created with status `ACTIVE` (skips complaint validation)
- ✅ Crime scene entry created
- ✅ Officer listed as creator
- ✅ Auto-assigned to available detective
- ✅ Investigation board created
- ✅ Sergeant notified of critical case

**API Request:**
```json
POST /api/crime-scenes/
Authorization: Bearer {officer_token}
{
  "title": "صحنه قتل در خیابان ولیعصر",
  "description": "جسد مرد میانسال...",
  "crime_level": "CRITICAL",
  "location": "خیابان ولیعصر، نرسیده به میدان ونک",
  "gps_latitude": 35.7575,
  "gps_longitude": 51.4180,
  "initial_findings": "خون، اثر انگشت، گلوله"
}
```

**Expected Response:**
```json
{
  "id": 10,
  "case": {
    "id": 11,
    "title": "صحنه قتل در خیابان ولیعصر",
    "status": "ACTIVE",
    "crime_level": "CRITICAL"
  },
  "location": "خیابان ولیعصر...",
  "discovered_by": "officer",
  "discovered_at": "2026-02-22T12:00:00Z"
}
```

---

#### TS-008: Multi-Complainant Case

**Objective:** Test case with multiple complainants

**Scenario:** Real estate fraud with 3 victims

**Test Steps:**
1. Citizen1 creates case: `کلاهبرداری املاک`
2. Case status: PENDING_TRAINEE
3. **Add complainants:**
   ```json
   POST /api/cases/12/add_complainant/
   {
     "national_code": "9999999999",  // citizen2
     "relationship": "fellow_victim",
     "statement": "من هم قربانی همین کلاهبردار شدم"
   }
   ```
4. Trainee must verify ALL complainants
5. Each complainant confirms individually

**Expected Results:**
- ✅ Multiple complainants linked to case
- ✅ Each has `is_confirmed` field
- ✅ Trainee can review each separately
- ✅ Case only progresses when ALL confirmed
- ✅ Email/SMS sent to each complainant for confirmation

**API Check:**
```json
GET /api/cases/12/complainants/
[
  {
    "user": "citizen",
    "is_confirmed": true,
    "added_at": "2026-02-22"
  },
  {
    "user": "citizen2",
    "is_confirmed": false,
    "added_at": "2026-02-22"
  }
]
```

---

### Section 4.3: Evidence Management (5 Types)

#### TS-009: Biological Evidence

**Objective:** Test recording of DNA/blood/tissue samples

**Test Steps (as Forensic Doctor):**
1. Login as `doctor`
2. Navigate to case #11 (crime scene case)
3. Click "Add Evidence" → "Biological Evidence"
4. Fill form:
   - Type: `BLOOD_SAMPLE`
   - Title: `نمونه خون از صحنه جرم`
   - Description: `خون روی فرش کنار جسد`
   - Sample Location: `فرش - ۲ متری جنوب جسد`
   - Collection Date: `2026-02-22`
   - Lab Analysis: Upload PDF report
   - DNA Database Search: `تطابق با سوابق جنایی - کد: DNA-12345`
   - Image: Upload photo
5. Submit

**Expected Results:**
- ✅ Evidence created and linked to case
- ✅ Type: `biological_evidence`
- ✅ Recorder: `doctor` (forensic_doctor role)
- ✅ Status: `PENDING_VERIFICATION`
- ✅ Sergeant notified for verification
- ✅ Evidence appears in case timeline

**API Request:**
```json
POST /api/evidence/biological/
Authorization: Bearer {doctor_token}
{
  "case": 11,
  "title": "نمونه خون از صحنه جرم",
  "description": "خون روی فرش کنار جسد",
  "evidence_type": "BLOOD_SAMPLE",
  "sample_location": "فرش - ۲ متری جنوب جسد",
  "collection_date": "2026-02-22",
  "database_follow_up": "تطابق با سوابق - DNA-12345",
  "chain_of_custody": "Dr. Smith → Evidence Locker #5 → Lab"
}
```

**Evidence Verification (as Sergeant):**
```json
POST /api/evidence/biological/1/verify/
Authorization: Bearer {sergeant_token}
{
  "is_verified": true,
  "verification_notes": "نمونه معتبر و قابل استناد"
}
```

**Expected:**
- ✅ `is_verified` → true
- ✅ Evidence usable in trial
- ✅ Detective can add to board

---

#### TS-010: Witness Testimony Evidence

**Objective:** Test recording witness statements

**Test Steps (as Detective):**
1. Login as `detective`
2. Open case #11
3. Add Evidence → "Witness Testimony"
4. Fill form:
   - Witness Name: `احمد کریمی`
   - Witness National Code: `1122334455`
   - Witness Contact: `09121234567`
   - Testimony Title: `شهادت همسایه`
   - Testimony: `من ساعت ۲۲:۳۰ شب صدای جیغ و درگیری شنیدم...` (min 100 chars)
   - Credibility Score: `8/10`
   - Audio Recording: Upload MP3 (optional)
   - Written Statement: Upload signed PDF
5. Submit

**API Request:**
```json
POST /api/evidence/witness-testimony/
Authorization: Bearer {detective_token}
{
  "case": 11,
  "title": "شهادت همسایه",
  "description": "شهادت همسایه طبقه چهارم",
  "witness_name": "احمد کریمی",
  "witness_national_code": "1122334455",
  "witness_contact": "09121234567",
  "transcript": "من ساعت ۲۲:۳۰ شب صدای جیغ...",
  "credibility_score": 8,
  "is_anonymous": false
}
```

**Anonymous Witness:**
```json
{
  "witness_name": "شاهد ناشناس",
  "is_anonymous": true,
  "witness_protection": true,
  "transcript": "..."
}
```

---

#### TS-011: Vehicle Evidence

**Objective:** Test vehicle documentation

**Test Steps (as Detective/Officer):**
1. Add Evidence → "Vehicle Evidence"
2. Fill:
   - Vehicle Type: `سواری`
   - Make: `پژو`
   - Model: `206`
   - Color: `سفید`
   - License Plate: `ایران ۱۲-۳۴۵ الف ۶۷`
   - VIN: `ABC123456789XYZ`
   - Owner National Code: `1234567890`
   - Vehicle Condition: `دزدی - شیشه شکسته`
   - Photos: Upload multiple
3. Submit

**API:**
```json
POST /api/evidence/vehicle/
{
  "case": 9,  // the car theft case
  "title": "خودروی مسروقه",
  "vehicle_type": "SEDAN",
  "make": "پژو",
  "model": "206",
  "color": "سفید",
  "license_plate": "ایران ۱۲-۳۴۵ الف ۶۷",
  "vin": "ABC123456789XYZ",
  "owner_national_code": "1234567890",
  "condition": "شیشه شکسته، قفل درب سمت راننده تخریب شده"
}
```

---

#### TS-012: Identification Documents Evidence

**Objective:** Test ID cards, passports, licenses

**Test Steps:**
1. Add Evidence → "Identification Document"
2. Fill:
   - Document Type: `کارت ملی`
   - Document Number: `1234567890`
   - Owner Name: `علی رضایی`
   - Issue Date: `1390/05/15`
   - Found Location: `کنار جسد`
   - Image: Front & back scans
3. Submit

**API:**
```json
POST /api/evidence/identification-document/
{
  "case": 11,
  "title": "کارت ملی یافت شده",
  "document_type": "NATIONAL_ID",
  "document_number": "1234567890",
  "owner_name": "علی رضایی",
  "issue_date": "2011-08-06",
  "found_location": "کنار جسد - ۵۰ سانتی‌متری",
  "is_original": true
}
```

---

#### TS-013: Other Evidence

**Objective:** Test miscellaneous physical evidence

**Test Steps:**
1. Add Evidence → "Other Evidence"
2. Examples:
   - Weapon: `چاقو ۲۰ سانتی‌متری با دسته چوبی`
   - Digital: `تلفن همراه قربانی - سامسونگ A51`
   - Documents: `قرارداد جعلی املاک`
   - Objects: `کیف پول با ۲ میلیون تومان نقدی`
3. Fill:
   - Title: `سلاح جرم`
   - Type: `WEAPON`
   - Description: Full details
   - Collection Location: Precise
   - Photos: Multiple angles
4. Submit

**API:**
```json
POST /api/evidence/other/
{
  "case": 11,
  "title": "چاقو آلوده به خون",
  "evidence_category": "WEAPON",
  "description": "چاقو ۲۰ سانتی با دسته چوبی، آثار خون قربانی",
  "collection_location": "زیر مبل - ۳ متری شرق جسد",
  "forensic_notes": "اثر انگشت مظنون روی دسته یافت شد"
}
```

---

### Section 4.4: Case Solving Process

#### TS-014: Case Assignment to Detective

**Objective:** Test detective receives and starts investigation

**Automatic Assignment:**
- When officer approves case (PENDING_OFFICER → ACTIVE)
- System assigns to least-busy detective
- OR officer manually selects detective

**Manual Assignment (as Officer/Sergeant):**
```json
POST /api/cases/11/assign/
Authorization: Bearer {officer_token}
{
  "assigned_to": 5,  // detective user_id
  "priority": "HIGH",
  "deadline": "2026-03-01",
  "notes": "پرونده خیلی حساس - اولویت دارد"
}
```

**Detective Dashboard Check:**
1. Login as `detective`
2. Dashboard shows:
   - Assigned cases: 3 ACTIVE
   - Evidence to collect: 5 pending
   - Suspects to investigate: 2
   - Boards to update: 1

---

#### TS-015: Investigation Board (Detective Board)

**Objective:** Test drag-drop connection board

**Frontend Feature:** Interactive board with nodes and edges

**Test Steps (as Detective):**
1. Login as detective
2. Navigate to case #11
3. Click "Investigation Board"
4. **Add Nodes:**
   - Add Suspect: `رضا نامعلوم`
   - Add Evidence: Drag from evidence list
   - Add Location: `هتل پارسیان اتاق ۳۰۲`
   - Add Person of Interest: `پذیرش هتل`
5. **Create Connections:**
   - Drag from Suspect to Evidence (blood)
   - Label: `DNA match - 99.8%`
   - Drag from Suspect to Location
   - Label: `مشاهده در دوربین ساعت ۲۲:۱۵`
6. Save board

**API Endpoints:**

**Get Board:**
```json
GET /api/investigation/boards/?case=11
[
  {
    "id": 1,
    "case": 11,
    "created_by": "detective",
    "updated_at": "2026-02-22T14:30:00Z"
  }
]
```

**Add Node:**
```json
POST /api/investigation/board/1/add_node/
{
  "node_type": "SUSPECT",
  "evidence_id": null,
  "suspect_id": 3,
  "title": "رضا نامعلوم",
  "position_x": 100,
  "position_y": 200
}
```

**Create Connection:**
```json
POST /api/investigation/board-connections/
{
  "board": 1,
  "from_evidence": 1,  // blood sample
  "to_suspect": 3,
  "connection_type": "DNA_MATCH",
  "description": "تطابق DNA - ۹۹.۸٪",
  "strength": 9  // 0-10 scale
}
```

**Expected Frontend:**
- ✅ Drag-drop nodes
- ✅ Visual connections with labels
- ✅ Color-coded by type (suspect=red, evidence=blue, location=green)
- ✅ Zoom/pan controls
- ✅ Auto-save
- ✅ Export as image

---

#### TS-016: Evidence Linking to Board

**Objective:** Test adding evidence to investigation board

**Special Feature:** Evidence with `is_on_board=True` appears on board

**Test:**
1. Detective views evidence list for case
2. Selects blood sample evidence
3. Clicks "Add to Board"
4. Evidence node automatically created on board

**API:**
```json
PATCH /api/evidence/biological/1/
{
  "is_on_board": true
}
```

**Board Update:**
```json
POST /api/investigation/board/1/add_node/
{
  "node_type": "EVIDENCE",
  "evidence_id": 1,
  "title": "نمونه خون",
  "position_x": 300,
  "position_y": 150
}
```

---

#### TS-017: Case Status Progression

**Objective:** Test full case lifecycle

**Status Flow:**
```
PENDING_TRAINEE → PENDING_OFFICER → ACTIVE → IN_PURSUIT → 
PENDING_SERGEANT → PENDING_CHIEF → SOLVED/CLOSED
```

**Transitions:**

1. **ACTIVE → IN_PURSUIT:**
   - Detective identifies main suspect
   - Warrant requested and approved
   - Arrest warrant issued

```json
POST /api/cases/11/advance_status/
Authorization: Bearer {detective_token}
{
  "new_status": "IN_PURSUIT",
  "reason": "مظنون اصلی شناسایی و حکم دستگیری صادر شد"
}
```

2. **IN_PURSUIT → PENDING_SERGEANT:**
   - Suspect arrested
   - Interrogation completed by detective

```json
PATCH /api/suspects/3/
{
  "status": "ARRESTED",
  "is_arrested": true,
  "arrest_date": "2026-02-23"
}

POST /api/investigation/interrogations/
{
  "suspect": 3,
  "interrogator": 5,  // detective
  "transcript": "متهم به قتل اعتراف کرد...",
  "interrogator_score": 9,
  "is_interrogator_confirmed": true
}

POST /api/cases/11/advance_status/
{
  "new_status": "PENDING_SERGEANT"
}
```

3. **PENDING_SERGEANT → PENDING_CHIEF:**
   - Sergeant reviews interrogation
   - Sergeant assigns score and confirms

```json
PATCH /api/investigation/interrogations/1/
Authorization: Bearer {sergeant_token}
{
  "supervisor": 4,  // sergeant user_id
  "supervisor_score": 8,
  "is_supervisor_confirmed": true
}

POST /api/cases/11/advance_status/
{
  "new_status": "PENDING_CHIEF"
}
```

4. **PENDING_CHIEF → Awaiting Trial:**
   - Captain reviews and marks guilty
   - Police Chief final approval
   - Case forwarded to judge

```json
POST /api/investigation/interrogation-feedback/
Authorization: Bearer {captain_token}
{
  "interrogation": 1,
  "captain": 3,
  "decision": "GUILTY",
  "is_confirmed": true,
  "notes": "مدارک کافی برای محکومیت"
}

POST /api/cases/11/chief_approval/
Authorization: Bearer {chief_token}
{
  "approved": true,
  "forward_to_judge": true,
  "judge": 9  // judge user_id
}
```

5. **Trial → SOLVED:**
   - Judge issues verdict
   - Case marked solved

```json
POST /api/investigation/verdicts/
Authorization: Bearer {judge_token}
{
  "case": 11,
  "suspect": 3,
  "judge": 9,
  "title": "حکم قتل عمد",
  "result": "GUILTY",
  "punishment": "۱۵ سال حبس",
  "description": "با توجه به اعترافات و مدارک...",
  "bail_amount": 0,  // no bail for murder
  "fine_amount": 500000000
}

PATCH /api/cases/11/
{
  "status": "SOLVED"
}
```

---

#### TS-018: Case Timeline & Activity Log

**Objective:** Test chronological audit trail

**API:**
```json
GET /api/cases/11/timeline/
```

**Expected Response:**
```json
[
  {
    "timestamp": "2026-02-22T12:00:00Z",
    "actor": "officer",
    "action": "CASE_CREATED",
    "description": "صحنه جرم گزارش شد"
  },
  {
    "timestamp": "2026-02-22T12:15:00Z",
    "actor": "detective",
    "action": "CASE_ASSIGNED",
    "description": "پرونده به کارآگاه محول شد"
  },
  {
    "timestamp": "2026-02-22T13:00:00Z",
    "actor": "doctor",
    "action": "EVIDENCE_ADDED",
    "description": "نمونه خون ثبت شد",
    "evidence_id": 1
  },
  {
    "timestamp": "2026-02-22T14:00:00Z",
    "actor": "detective",
    "action": "SUSPECT_IDENTIFIED",
    "description": "مظنون شناسایی شد",
    "suspect_id": 3
  },
  {
    "timestamp": "2026-02-23T10:00:00Z",
    "actor": "detective",
    "action": "WARRANT_REQUESTED",
    "description": "درخواست حکم دستگیری"
  },
  {
    "timestamp": "2026-02-23T11:00:00Z",
    "actor": "sergeant",
    "action": "WARRANT_APPROVED",
    "description": "حکم دستگیری تأیید شد"
  }
]
```

**Frontend Display:**
- Timeline visualization (vertical line with events)
- Icons for each action type
- Clickable to view details
- Filterable by action type

---

### Section 4.5: Suspect Identification & Interrogation

#### TS-019: Identify Suspect

**Objective:** Test adding suspect to case

**Test Steps (as Detective):**
1. Navigate to case #11
2. Click "Add Suspect"
3. Fill form:
   - First Name: `رضا`
   - Last Name: `احمدی`
   - National Code: `0987654321` (optional initially)
   - Description: `مرد ۳۰ ساله، قد ۱۷۵، موی مشکی...`
   - Photo: Upload mugshot/sketch
   - Is Main Suspect: ✅ Yes
   - Status: `IDENTIFIED`
4. Submit

**API:**
```json
POST /api/investigation/suspects/
Authorization: Bearer {detective_token}
{
  "case": 11,
  "first_name": "رضا",
  "last_name": "احمدی",
  "national_code": "0987654321",
  "details": "مرد ۳۰ ساله، قد ۱۷۵...",
  "is_main_suspect": true,
  "status": "IDENTIFIED"
}
```

**Expected:**
- ✅ Suspect created with ID
- ✅ Linked to case
- ✅ Status: IDENTIFIED
- ✅ Appears on investigation board
- ✅ Detective can now request warrant

---

#### TS-020: Request Arrest Warrant

**Objective:** Test warrant request/approval flow

**Flow:** Detective → Sergeant → Execution

**Test Steps (as Detective):**
1. Open suspect profile
2. Click "Request Warrant"
3. Select type:
   - Arrest Warrant (`دستور جلب`)
   - Search Warrant (`دستور بازرسی`)
4. Fill justification:
   - Reason: `مدارک DNA تطابق دارد و مظنون در خطر فرار است`
   - Evidence Links: Select evidence #1, #2
   - Urgency: HIGH
5. Submit

**API:**
```json
POST /api/investigation/warrants/
Authorization: Bearer {detective_token}
{
  "case": 11,
  "suspect": 3,
  "requester": 5,  // detective
  "type": "ARREST",
  "description": "مدارک DNA تطابق دارد...",
  "status": "PENDING",
  "urgency": "HIGH"
}
```

**Expected:**
- ✅ Warrant created with PENDING status
- ✅ Sergeant notified
- ✅ Appears in sergeant's approval queue

**Approval (as Sergeant):**
```json
PATCH /api/investigation/warrants/1/
Authorization: Bearer {sergeant_token}
{
  "approver": 4,  // sergeant
  "status": "APPROVED",
  "approval_notes": "حکم دستگیری تأیید شد"
}
```

**Expected:**
- ✅ Warrant status → APPROVED
- ✅ Detective notified
- ✅ Arrest can proceed
- ✅ Warrant document generated (PDF)

**Rejection:**
```json
{
  "status": "REJECTED",
  "approval_notes": "مدارک کافی نیست - شاهد بیشتری لازم است"
}
```

---

#### TS-021: Arrest Suspect

**Objective:** Test updating suspect to arrested status

**Test Steps (as Detective/Officer):**
1. With approved warrant, locate suspect
2. Update suspect status:

**API:**
```json
PATCH /api/investigation/suspects/3/
Authorization: Bearer {detective_token}
{
  "status": "ARRESTED",
  "is_arrested": true,
  "arrest_date": "2026-02-23",
  "arrest_location": "منزل مظنون - تهران، خیابان آزادی"
}
```

**Expected:**
- ✅ Suspect status → ARRESTED
- ✅ Interrogation now enabled
- ✅ Case status advances to IN_PURSUIT or PENDING_SERGEANT
- ✅ Notification to sergeant

---

#### TS-022: Conduct Interrogation (Detective)

**Objective:** Test interrogation recording

**Test Steps (as Detective):**
1. Open arrested suspect profile
2. Click "New Interrogation"
3. Fill form:
   - Date & Time: `2026-02-24 10:00`
   - Location: `اتاق بازجویی ۱ - کلانتری مرکزی`
   - Duration: `120 minutes`
   - Transcript: Full interrogation text (min 500 chars)
     ```
     کارآگاه: شما شب ۲۲ فوریه کجا بودید؟
     مظنون: من خانه بودم.
     کارآگاه: شاهدان شما را در هتل دیده‌اند.
     مظنون: باشه، من آنجا بودم ولی کاری نکرده‌ام.
     ...
     ```
   - Detective Score: `9/10` (how guilty they seem)
   - Audio Recording: Upload MP3 (optional)
4. Confirm Interrogation: ✅
5. Submit

**API:**
```json
POST /api/investigation/interrogations/
Authorization: Bearer {detective_token}
{
  "suspect": 3,
  "interrogator": 5,
  "interrogation_date": "2026-02-24T10:00:00Z",
  "location": "اتاق بازجویی ۱",
  "duration_minutes": 120,
  "transcript": "کارآگاه: شما شب...",
  "interrogator_score": 9,
  "is_interrogator_confirmed": true
}
```

**Expected:**
- ✅ Interrogation created
- ✅ Linked to suspect and case
- ✅ Awaits supervisor (sergeant) review
- ✅ Sergeant notified

---

#### TS-023: Supervise Interrogation (Sergeant)

**Objective:** Test sergeant supervisory review

**Test Steps (as Sergeant):**
1. Login as `sergeant`
2. Navigate to "Interrogations to Review"
3. Open interrogation #1
4. Review:
   - Transcript
   - Detective's score
   - Evidence consistency
5. Add supervisor score: `8/10`
6. Confirm: ✅
7. Submit

**API:**
```json
PATCH /api/investigation/interrogations/1/
Authorization: Bearer {sergeant_token}
{
  "supervisor": 4,
  "supervisor_score": 8,
  "is_supervisor_confirmed": true,
  "supervisor_notes": "بازجویی صحیح انجام شده"
}
```

**Expected:**
- ✅ Interrogation now has 2 scores
- ✅ Case advances to PENDING_CHIEF
- ✅ Captain notified for guilt determination

---

#### TS-024: Captain Guilt Determination

**Objective:** Test captain verdict on interrogation

**Test Steps (as Captain):**
1. Login as `captain`
2. Navigate to "Cases for Review"
3. Open case #11
4. Review:
   - All evidence
   - Interrogation transcript
   - Both scores (detective + sergeant)
5. Decision:
   - **GUILTY:** Forward to chief → judge
   - **NOT_GUILTY:** Release suspect, close case
   - **NEEDS_MORE_INVESTIGATION:** Send back to detective
6. Select `GUILTY`
7. Add notes: `مدارک کافی برای محکومیت`
8. Confirm: ✅
9. Submit

**API:**
```json
POST /api/investigation/interrogation-feedback/
Authorization: Bearer {captain_token}
{
  "interrogation": 1,
  "captain": 3,
  "decision": "GUILTY",
  "is_confirmed": true,
  "notes": "مدارک کافی برای محکومیت"
}
```

**Expected:**
- ✅ Feedback created
- ✅ Case status → PENDING_CHIEF
- ✅ Police chief notified
- ✅ Interrogation locked (no further edits)

**NOT_GUILTY Flow:**
```json
{
  "decision": "NOT_GUILTY",
  "notes": "شواهد کافی نیست، مظنون اشتباهی است"
}
```
- ✅ Suspect released
- ✅ Investigation continues
- ✅ Detective finds new suspect

---

### Section 4.6: Trial Process

#### TS-025: Police Chief Final Approval

**Objective:** Test chief reviews and forwards to judge

**Test Steps (as Police Chief):**
1. Login as `chief`
2. Navigate to "Cases Pending My Approval"
3. Open case #11
4. Review complete file:
   - Case timeline
   - All evidence
   - Interrogation
   - Captain's determination: GUILTY
5. Decision:
   - **Approve:** Forward to judge
   - **Reject:** Send back with notes
6. Select judge from list
7. Approve and Forward
8. Submit

**API:**
```json
POST /api/cases/11/chief_approval/
Authorization: Bearer {chief_token}
{
  "approved": true,
  "forward_to_judge": true,
  "assigned_judge": 9,
  "notes": "پرونده کامل و آماده محاکمه است"
}
```

**Expected:**
- ✅ Case status → AWAITING_TRIAL (or PENDING_CHIEF)
- ✅ Judge assigned
- ✅ Judge notified
- ✅ Case appears in judge's docket

---

#### TS-026: Judge Issues Verdict

**Objective:** Test trial verdict with punishment/bail/fine

**Test Steps (as Judge):**
1. Login as `judge_user`
2. Navigate to "My Cases"
3. Open case #11
4. Review complete case file (read-only access to all evidence)
5. Click "Issue Verdict"
6. Fill verdict form:
   - Verdict Title: `حکم قتل عمد`
   - Result: Select
     - `GUILTY` (مجرم)
     - `NOT_GUILTY` (بی‌گناه)
     - `INSUFFICIENT_EVIDENCE` (عدم کفایت دلیل)
   - Punishment (if guilty): `۱۵ سال حبس تعزیری`
   - Description/Reasoning: (min 200 chars)
     ```
     با توجه به مدارک DNA، شهادت شهود، و اعترافات مظنون،
     محکومیت متهم به قتل عمد قطعی است. حکم ۱۵ سال حبس
     صادر می‌شود بدون امکان وثیقه.
     ```
   - Bail Amount: `0` (no bail for murder)
   - Fine Amount: `500,000,000` (500M Rials)
7. Submit

**API:**
```json
POST /api/investigation/verdicts/
Authorization: Bearer {judge_token}
{
  "case": 11,
  "suspect": 3,
  "judge": 9,
  "title": "حکم قتل عمد",
  "result": "GUILTY",
  "punishment": "۱۵ سال حبس تعزیری",
  "description": "با توجه به مدارک DNA...",
  "bail_amount": 0,
  "fine_amount": 500000000,
  "trial_date": "2026-02-25"
}
```

**Expected:**
- ✅ Verdict created
- ✅ Linked to case and suspect
- ✅ Case status → SOLVED
- ✅ Suspect status → CONVICTED
- ✅ All parties notified
- ✅ Verdict document generated (PDF)

**NOT_GUILTY Verdict:**
```json
{
  "result": "NOT_GUILTY",
  "punishment": "",
  "description": "شواهد کافی برای محکومیت نیست",
  "bail_amount": 0,
  "fine_amount": 0
}
```
- ✅ Suspect released
- ✅ Case status → CLOSED_NOT_GUILTY
- ✅ Detective/Officer notified

---

#### TS-027: Verdict with Bail/Fine

**Objective:** Test lighter crime with payment options

**Scenario:** Theft case (not murder) → Bail + Fine

**Judge Issues Verdict:**
```json
POST /api/investigation/verdicts/
Authorization: Bearer {judge_token}
{
  "case": 7,  // the car theft case
  "suspect": 7,
  "judge": 9,
  "title": "حکم سرقت خودرو",
  "result": "GUILTY",
  "punishment": "۲ سال حبس تعلیقی + وثیقه ۵۰ میلیون",
  "description": "متهم به سرقت خودرو محکوم می‌شود",
  "bail_amount": 50000000,  // 50M Rials
  "fine_amount": 10000000   // 10M Rials
}
```

**Expected:**
- ✅ Bail tracking code generated: `B123456789`
- ✅ Fine tracking code generated: `F987654321`
- ✅ Suspect can pay to be released
- ✅ Payment integration enabled

---

### Section 4.7: Most Wanted & Suspect Ranking

#### TS-028: Most Wanted Calculation

**Objective:** Test ranking formula

**Formula:** 
```
Score = max(crime_level) × max(days_at_large)
```

Where:
- `crime_level`: LEVEL_1=1, LEVEL_2=2, LEVEL_3=3, CRITICAL=4
- `days_at_large`: Days since suspect identified and not arrested

**Test Data Setup:**

Create 5 suspects at different stages:

1. **Suspect A:**
   - Case crime level: CRITICAL (4)
   - Status: UNDER_ARREST (wanted)
   - Days at large: 35
   - Score: 4 × 35 = **140**

2. **Suspect B:**
   - Case crime level: LEVEL_2 (2)
   - Status: UNDER_ARREST
   - Days at large: 60
   - Score: 2 × 60 = **120**

3. **Suspect C:**
   - Case crime level: CRITICAL (4)
   - Status: UNDER_ARREST
   - Days at large: 15
   - Score: 4 × 15 = **60**

4. **Suspect D:**
   - Case crime level: LEVEL_1 (1)
   - Status: UNDER_ARREST
   - Days at large: 90
   - Score: 1 × 90 = **90**

5. **Suspect E:**
   - Case crime level: LEVEL_3 (3)
   - Status: ARRESTED
   - Days at large: N/A (already arrested)
   - Score: **0** (not on most wanted)

**API Test:**
```json
GET /api/investigation/most-wanted/
```

**Expected Response (ordered by score DESC):**
```json
[
  {
    "id": 4,
    "first_name": "سعید",
    "last_name": "خاوری",
    "case_id": 4,
    "case_title": "اختلاس در بانک مرکزی",
    "crime_level": "CRITICAL",
    "status": "UNDER_ARREST",
    "days_at_large": 35,
    "wanted_score": 140,
    "rank": 1
  },
  {
    "id": "...",
    "wanted_score": 120,
    "rank": 2
  },
  {
    "id": "...",
    "wanted_score": 90,
    "rank": 3
  },
  {
    "id": "...",
    "wanted_score": 60,
    "rank": 4
  }
]
```

**Frontend Display:**
- Most Wanted page with poster-style cards
- Each shows: Photo, Name, Crime, Score, Days at Large
- Sorted by score (highest first)
- Public view (no auth required) - redacted details
- Police view (authenticated) - full details

---

#### TS-029: Most Wanted Public Page

**Objective:** Test public-facing most wanted page

**URL:** `/most-wanted` (no authentication)

**Test Steps:**
1. Open browser in incognito mode
2. Navigate to `http://localhost:3000/most-wanted`
3. Verify displays:
   - Top 10 most wanted suspects
   - Photos (if available)
   - Basic info: Name, Crime Type, Reward Amount
   - "Report Sighting" button
4. No sensitive information shown (addresses, full case details)

**API (Public Endpoint):**
```json
GET /api/public/most-wanted/
```

**Expected Response:**
```json
[
  {
    "rank": 1,
    "alias": "سعید خ.",  // partially redacted
    "crime_type": "اختلاس",
    "reward_amount": 2800000000,  // 2.8B Rials
    "description": "مرد ۴۵ ساله، قد ۱۷۵",
    "last_seen": "تهران"
    // NO: address, national_code, case_id, evidence
  }
]
```

---

#### TS-030: Suspect Status Transitions

**Objective:** Test all suspect statuses

**Statuses:**
1. `IDENTIFIED` - Initial identification
2. `UNDER_ARREST` - Warrant issued, being pursued
3. `ARRESTED` - In custody
4. `CONVICTED` - Guilty verdict
5. `RELEASED` - Not guilty or bail paid
6. `AT_LARGE` - Escaped

**Test Transitions:**
```
IDENTIFIED → UNDER_ARREST → ARRESTED → CONVICTED
                                ↓
                            RELEASED
```

**API:**
```json
# Detective identifies
POST /api/investigation/suspects/
{ "status": "IDENTIFIED" }

# Warrant approved
PATCH /api/investigation/suspects/8/
{ "status": "UNDER_ARREST" }

# Arrest made
PATCH /api/investigation/suspects/8/
{ "status": "ARRESTED", "is_arrested": true }

# Verdict issued
PATCH /api/investigation/suspects/8/
{ "status": "CONVICTED" }

# OR released
PATCH /api/investigation/suspects/8/
{ "status": "RELEASED", "is_arrested": false }
```

---

### Section 4.8: Reward System

#### TS-031: Calculate Reward Amount

**Objective:** Test reward calculation formula

**Formula:**
```
Reward = max(crime_level) × max(days_at_large) × 20,000,000 Rials
```

**Example (from TS-028):**
- Suspect A: 4 × 35 × 20,000,000 = **2,800,000,000 Rials** (2.8 Billion)
- Suspect B: 2 × 60 × 20,000,000 = **2,400,000,000 Rials** (2.4 Billion)
- Suspect D: 1 × 90 × 20,000,000 = **1,800,000,000 Rials** (1.8 Billion)

**API Test:**
```json
GET /api/investigation/suspects/4/
```

**Expected Response:**
```json
{
  "id": 4,
  "first_name": "سعید",
  "last_name": "خاوری",
  "status": "UNDER_ARREST",
  "case": {
    "id": 4,
    "crime_level": "CRITICAL"
  },
  "created_at": "2026-01-18",  // 35 days ago
  "days_at_large": 35,
  "reward_amount": 2800000000,
  "is_main_suspect": true
}
```

---

#### TS-032: Citizen Reports Suspect Sighting

**Objective:** Test reward report submission

**Test Steps (as Citizen):**
1. Navigate to Most Wanted page
2. Click suspect card (Suspect A - سعید خاوری)
3. Click "Report Sighting"
4. Fill form:
   - Reporter Name: `محمد امینی`
   - Reporter National Code: `5544332211`
   - Reporter Phone: `09181234567`
   - Sighting Location: `مرکز خرید مگامال، طبقه سوم`
   - Sighting Date/Time: `2026-02-22 15:30`
   - Description: `دیدم داشت از پله برقی بالا می‌رفت` (min 50 chars)
   - Photo (optional): Upload
   - Anonymous: ☐ No
5. Submit

**API:**
```json
POST /api/investigation/reward-reports/
{
  "suspect_national_code": "0987654321",  // suspect A
  "reporter_name": "محمد امینی",
  "reporter_national_code": "5544332211",
  "reporter_phone": "09181234567",
  "sighting_location": "مرکز خرید مگامال، طبقه سوم",
  "sighting_datetime": "2026-02-22T15:30:00Z",
  "description": "دیدم داشت از پله برقی بالا می‌رفت",
  "is_anonymous": false
}
```

**Expected Response:**
```json
{
  "id": 1,
  "tracking_code": "R-2026-0001",
  "status": "PENDING_REVIEW",
  "submitted_at": "2026-02-22T16:00:00Z",
  "message": "گزارش شما ثبت شد. کد پیگیری: R-2026-0001"
}
```

**Expected:**
- ✅ Report created
- ✅ Status: PENDING_REVIEW
- ✅ Officer notified
- ✅ Tracking code sent to citizen

---

#### TS-033: Officer Reviews and Approves Reward

**Objective:** Test reward approval workflow

**Flow:** Citizen submits → Officer reviews → Captain approves → Payment

**Officer Review (TS-033a):**

**Test Steps (as Officer):**
1. Login as `officer`
2. Navigate to "Reward Reports"
3. Open report R-2026-0001
4. Review:
   - Sighting details
   - Location credibility
   - Timing
5. Decision:
   - **Approve:** Mark as helpful
   - **Reject:** Mark as false/unhelpful
6. Select Approve
7. Add notes: `گزارش درست بود - نیروها اعزام شدند`
8. Submit

**API:**
```json
POST /api/investigation/reward-reports/1/officer_review/
Authorization: Bearer {officer_token}
{
  "approved": true,
  "notes": "گزارش درست بود - نیروها اعزام شدند"
}
```

**Expected:**
- ✅ Report status → OFFICER_APPROVED
- ✅ Captain notified
- ✅ Awaits captain final approval

**Captain Final Approval (TS-033b):**

**Test Steps (as Captain):**
1. Login as `captain`
2. Navigate to "Reward Reports - Pending Approval"
3. Open report R-2026-0001
4. Review officer's notes
5. Verify suspect actually apprehended
6. Approve payment
7. Enter payment amount: `2,800,000,000` (auto-calculated)
8. Add notes: `جایزه تأیید و پرداخت می‌شود`
9. Submit

**API:**
```json
POST /api/investigation/reward-reports/1/captain_approve/
Authorization: Bearer {captain_token}
{
  "approved": true,
  "reward_amount": 2800000000,
  "payment_method": "BANK_TRANSFER",
  "notes": "جایزه تأیید و پرداخت می‌شود"
}
```

**Expected:**
- ✅ Report status → APPROVED
- ✅ Payment initiated
- ✅ Citizen notified: "Your reward of 2.8B Rials has been approved"
- ✅ Bank transfer scheduled
- ✅ Receipt generated

**Rejection:**
```json
{
  "approved": false,
  "notes": "گزارش نادرست بود - مظنون در آن زمان در بازداشت بود"
}
```
- ✅ Report status → REJECTED
- ✅ Citizen notified
- ✅ No payment

---

### Section 4.9: Bail & Fine Payment

#### TS-034: Suspect Pays Bail

**Objective:** Test bail payment integration

**Scenario:** Suspect convicted with bail option (case #7)

**Verdict Details (from TS-027):**
- Case: Car theft (case #7)
- Suspect: محسن تیزی (ID: 7, national_code: 1234567890)
- Punishment: 2 years suspended + bail
- Bail Amount: 50,000,000 Rials
- Bail Tracking Code: `B123456789`
- Fine Amount: 10,000,000 Rials
- Fine Tracking Code: `F987654321`

**Test Steps (as Suspect or Family):**
1. Navigate to Payment Portal (no auth required)
2. Enter tracking code: `B123456789`
3. System displays:
   - Case: سرقت خودرو
   - Suspect: محسن تیزی
   - Amount: 50,000,000 Rials
   - Payee: دادگستری تهران
4. Select payment method:
   - Bank Transfer
   - Credit Card
   - Payment Gateway (Saman, Mellat)
5. Enter payment details
6. Submit

**API:**
```json
GET /api/payments/bail/B123456789/
```

**Response:**
```json
{
  "tracking_code": "B123456789",
  "case_id": 7,
  "case_title": "زورگیری در بزرگراه",
  "suspect_name": "محسن تیزی",
  "amount": 50000000,
  "currency": "IRR",
  "status": "PENDING",
  "payment_deadline": "2026-03-10"
}
```

**Process Payment:**
```json
POST /api/payments/bail/B123456789/pay/
{
  "payment_method": "BANK_TRANSFER",
  "bank_name": "ملی",
  "transaction_id": "TX123456789",
  "payment_date": "2026-02-23",
  "receipt_image": "base64_encoded_image"
}
```

**Expected:**
- ✅ Payment recorded
- ✅ Status → PENDING_VERIFICATION
- ✅ Judge notified to verify
- ✅ Receipt sent to payer

**Judge Verification:**
```json
PATCH /api/payments/bail/B123456789/
Authorization: Bearer {judge_token}
{
  "status": "VERIFIED",
  "verified_by": 9,  // judge
  "verification_notes": "واریز تأیید شد"
}
```

**Expected:**
- ✅ Payment status → VERIFIED
- ✅ Suspect eligible for release
- ✅ Bail amount recorded in case

**Release Suspect:**
```json
PATCH /api/investigation/suspects/7/
{
  "status": "RELEASED",
  "is_arrested": false,
  "release_date": "2026-02-24",
  "release_type": "BAIL",
  "bail_paid": true
}
```

---

#### TS-035: Pay Fine

**Objective:** Test fine payment (similar to bail)

**Scenario:** Same case #7, different tracking code

**Test Steps:**
1. Enter fine tracking code: `F987654321`
2. Display:
   - Fine Amount: 10,000,000 Rials
   - Reason: Theft conviction fine
3. Pay via gateway (Saman Kish)
4. Redirect to bank portal
5. Complete payment
6. Redirect back with result

**API:**
```json
POST /api/payments/fine/F987654321/pay/
{
  "payment_method": "ONLINE_GATEWAY",
  "gateway": "SAMAN",
  "redirect_url": "https://example.com/payment-result"
}
```

**Gateway Integration:**
```json
# Saman gateway creates payment URL
{
  "payment_url": "https://sep.shaparak.ir/payment/...",
  "token": "abc123def456",
  "amount": 10000000
}
```

**Frontend:**
- Redirect user to payment_url
- User completes payment
- Gateway redirects back with result
- Verify payment with gateway API

**Verify Payment:**
```json
POST /api/payments/fine/F987654321/verify/
{
  "gateway": "SAMAN",
  "ref_num": "1234567890",
  "trace_no": "987654",
  "status": "OK"
}
```

**Expected:**
- ✅ Payment verified
- ✅ Fine marked paid
- ✅ Receipt generated
- ✅ Suspect notified
- ✅ Case updates with payment info

---

#### TS-036: Payment Status Tracking

**Objective:** Test anyone can check payment status

**Public Endpoint (No Auth):**
```json
GET /api/payments/status/B123456789/
```

**Response:**
```json
{
  "tracking_code": "B123456789",
  "type": "BAIL",
  "amount": 50000000,
  "paid_amount": 50000000,
  "status": "VERIFIED",
  "paid_date": "2026-02-23",
  "verified_date": "2026-02-24",
  "receipt_url": "/media/receipts/B123456789.pdf"
}
```

**Payment Statuses:**
- `PENDING` - Awaiting payment
- `PENDING_VERIFICATION` - Paid, awaiting judge verification
- `VERIFIED` - Payment confirmed
- `REJECTED` - Payment rejected/invalid
- `REFUNDED` - Payment refunded (if) verdict overturned)

---

## 🔒 Role-Based Access Control Tests

### RBAC-001: Admin Role

**Full Access Test:**
```json
GET /api/admin/users/
Authorization: Bearer {admin_token}
```

✅ Can view all users
✅ Can create/edit/delete users
✅ Can assign roles
✅ Can view system statistics
✅ Can access Django Admin at /admin/

**Forbidden Actions:**
❌ Cannot issue verdicts (judge only)
❌ Cannot conduct interrogations (detective only)

---

### RBAC-002: Police Chief Role

**Test Access:**
```json
GET /api/cases/?status=PENDING_CHIEF
Authorization: Bearer {chief_token}
```

✅ View all cases
✅ Approve cases for trial
✅ View reports and statistics
✅ Assign judges

❌ Cannot add evidence
❌ Cannot conduct interrogations
❌ Cannot issue verdicts

---

### RBAC-003: Captain Role

**Test Access:**
```json
GET /api/investigation/interrogation-feedback/?pending=true
Authorization: Bearer {captain_token}
```

✅ Review interrogations
✅ Mark suspects guilty/not guilty
✅ View assigned cases
✅ Generate reports

❌ Cannot create cases
❌ Cannot issue warrants
❌ Cannot issue verdicts

---

### RBAC-004: Sergeant Role

**Test Access:**
```json
GET /api/investigation/warrants/?status=PENDING
Authorization: Bearer {sergeant_token}
```

✅ Approve/reject warrants
✅ Supervise interrogations
✅ View case details
✅ Assign officers to cases

❌ Cannot issue verdicts
❌ Cannot review interrogation guilt

---

### RBAC-005: Detective Role

**Test Access:**
```json
POST /api/evidence/biological/
Authorization: Bearer {detective_token}
```

✅ Add evidence (all types except biological - that's doctor)
✅ Add suspects
✅ Request warrants
✅ Conduct interrogations
✅ Manage investigation board

❌ Cannot approve warrants
❌ Cannot issue verdicts
❌ Cannot approve cases for trial

---

### RBAC-006: Police Officer Role

**Test Access:**
```json
POST /api/cases/officer_review/
Authorization: Bearer {officer_token}
```

✅ Create crime scene cases
✅ Validate complaints (PENDING_OFFICER)
✅ Patrol and report
✅ Add basic evidence

❌ Cannot conduct interrogations
❌ Cannot issue warrants
❌ Cannot access investigation board

---

### RBAC-007: Trainee Role

**Test Access:**
```json
GET /api/cases/?status=PENDING_TRAINEE
Authorization: Bearer {trainee_token}
```

✅ View complaints
✅ Approve/reject complaints
✅ Verify complainants
✅ Request information from citizens

❌ Cannot activate cases
❌ Cannot add evidence
❌ Cannot access investigation features

---

### RBAC-008: Forensic Doctor Role

**Test Access:**
```json
POST /api/evidence/biological/
Authorization: Bearer {doctor_token}
```

✅ Add biological evidence
✅ Verify evidence samples
✅ Upload lab reports
✅ DNA database searches

❌ Cannot view full case details
❌ Cannot conduct interrogations
❌ Cannot access investigation board

---

### RBAC-009: Judge Role

**Test Access:**
```json
POST /api/investigation/verdicts/
Authorization: Bearer {judge_token}
```

✅ View cases assigned by chief
✅ Issue verdicts
✅ Set bail/fine amounts
✅ Verify payments
✅ Generate verdict documents

❌ Cannot add evidence
❌ Cannot conduct interrogations
❌ Cannot approve warrants

---

### RBAC-010: Complainant/Citizen Role

**Test Access:**
```json
GET /api/cases/?creator=12
Authorization: Bearer {citizen_token}
```

✅ Create complaints
✅ View own cases only
✅ Update own case information
✅ Report suspect sightings
✅ View most wanted (public)

❌ Cannot view other cases
❌ Cannot add evidence
❌ Cannot access investigation features
❌ Cannot view sensitive information

**Test Forbidden:**
```json
GET /api/cases/1/  # case not owned by citizen
Authorization: Bearer {citizen_token}
```
Expected: 403 Forbidden

---

### RBAC-011: Dynamic Role Assignment

**Test Creating New Role (as Admin):**
```json
POST /api/roles/
Authorization: Bearer {admin_token}
{
  "code": "forensic_analyst",
  "name": "تحلیلگر پزشکی قانونی",
  "description": "تحلیل نمونه‌های بیولوژیکی"
}
```

**Expected:**
- ✅ Role created without code changes
- ✅ Admin can assign to users
- ✅ Permissions configurable

**Assign to User:**
```json
POST /api/users/12/assign_role/
Authorization: Bearer {admin_token}
{
  "role_code": "forensic_analyst"
}
```

---

## ✅ Scoring Checklist

### Backend (Checkpoint 1) - DRF API

#### Authentication & Authorization (10 points)

- [ ] **JWT Token Authentication** (3 pts)
  - [ ] `/api/auth/register/` endpoint working
  - [ ] `/api/auth/login/` returns access & refresh tokens
  - [ ] Token stored and sent in Authorization header
  - [ ] Token expiration and refresh logic
  
- [ ] **Role-Based Access Control** (4 pts)
  - [ ] 11+ roles implemented
  - [ ] Role assignment working
  - [ ] Permissions enforced on all endpoints
  - [ ] Dynamic role creation (no code changes)
  
- [ ] **User Management** (3 pts)
  - [ ] User CRUD operations
  - [ ] Profile with national_code & phone
  - [ ] Admin can manage users

**Test:**
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass123","national_code":"0000000000","phone":"09120000000"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"detective","password":"password123"}'

# Use token
curl -X GET http://localhost:8000/api/cases/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Qi..."
```

---

#### Case Management API (15 points)

- [ ] **Case CRUD** (5 pts)
  - [ ] Create case (complaint & crime scene)
  - [ ] List cases with filters (status, crime_level, assignee)
  - [ ] Retrieve case details
  - [ ] Update case status
  - [ ] Proper validation

- [ ] **Case Workflow** (5 pts)
  - [ ] Status transitions enforced
  - [ ] Trainee review endpoint
  - [ ] Officer validation endpoint
  - [ ] Detective assignment
  - [ ] Chief approval endpoint

- [ ] **Complainant Management** (3 pts)
  - [ ] Add complainants to case
  - [ ] Multi-complainant support
  - [ ] 3-strike rejection rule
  - [ ] Complainant confirmation

- [ ] **Crime Scene API** (2 pts)
  - [ ] Create crime scene
  - [ ] Link to case
  - [ ] GPS coordinates
  - [ ] Initial evidence

**Test:**
```bash
# Create case
curl -X POST http://localhost:8000/api/cases/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Case","description":"Long description...","crime_level":"LEVEL_2"}'

# List with filters
curl -X GET "http://localhost:8000/api/cases/?status=ACTIVE&crime_level=CRITICAL" \
  -H "Authorization: Bearer {token}"

# Update status
curl -X POST http://localhost:8000/api/cases/1/trainee_review/ \
  -H "Authorization: Bearer {trainee_token}" \
  -d '{"action":"approve","notes":"OK"}'
```

---

#### Evidence Management API (15 points)

- [ ] **5 Evidence Types** (10 pts - 2 each)
  - [ ] Biological Evidence CRUD
  - [ ] Witness Testimony CRUD
  - [ ] Vehicle Evidence CRUD
  - [ ] Identification Document CRUD
  - [ ] Other Evidence CRUD

- [ ] **Evidence Features** (5 pts)
  - [ ] File/image upload working
  - [ ] Evidence verification flow
  - [ ] Link to case
  - [ ] Chain of custody tracking
  - [ ] `is_on_board` flag for detective board

**Test:**
```bash
# Add biological evidence
curl -X POST http://localhost:8000/api/evidence/biological/ \
  -H "Authorization: Bearer {doctor_token}" \
  -F "case=1" \
  -F "title=Blood Sample" \
  -F "description=Found at scene" \
  -F "evidence_type=BLOOD_SAMPLE" \
  -F "image=@blood_sample.jpg"

# Verify evidence
curl -X POST http://localhost:8000/api/evidence/biological/1/verify/ \
  -H "Authorization: Bearer {sergeant_token}" \
  -d '{"is_verified":true}'
```

---

#### Investigation API (20 points)

- [ ] **Suspect Management** (5 pts)
  - [ ] Add suspect to case
  - [ ] Update suspect status
  - [ ] Link to evidence
  - [ ] National code search

- [ ] **Warrant System** (4 pts)
  - [ ] Request warrant (detective)
  - [ ] Approve/reject (sergeant)
  - [ ] Warrant types (arrest, search)
  - [ ] Status tracking

- [ ] **Interrogation** (6 pts)
  - [ ] Create interrogation
  - [ ] Detective scoring
  - [ ] Sergeant supervision
  - [ ] Transcript storage
  - [ ] Audio upload

- [ ] **Investigation Board** (5 pts)
  - [ ] Board CRUD
  - [ ] Node management
  - [ ] Connection CRUD
  - [ ] Retrieve board state

**Test:**
```bash
# Add suspect
curl -X POST http://localhost:8000/api/investigation/suspects/ \
  -H "Authorization: Bearer {detective_token}" \
  -d '{"case":1,"first_name":"John","last_name":"Doe","details":"Suspicious person"}'

# Request warrant
curl -X POST http://localhost:8000/api/investigation/warrants/ \
  -H "Authorization: Bearer {detective_token}" \
  -d '{"case":1,"suspect":1,"type":"ARREST","description":"Strong evidence"}'

# Create interrogation
curl -X POST http://localhost:8000/api/investigation/interrogations/ \
  -H "Authorization: Bearer {detective_token}" \
  -d '{"suspect":1,"transcript":"Q: Where were you?\nA: Home","interrogator_score":8}'
```

---

#### Trial & Verdict API (10 points)

- [ ] **Interrogation Feedback** (3 pts)
  - [ ] Captain review endpoint
  - [ ] Guilty/Not Guilty decision
  - [ ] Feedback notes

- [ ] **Verdict System** (5 pts)
  - [ ] Judge issues verdict
  - [ ] Bail & fine amounts
  - [ ] Tracking codes generated
  - [ ] Verdict document

- [ ] **Chief Approval** (2 pts)
  - [ ] Chief reviews case
  - [ ] Forwards to judge
  - [ ] Judge assignment

**Test:**
```bash
# Captain feedback
curl -X POST http://localhost:8000/api/investigation/interrogation-feedback/ \
  -H "Authorization: Bearer {captain_token}" \
  -d '{"interrogation":1,"decision":"GUILTY","notes":"Clear evidence"}'

# Issue verdict
curl -X POST http://localhost:8000/api/investigation/verdicts/ \
  -H "Authorization: Bearer {judge_token}" \
  -d '{"case":1,"suspect":1,"result":"GUILTY","punishment":"5 years","bail_amount":50000000}'
```

---

#### Most Wanted & Rewards (10 points)

- [ ] **Most Wanted Calculation** (4 pts)
  - [ ] Score formula correct: `crime_level × days_at_large`
  - [ ] Auto-updates daily
  - [ ] Sorted by score
  - [ ] Public endpoint

- [ ] **Reward System** (6 pts)
  - [ ] Reward amount formula: `score × 20,000,000`
  - [ ] Citizen submit report
  - [ ] Officer review
  - [ ] Captain approval
  - [ ] Payment tracking

**Test:**
```bash
# Get most wanted
curl -X GET http://localhost:8000/api/investigation/most-wanted/

# Check public endpoint (no auth)
curl -X GET http://localhost:8000/api/public/most-wanted/

# Submit reward report
curl -X POST http://localhost:8000/api/investigation/reward-reports/ \
  -d '{"suspect_national_code":"1234567890","sighting_location":"Mall","description":"Saw him"}'
```

---

#### Payment System (5 points)

- [ ] **Bail/Fine Payment** (3 pts)
  - [ ] Payment gateway integration
  - [ ] Tracking code lookup
  - [ ] Payment verification
  - [ ] Receipt generation

- [ ] **Payment Status** (2 pts)
  - [ ] Public status tracking
  - [ ] Payment history
  - [ ] Refund support

**Test:**
```bash
# Get payment info
curl -X GET http://localhost:8000/api/payments/bail/B123456789/

# Process payment
curl -X POST http://localhost:8000/api/payments/bail/B123456789/pay/ \
  -d '{"payment_method":"BANK_TRANSFER","transaction_id":"TX123"}'

# Verify payment
curl -X PATCH http://localhost:8000/api/payments/bail/B123456789/ \
  -H "Authorization: Bearer {judge_token}" \
  -d '{"status":"VERIFIED"}'
```

---

#### API Documentation (5 points)

- [ ] **Swagger/OpenAPI** (3 pts)
  - [ ] Swagger UI at `/api/swagger/`
  - [ ] All endpoints documented
  - [ ] Request/response schemas
  - [ ] Authentication documented

- [ ] **API Quality** (2 pts)
  - [ ] Consistent response format
  - [ ] Proper HTTP status codes
  - [ ] Error messages clear
  - [ ] Pagination working

**Test:**
- Navigate to http://localhost:8000/api/swagger/
- Check all endpoints listed
- Try "Try it out" for each endpoint
- Verify schemas match actual responses

---

#### Docker & Deployment (5 points)

- [ ] **Docker Configuration** (3 pts)
  - [ ] `Dockerfile` for backend
  - [ ] `Dockerfile` for frontend
  - [ ] `docker-compose.yml` complete
  - [ ] Builds successfully

- [ ] **Deployment** (2 pts)
  - [ ] Environment variables
  - [ ] Database migrations run
  - [ ] Static files served
  - [ ] Runs on fresh machine

**Test:**
```bash
# Build
docker-compose build

# Start
docker-compose up

# Check services
docker-compose ps

# Expected:
# backend_1  running  0.0.0.0:8000->8000/tcp
# frontend_1 running  0.0.0.0:3000->3000/tcp
# db_1       running  5432/tcp
```

---

#### Code Quality (5 points)

- [ ] **Django Best Practices** (2 pts)
  - [ ] Models properly structured
  - [ ] Migrations checked in
  - [ ] Settings for prod/dev
  - [ ] Secrets in env vars

- [ ] **DRF Best Practices** (2 pts)
  - [ ] Serializers for all models
  - [ ] ViewSets or APIViews
  - [ ] Proper permissions classes
  - [ ] Filters working

- [ ] **Code Organization** (1 pt)
  - [ ] Apps properly separated
  - [ ] No code duplication
  - [ ] Comments where needed
  - [ ] PEP8 compliant

---

### Frontend (Checkpoint 2) - React/NextJS

#### Authentication UI (10 points)

- [ ] **Login Page** (4 pts)
  - [ ] Form with username/password
  - [ ] Token stored on success
  - [ ] Error messages shown
  - [ ] Redirect to dashboard

- [ ] **Registration Page** (4 pts)
  - [ ] All required fields
  - [ ] Client-side validation
  - [ ] Success/error handling
  - [ ] Auto-login after register

- [ ] **Auth State Management** (2 pts)
  - [ ] Token persisted (localStorage)
  - [ ] Auto-logout on 401
  - [ ] Protected routes
  - [ ] User context/state

**Manual Test:**
1. Navigate to `/login`
2. Enter invalid credentials → See error
3. Enter valid credentials → Redirect to dashboard
4. Refresh page → Still logged in
5. Token expires → Auto-logout

---

#### Homepage & Statistics (10 points)

- [ ] **Homepage** (5 pts)
  - [ ] System statistics displayed
  - [ ] Total cases, solved, active
  - [ ] Total users by role
  - [ ] Charts/graphs
  - [ ] Responsive design

- [ ] **Role-Specific Dashboard** (5 pts)
  - [ ] Detective: My cases, evidence, suspects
  - [ ] Judge: Cases for trial
  - [ ] Citizen: My complaints
  - [ ] Officer: Cases to review
  - [ ] Navigation sidebar with role-based menu

**Manual Test:**
1. Login as different roles
2. Verify each sees appropriate dashboard
3. Check statistics are accurate
4. Test responsive on mobile

---

#### Case Management UI (15 points)

- [ ] **Case List Page** (5 pts)
  - [ ] Display all/filtered cases
  - [ ] Search & filter working
  - [ ] Status badges color-coded
  - [ ] Pagination
  - [ ] Click to view details

- [ ] **Create Case** (5 pts)
  - [ ] Complaint form (citizen)
  - [ ] Crime scene form (officer)
  - [ ] File uploads
  - [ ] Validation messages
  - [ ] Success confirmation

- [ ] **Case Details Page** (5 pts)
  - [ ] Full case information
  - [ ] Evidence list
  - [ ] Suspects list
  - [ ] Timeline view
  - [ ] Action buttons (role-based)

**Manual Test:**
1. Navigate to `/cases`
2. Filter by status ACTIVE
3. Click case → View details
4. Create new case
5. Upload files
6. Verify appears in list

---

#### Evidence UI (15 points)

- [ ] **Evidence List** (3 pts)
  - [ ] All evidence for case
  - [ ] Type filtering
  - [ ] Thumbnail images
  - [ ] Verified badge

- [ ] **Add Evidence Forms** (10 pts - 2 each)
  - [ ] Biological form with all fields
  - [ ] Witness testimony form
  - [ ] Vehicle form
  - [ ] ID document form
  - [ ] Other evidence form

- [ ] **Evidence Details** (2 pts)
  - [ ] Modal or separate page
  - [ ] Full details displayed
  - [ ] Images viewable
  - [ ] Download files

**Manual Test:**
1. Open case details
2. Click "Add Evidence"
3. Select type → Biological
4. Fill all fields
5. Upload image
6. Submit → Verify appears in list
7. Repeat for all 5 types

---

#### Investigation Board UI (15 points)

- [ ] **Board Interface** (8 pts)
  - [ ] Drag-drop nodes
  - [ ] Draw connections
  - [ ] Node types: suspect, evidence, location
  - [ ] Connection labels editable
  - [ ] Zoom & pan controls
  - [ ] Auto-save

- [ ] **Board Features** (5 pts)
  - [ ] Add node from evidence list
  - [ ] Remove node/connection
  - [ ] Board state persisted
  - [ ] Export as image
  - [ ] Responsive layout

- [ ] **Library Used** (2 pts)
  - [ ] React Flow / D3.js / Cytoscape
  - [ ] Smooth interactions
  - [ ] Performance with 100+ nodes

**Manual Test:**
1. Login as detective
2. Open case with evidence
3. Click "Investigation Board"
4. Drag evidence to board
5. Create connections
6. Add labels
7. Save
8. Refresh → Board state preserved

---

#### Suspect & Interrogation UI (10 points)

- [ ] **Suspects Page** (4 pts)
  - [ ] List suspects for case
  - [ ] Add suspect form
  - [ ] Status badges
  - [ ] Mugshot display

- [ ] **Interrogation Interface** (6 pts)
  - [ ] Interrogation form (detective)
  - [ ] Transcript textarea
  - [ ] Score slider
  - [ ] Supervisor review form (sergeant)
  - [ ] Captain verdict form
  - [ ] View interrogation history

**Manual Test:**
1. Add suspect to case
2. Update status to ARRESTED
3. Click "Interrogate"
4. Fill transcript (min 500 chars)
5. Set score 8/10
6. Submit
7. Login as sergeant → Review
8. Add supervisor score
9. Login as captain → Mark guilty

---

#### Trial & Verdict UI (10 points)

- [ ] **Judge Dashboard** (3 pts)
  - [ ] Cases pending trial
  - [ ] Full case file view
  - [ ] Evidence gallery
  - [ ] Interrogation transcripts

- [ ] **Verdict Form** (5 pts)
  - [ ] All verdict fields
  - [ ] Guilty/Not Guilty radio
  - [ ] Punishment textarea
  - [ ] Bail/fine inputs
  - [ ] Confirmation dialog

- [ ] **Verdict Display** (2 pts)
  - [ ] Verdict shown on case page
  - [ ] PDF download
  - [ ] Tracking codes displayed

**Manual Test:**
1. Login as judge
2. View case ready for trial
3. Click "Issue Verdict"
4. Fill all fields
5. Select GUILTY
6. Set bail 50M, fine 10M
7. Submit
8. Verify verdict shows on case
9. Download PDF

---

#### Most Wanted Page (10 points)

- [ ] **Public Page** (5 pts)
  - [ ] No authentication required
  - [ ] Top 10 suspects displayed
  - [ ] Poster-style cards
  - [ ] Photos, name, crime, reward
  - [ ] "Report Sighting" button

- [ ] **Ranking Display** (3 pts)
  - [ ] Sorted by score
  - [ ] Rank numbers (1-10)
  - [ ] Score visible
  - [ ] Days at large shown

- [ ] **Report Form** (2 pts)
  - [ ] Modal opens
  - [ ] Location, description fields
  - [ ] Submit without login
  - [ ] Tracking code displayed

**Manual Test:**
1. Open browser in incognito
2. Navigate to `/most-wanted`
3. Verify displays without login
4. Check order by score
5. Click "Report Sighting"
6. Fill form, submit
7. Receive tracking code

---

#### Payment UI (5 points)

- [ ] **Payment Portal** (3 pts)
  - [ ] Enter tracking code
  - [ ] Display case/amount
  - [ ] Payment method selection
  - [ ] Gateway integration

- [ ] **Payment Status** (2 pts)
  - [ ] Public status check
  - [ ] Receipt display
  - [ ] Download receipt

**Manual Test:**
1. Navigate to `/payment`
2. Enter bail code: B123456789
3. Verify details displayed
4. Select payment method
5. Complete payment
6. Verify status changes
7. Download receipt

---

#### UI/UX Quality (10 points)

- [ ] **Design & Usability** (5 pts)
  - [ ] Consistent design system
  - [ ] Persian/RTL support
  - [ ] Color scheme (police theme)
  - [ ] Icons appropriate
  - [ ] Loading states clear

- [ ] **Responsive Design** (3 pts)
  - [ ] Mobile friendly
  - [ ] Tablet layout
  - [ ] Desktop optimized
  - [ ] No horizontal scroll

- [ ] **Performance** (2 pts)
  - [ ] Fast page loads
  - [ ] Images optimized
  - [ ] Code splitting used
  - [ ] No console errors

**Manual Test:**
1. Open DevTools
2. Check console → No errors
3. Resize window → Responsive
4. Test on phone
5. Check Lighthouse score

---

## 🐛 Common Issues & Debugging

### Issue 1: Black Screens / Undefined Data

**Symptom:** Page shows black screen or "X is undefined"

**Root Cause:** Django REST Framework pagination returns `{results: [], count: 0}` but frontend expects plain array `[]`

**Solution:**
```typescript
// WRONG
const response = await api.get('/api/cases/');
setCases(response.data);  // data.map fails

// CORRECT
const response = await api.get('/api/cases/');
const cases = Array.isArray(response.data) 
  ? response.data 
  : response.data?.results || [];
setCases(cases);
```

**Check All:**
- listCases()
- listEvidence() (all 5 types)
- listSuspects()
- listInterrogations()
- listVerdicts()
- listUsers()

---

### Issue 2: 401 Unauthorized Errors

**Symptom:** All API calls return 401 after login

**Root Causes:**
1. Token not stored in localStorage
2. Token not sent in Authorization header
3. Token expired but not refreshed
4. Backend CORS not configured

**Debug:**
```javascript
// Check token exists
console.log('Token:', localStorage.getItem('access_token'));

// Check header
console.log('Request headers:', config.headers);

// Add interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Backend CORS:**
```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True  # Dev only!
CORS_ALLOW_CREDENTIALS = True
```

---

### Issue 3: File Uploads Not Working

**Symptom:** Evidence images return 400 or files not saved

**Root Causes:**
1. Request not sent as multipart/form-data
2. MEDIA_URL / MEDIA_ROOT not configured
3. File field name mismatch

**Solution:**
```typescript
// Frontend - use FormData
const formData = new FormData();
formData.append('case', caseId);
formData.append('title', 'Blood Sample');
formData.append('image', file);  // file from input

await api.post('/api/evidence/biological/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

**Backend:**
```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ...
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# models.py
class Evidence(models.Model):
    image = models.ImageField(upload_to='evidence/', blank=True)
```

---

### Issue 4: Role Permissions Not Enforced

**Symptom:** All users can access all endpoints

**Root Cause:** Missing permission classes on views

**Solution:**
```python
# views.py
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsDetective, IsJudge

class SuspectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsDetective]
    # ...

class VerdictViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsJudge]
    # ...
```

**Custom Permission:**
```python
# permissions.py
from rest_framework.permissions import BasePermission

class IsDetective(BasePermission):
    def has_permission(self, request, view):
        return request.user.roles.filter(code='detective').exists()
```

---

### Issue 5: Investigation Board Not Saving

**Symptom:** Board resets on refresh

**Root Causes:**
1. No auto-save implemented
2. Node positions not persisted to backend
3. Frontend state not synced

**Solution:**
```typescript
// Debounced auto-save
import { debounce } from 'lodash';

const autoSave = debounce(async (boardState) => {
  await api.patch(`/api/investigation/boards/${boardId}/`, {
    nodes: boardState.nodes,
    connections: boardState.connections
  });
}, 1000);

// Call on every change
const handleNodeDrag = (nodeId, position) => {
  updateNode(nodeId, position);
  autoSave(getBoardState());
};
```

---

### Issue 6: Most Wanted Score Not Calculating

**Symptom:** All suspects show score 0

**Root Cause:** `days_at_large` not calculated or formula wrong

**Solution:**
```python
# models.py
from django.utils import timezone

class Suspect(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def days_at_large(self):
        if self.status in ['ARRESTED', 'CONVICTED', 'RELEASED']:
            return 0
        return (timezone.now() - self.created_at).days
    
    @property
    def wanted_score(self):
        if not self.is_main_suspect:
            return 0
        crime_level_map = {
            'LEVEL_1': 1,
            'LEVEL_2': 2,
            'LEVEL_3': 3,
            'CRITICAL': 4
        }
        level = crime_level_map.get(self.case.crime_level, 0)
        return level * self.days_at_large

# serializers.py
class SuspectSerializer(serializers.ModelSerializer):
    days_at_large = serializers.ReadOnlyField()
    wanted_score = serializers.ReadOnlyField()
    reward_amount = serializers.SerializerMethodField()
    
    def get_reward_amount(self, obj):
        return obj.wanted_score * 20_000_000
```

---

### Issue 7: Docker Build Fails

**Symptom:** `docker-compose up` fails

**Common Errors:**

**1. Port already in use:**
```bash
# Check what's using port 8000
netstat -ano | findstr :8000

# Kill process or change port in docker-compose.yml
ports:
  - "8001:8000"
```

**2. Database connection refused:**
```yaml
# docker-compose.yml
services:
  backend:
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/police_db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: police_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

**3. Migrations not running:**
```dockerfile
# Dockerfile
CMD python manage.py migrate && python manage.py runserver 0.0.0.0:8000
```

---

### Issue 8: Payment Gateway Not Working

**Symptom:** Payment redirect fails or verification fails

**Test Solution (Dev):**
```python
# views.py - MOCK GATEWAY FOR TESTING
class PaymentView(APIView):
    def post(self, request, tracking_code):
        if settings.DEBUG:
            # Mock successful payment
            payment = Payment.objects.get(tracking_code=tracking_code)
            payment.status = 'VERIFIED'
            payment.save()
            return Response({'status': 'success'})
        else:
            # Real gateway integration
            # ...
```

---

## 📊 Test Data Requirements

Run `seed_db.py` which creates:

**Users (11):**
- 1 admin, 1 chief, 1 captain, 1 sergeant, 1 detective
- 1 officer, 1 trainee, 1 doctor, 1 judge, 2 citizens

**Cases (8):**
- PENDING_TRAINEE: 1
- PENDING_OFFICER: 1
- ACTIVE: 1
- IN_PURSUIT: 1
- PENDING_SERGEANT: 1
- PENDING_CHIEF: 2
- SOLVED: 1

**Evidence:**
- 2+ biological samples
- 2+ witness testimonies
- 1+ vehicle
- 1+ ID document
- 1+ other

**Suspects (7):**
- Various statuses
- Different days_at_large
- Some with national codes for reward testing

**Interrogations:**
- 3+ with full workflow (detective → sergeant → captain)

**Verdicts:**
- 1+ with bail and fine
- 1+ without bail (serious crime)

---

## ✅ Final Submission Checklist

### Code Quality
- [ ] No console.log in production code
- [ ] No commented-out code blocks
- [ ] No TODO comments left
- [ ] Environment variables in `.env`
- [ ] `.env.example` provided
- [ ] `requirements.txt` / `package.json` complete

### Documentation
- [ ] README.md with setup instructions
- [ ] API documented in Swagger
- [ ] Comments on complex logic
- [ ] REPORT.md with contributions

### Testing
- [ ] All features tested manually
- [ ] No errors in browser console
- [ ] No Django errors in terminal
- [ ] Docker deployment tested

### Security
- [ ] No hardcoded secrets
- [ ] CORS configured properly
- [ ] File upload validation
- [ ] SQL injection protected (ORM)
- [ ] XSS protected (React)

### Git
- [ ] Meaningful commit messages
- [ ] No sensitive files in repo
- [ ] `.gitignore` complete
- [ ] No merge conflicts

---

## 🎯 Evaluation Criteria Summary

| Category | Points | Key Factors |
|----------|--------|-------------|
| **Backend API** | 40 | Endpoints complete, proper REST, DRF best practices |
| **Authentication** | 10 | JWT working, RBAC enforced, dynamic roles |
| **Frontend UI** | 30 | All pages, responsive, UX quality |
| **Features Complete** | 10 | All 9 sections working end-to-end |
| **Code Quality** | 5 | Clean code, organized, documented |
| **Docker** | 5 | Builds and runs successfully |

**Total: 100 points**

**Grading:**
- A: 90-100 (Excellent - All features + polish)
- B: 80-89 (Good - Most features working)
- C: 70-79 (Satisfactory - Core features)
- D: 60-69 (Needs improvement - Missing features)
- F: <60 (Incomplete)

---

**End of Testing Guide**

*For questions or issues, contact TAs or refer to course forum.*
