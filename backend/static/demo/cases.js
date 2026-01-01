const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const isSuper = () => localStorage.getItem('is_superuser') === 'true';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
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
        `<li><button class="button ghost small" type="button" data-case-id="${c.id}">انتخاب</button> ${c.id} — ${c.title} — ${c.status_label} — ${c.level_label}</li>`
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

  // Show/hide action forms based on status.
  // We keep it simple: show review buttons when case is in the pending states.
  // (role-based access is enforced server-side.)
  hide('resubmitForm');
  hide('traineeReviewForm');
  hide('officerReviewForm');

  if (selectedCase.status === 'RE') show('resubmitForm');
  if (selectedCase.status === 'PT') show('traineeReviewForm');
  if (selectedCase.status === 'PO') show('officerReviewForm');

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
    if (selectedCase?.id) await openCaseDetail(selectedCase.id);
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
      await postAction(`${API_BASE}/cases/${selectedCase.id}/resubmit/`);
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

  // initial load
  fetchCases();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCasesPage);
} else {
  initCasesPage();
}
