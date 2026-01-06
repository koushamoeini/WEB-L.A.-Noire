const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const isSuper = () => localStorage.getItem('is_superuser') === 'true';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});


const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const show = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
};

const hide = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

let selectedCase = null;

async function fetchCases() {
  const list = document.getElementById('casesList');
  if (!list) return;
  list.innerHTML = 'در حال بارگذاری...';

  const res = await fetch(`${API_BASE}/cases/`, { headers: authHeaders() });
  if (!res.ok) {
    list.innerHTML = '<li>عدم دسترسی یا خطا</li>';
    return;
  }

  const cases = await res.json();
  cases.sort((a, b) => (a.id || 0) - (b.id || 0));

  if (!cases.length) {
    list.innerHTML = '<li>(هیچ پرونده‌ای وجود ندارد)</li>';
    return;
  }

  list.innerHTML = cases
    .map(
      (c) =>
        `<li>
          <button class="button ghost small" type="button" data-case-id="${c.id}">انتخاب</button> 
          ${c.id} — ${c.title} — ${c.status_label} — ${c.level_label}
          ${c.submission_attempts >= 3 ? '<span title="بیش از ۳ مرتبه رد شده" style="color:#ff4444; margin-right:8px;">⚠️</span>' : ''}
        </li>`
    )
    .join('');


  list.querySelectorAll('button[data-case-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-case-id');
      await openCaseDetail(id);
    });
  });
}

async function openCaseDetail(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/`, { headers: authHeaders() });
  const out = document.getElementById('caseResult');
  if (!res.ok) {
    out.textContent = 'خطا در دریافت جزئیات: ' + res.status;
    return;
  }

  selectedCase = await res.json();

  setText('caseTitle', `جزئیات پرونده #${selectedCase.id}`);
  setText(
    'caseMeta',
    `عنوان: ${selectedCase.title} | وضعیت: ${selectedCase.status_label} | سطح: ${selectedCase.level_label}`
  );
  setText('caseDescription', `توضیحات: ${selectedCase.description}`);

  let extra = `تعداد تلاش‌ها: ${selectedCase.submission_attempts}`;
  if (selectedCase.review_notes) {
    extra += ` | یادداشت قبلی: ${selectedCase.review_notes}`;
  }
  
  const extWrap = document.getElementById('caseExtraInfo');
  if (extWrap) {
    if (selectedCase.submission_attempts >= 3) {
      extWrap.innerHTML = `<span style="color: #ff4444; font-weight: bold; background: rgba(255,0,0,0.1); padding: 2px 8px; border-radius: 4px;">⚠️ پرونده ۳ اخطاره (نیازمند دقت ویژه)</span><br>${extra}`;
    } else {
      extWrap.textContent = extra;
    }
  }


  // Display complainants
  const compList = document.getElementById('complainantsList');
  if (compList && selectedCase.complainant_details) {
    compList.innerHTML = selectedCase.complainant_details
      .map(c => `<li>${c.username} (ID: ${c.user}) ${c.is_confirmed ? '✅ تایید شده' : '⏳ در انتظار تایید'}</li>`)
      .join('');
  }

  // Show/hide action forms based on status.
  // We keep it simple: show review buttons when case is in the pending states.
  // (role-based access is enforced server-side.)
  hide('resubmitForm');
  hide('traineeReviewForm');
  hide('officerReviewForm');
  hide('solveArea');

  if (selectedCase.status === 'RE') {
    show('resubmitForm');
    const rTitle = document.getElementById('resubmitTitle');
    const rDesc = document.getElementById('resubmitDescription');
    if (rTitle) rTitle.value = selectedCase.title;
    if (rDesc) rDesc.value = selectedCase.description;
  }
  if (selectedCase.status === 'PT') show('traineeReviewForm');
  if (selectedCase.status === 'PO') show('officerReviewForm');
  if (selectedCase.status === 'AC') show('solveArea');

  show('caseDetail');
}

async function createCase(payload) {
  const out = document.getElementById('caseResult');
  const res = await fetch(`${API_BASE}/cases/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    out.textContent = 'پرونده ثبت شد.';
    await fetchCases();
    return;
  }

  try {
    const data = await res.json();
    out.textContent = JSON.stringify(data);
  } catch {
    out.textContent = 'خطا: ' + res.status;
  }
}

async function postAction(url, payload) {
  const out = document.getElementById('caseResult');
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload || {}),
  });

  if (res.ok) {
    out.textContent = 'عملیات انجام شد.';
    // Hide detail view because the status change might make the case invisible to the current user
    hide('caseDetail');
    selectedCase = null;
    await fetchCases();
    return;
  }

  try {
    const data = await res.json();
    out.textContent = JSON.stringify(data);
  } catch {
    out.textContent = 'خطا: ' + res.status;
  }
}

async function fetchStats() {
  const out = document.getElementById('caseResult');
  const res = await fetch(`${API_BASE}/cases/statistics/`, { headers: authHeaders() });
  if (!res.ok) {
    out.textContent = 'خطا در دریافت آمار: ' + res.status;
    return;
  }
  const data = await res.json();
  out.textContent = JSON.stringify(data);
}

function initCasesPage() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('is_superuser');
    window.location.href = '/';
  });

  const hint = document.getElementById('authHint');
  if (!getToken()) {
    if (hint) hint.textContent = 'ابتدا وارد شوید (Login) تا توکن ذخیره شود.';
    hide('caseArea');
    return;
  }

  if (hint) hint.textContent = isSuper() ? 'شما با حساب ادمین وارد شده‌اید.' : 'شما وارد شده‌اید.';
  show('caseArea');

  const refreshBtn = document.getElementById('refreshCasesBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', fetchCases);

  const statsBtn = document.getElementById('statsBtn');
  if (statsBtn) statsBtn.addEventListener('click', fetchStats);

  const typeSelector = document.getElementById('caseTypeSelector');
  if (typeSelector) {
    typeSelector.addEventListener('change', (e) => {
      if (e.target.value === 'scene') {
        hide('createCaseForm');
        show('createSceneForm');
      } else {
        show('createCaseForm');
        hide('createSceneForm');
      }
    });
  }

  const addWitnessBtn = document.getElementById('addWitnessBtn');
  if (addWitnessBtn) {
    addWitnessBtn.addEventListener('click', () => {
      const container = document.getElementById('witnessesContainer');
      const div = document.createElement('div');
      div.className = 'inline-form';
      div.style.marginBottom = '8px';
      div.innerHTML = `
        <input placeholder="شماره تماس" class="w-phone" style="min-width: 150px;" />
        <input placeholder="کد ملی" class="w-national" style="min-width: 150px;" />
      `;
      container.appendChild(div);
    });
  }

  const createForm = document.getElementById('createCaseForm');
  if (createForm)
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(createForm);
      await createCase({
        title: String(form.get('title') || '').trim(),
        description: String(form.get('description') || '').trim(),
        crime_level: parseInt(String(form.get('crime_level') || '3'), 10),
      });
    });

  const sceneForm = document.getElementById('createSceneForm');
  if (sceneForm) {
    sceneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(sceneForm);
      const witnesses = [];
      document.querySelectorAll('#witnessesContainer .inline-form').forEach(row => {
        const phone = row.querySelector('.w-phone').value;
        const national = row.querySelector('.w-national').value;
        if (phone && national) witnesses.push({ phone, national_code: national });
      });

      const payload = {
        title: form.get('title'),
        description: form.get('description'),
        crime_level: parseInt(form.get('crime_level')),
        location: form.get('location'),
        occurrence_time: form.get('occurrence_time'),
        witnesses: witnesses
      };

      const res = await fetch(`${API_BASE}/cases/create_from_scene/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        document.getElementById('caseResult').textContent = 'صحنه جرم با موفقیت ثبت شد.';
        sceneForm.reset();
        await fetchCases();
      } else {
        const data = await res.json();
        alert('خطا: ' + JSON.stringify(data));
      }
    });
  }

  const closeBtn = document.getElementById('closeDetailBtn');
  if (closeBtn)
    closeBtn.addEventListener('click', () => {
      selectedCase = null;
      hide('caseDetail');
    });

  const resubmitForm = document.getElementById('resubmitForm');
  if (resubmitForm)
    resubmitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedCase?.id) return;
      const form = new FormData(resubmitForm);
      await postAction(`${API_BASE}/cases/${selectedCase.id}/resubmit/`, {
        title: String(form.get('title') || '').trim(),
        description: String(form.get('description') || '').trim(),
      });
    });

  const traineeForm = document.getElementById('traineeReviewForm');
  if (traineeForm)
    traineeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedCase?.id) return;
      const form = new FormData(traineeForm);
      await postAction(`${API_BASE}/cases/${selectedCase.id}/trainee_review/`, {
        approved: String(form.get('approved')) === 'true',
        notes: String(form.get('notes') || ''),
        confirmed_complainants: [],
      });
    });

  const officerForm = document.getElementById('officerReviewForm');
  if (officerForm)
    officerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedCase?.id) return;
      const form = new FormData(officerForm);
      await postAction(`${API_BASE}/cases/${selectedCase.id}/officer_review/`, {
        approved: String(form.get('approved')) === 'true',
        notes: String(form.get('notes') || ''),
      });
    });

  const solveBtn = document.getElementById('solveCaseBtn');
  if (solveBtn)
    solveBtn.addEventListener('click', async () => {
      if (!selectedCase?.id) return;
      if (confirm('آیا از مختومه کردن این پرونده اطمینان دارید؟')) {
        await postAction(`${API_BASE}/cases/${selectedCase.id}/solve/`);
      }
    });

  const addCompForm = document.getElementById('addComplainantForm');
  if (addCompForm)
    addCompForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedCase?.id) return;
      const form = new FormData(addCompForm);
      const userId = form.get('user_id');
      
      const res = await fetch(`${API_BASE}/cases/${selectedCase.id}/add_complainant/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ user_id: userId }),
      });

      if (res.ok) {
        alert('شاکی با موفقیت اضافه شد.');
        await openCaseDetail(selectedCase.id);
      } else {
        const data = await res.json();
        alert('خطا: ' + (data.error || res.status));
      }
    });

  // initial load
  fetchCases();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCasesPage);
} else {
  initCasesPage();
}
