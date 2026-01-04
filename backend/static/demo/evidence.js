const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const authHeadersJson = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
});

const authHeadersForm = () => ({
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

const parseJsonOrStatus = async (res) => {
  try {
    return JSON.stringify(await res.json());
  } catch {
    return 'خطا: ' + res.status;
  }
};

const KIND_ENDPOINT = {
  witness: '/evidence/witness/',
  biological: '/evidence/biological/',
  vehicle: '/evidence/vehicle/',
  'id-document': '/evidence/id-document/',
  other: '/evidence/other/',
};

let selectedEvidence = null;

function renderKindFields(kind) {
  const host = document.getElementById('kindFields');
  if (!host) return;

  if (!kind) {
    host.innerHTML = '';
    return;
  }

  const row = (label, html) => `
    <label style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
      ${label}
      ${html}
    </label>
  `;

  if (kind === 'witness') {
    host.innerHTML = [
      row('رونوشت صحبت‌ها', '<input name="transcript" required />'),
      row('فایل مرتبط (اختیاری)', '<input type="file" name="media" />'),
    ].join('');
    return;
  }

  if (kind === 'biological') {
    host.innerHTML = [
      row('تایید شده؟', '<select name="is_verified"><option value="false">خیر</option><option value="true">بله</option></select>'),
      row('نتیجه پیگیری پزشکی (اختیاری)', '<input name="medical_follow_up" />'),
      row('نتیجه پیگیری بانک داده (اختیاری)', '<input name="database_follow_up" />'),
    ].join('');
    return;
  }

  if (kind === 'vehicle') {
    host.innerHTML = [
      row('مدل', '<input name="model_name" required />'),
      row('رنگ', '<input name="color" required />'),
      row('شماره پلاک (یکی از پلاک/سریال الزامیست)', '<input name="license_plate" />'),
      row('شماره سریال (یکی از پلاک/سریال الزامیست)', '<input name="serial_number" />'),
    ].join('');
    return;
  }

  if (kind === 'id-document') {
    host.innerHTML = [
      row('نام کامل صاحب مدرک', '<input name="owner_full_name" required />'),
      row('اطلاعات تکمیلی (JSON اختیاری)', '<input name="extra_info" placeholder="مثلاً {\"key\": \"value\"}" />'),
    ].join('');
    return;
  }

  // other
  host.innerHTML = '';
}

async function loadCasesIntoSelect() {
  const select = document.getElementById('caseSelect');
  if (!select) return;

  select.innerHTML = '<option value="">در حال بارگذاری پرونده‌ها…</option>';

  const res = await fetch(`${API_BASE}/cases/`, { headers: authHeadersJson() });
  if (!res.ok) {
    select.innerHTML = '<option value="">(عدم دسترسی به لیست پرونده‌ها)</option>';
    return;
  }

  const cases = await res.json();
  cases.sort((a, b) => (a.id || 0) - (b.id || 0));

  select.innerHTML =
    '<option value="">انتخاب پرونده (ID - عنوان)</option>' +
    cases.map((c) => `<option value="${c.id}">${c.id} — ${c.title}</option>`).join('');
}

async function refreshEvidenceList() {
  const list = document.getElementById('evidenceList');
  const caseId = document.getElementById('caseSelect')?.value;
  if (!list) return;

  list.innerHTML = 'در حال بارگذاری…';

  // We keep listing simple: list for the selected case across all evidence endpoints.
  if (!caseId) {
    list.innerHTML = '<li>ابتدا یک پرونده انتخاب کنید.</li>';
    return;
  }

  const endpoints = Object.entries(KIND_ENDPOINT);
  const items = [];

  for (const [kind, endpoint] of endpoints) {
    const res = await fetch(`${API_BASE}${endpoint}?case=${encodeURIComponent(caseId)}`, { headers: authHeadersJson() });
    if (!res.ok) continue;
    const data = await res.json();
    data.forEach((e) => items.push({ kind, ...e }));
  }

  items.sort((a, b) => (a.id || 0) - (b.id || 0));

  if (!items.length) {
    list.innerHTML = '<li>(شاهدی برای این پرونده ثبت نشده)</li>';
    return;
  }

  list.innerHTML = items
    .map(
      (e) =>
        `<li><button class="button ghost small" type="button" data-eid="${e.id}" data-kind="${e.kind}">انتخاب</button> ${e.id} — ${e.title}</li>`
    )
    .join('');

  list.querySelectorAll('button[data-eid]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-eid');
      const kind = btn.getAttribute('data-kind');
      await openEvidenceDetail(kind, id);
    });
  });
}

async function openEvidenceDetail(kind, id) {
  const out = document.getElementById('evidenceResult');
  const res = await fetch(`${API_BASE}${KIND_ENDPOINT[kind]}${id}/`, { headers: authHeadersJson() });
  if (!res.ok) {
    out.textContent = await parseJsonOrStatus(res);
    return;
  }

  const evidence = await res.json();
  selectedEvidence = { kind, id: evidence.id };

  setText('evidenceTitle', `جزئیات شاهد #${evidence.id}`);
  setText('evidenceMeta', `عنوان: ${evidence.title} | پرونده: ${evidence.case} | ثبت‌کننده: ${evidence.recorder_name || ''} | روی تخته: ${evidence.is_on_board ? 'بله' : 'خیر'}`);
  show('evidenceDetail');
}

async function toggleBoard() {
  const out = document.getElementById('evidenceResult');
  if (!selectedEvidence?.kind || !selectedEvidence?.id) return;

  const url = `${API_BASE}${KIND_ENDPOINT[selectedEvidence.kind]}${selectedEvidence.id}/toggle_board/`;
  const res = await fetch(url, { method: 'POST', headers: authHeadersJson() });

  if (!res.ok) {
    out.textContent = await parseJsonOrStatus(res);
    return;
  }

  const data = await res.json();
  out.textContent = data.is_on_board ? 'به تخته اضافه شد.' : 'از تخته حذف شد.';
  await openEvidenceDetail(selectedEvidence.kind, selectedEvidence.id);
}

async function createEvidence(kind, payload, files) {
  const out = document.getElementById('evidenceResult');
  const endpoint = `${API_BASE}${KIND_ENDPOINT[kind]}`;

  // witness has optional media file. For simplicity, if media provided, use multipart.
  if (kind === 'witness' && files?.media) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
    fd.append('media', files.media);

    const res = await fetch(endpoint, { method: 'POST', headers: authHeadersForm(), body: fd });
    if (!res.ok) {
      out.textContent = await parseJsonOrStatus(res);
      return;
    }
    out.textContent = 'شاهد ثبت شد.';
    await refreshEvidenceList();
    return;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    out.textContent = await parseJsonOrStatus(res);
    return;
  }

  out.textContent = 'شاهد ثبت شد.';
  await refreshEvidenceList();
}

async function uploadImages() {
  const out = document.getElementById('evidenceResult');
  if (!selectedEvidence?.kind || !selectedEvidence?.id) {
    out.textContent = 'ابتدا یک شاهد انتخاب کنید.';
    return;
  }

  const input = document.getElementById('imagesInput');
  const files = Array.from(input?.files || []);
  if (!files.length) {
    out.textContent = 'حداقل یک تصویر انتخاب کنید.';
    return;
  }

  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));

  const url = `${API_BASE}${KIND_ENDPOINT[selectedEvidence.kind]}${selectedEvidence.id}/upload_image/`;
  const res = await fetch(url, { method: 'POST', headers: authHeadersForm(), body: fd });

  if (!res.ok) {
    out.textContent = await parseJsonOrStatus(res);
    return;
  }

  out.textContent = 'تصاویر آپلود شد.';
}

function initEvidencePage() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_superuser');
    window.location.href = '/login/';
  });

  const hint = document.getElementById('authHint');
  if (!getToken()) {
    if (hint) hint.textContent = 'ابتدا وارد شوید (Login) تا توکن ذخیره شود.';
    hide('evidenceArea');
    return;
  }

  if (hint) hint.textContent = 'شما وارد شده‌اید.';
  show('evidenceArea');

  const kindSelect = document.getElementById('kindSelect');
  if (kindSelect) {
    renderKindFields(kindSelect.value);
    kindSelect.addEventListener('change', () => {
      renderKindFields(kindSelect.value);
    });
  }

  const refreshBtn = document.getElementById('refreshEvidenceBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshEvidenceList);

  const closeBtn = document.getElementById('closeEvidenceBtn');
  if (closeBtn)
    closeBtn.addEventListener('click', () => {
      selectedEvidence = null;
      hide('evidenceDetail');
    });

  const uploadForm = document.getElementById('uploadImagesForm');
  if (uploadForm) uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await uploadImages();
  });

  const toggleBoardBtn = document.getElementById('toggleBoardBtn');
  if (toggleBoardBtn) toggleBoardBtn.addEventListener('click', async () => {
    await toggleBoard();
  });

  const createForm = document.getElementById('createEvidenceForm');
  if (createForm)
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(createForm);
      const kind = String(form.get('kind') || '');
      const caseId = parseInt(String(form.get('case_id') || ''), 10);

      const title = String(form.get('title') || '').trim();
      const description = String(form.get('description') || '').trim();

      const payload = { case: caseId, title, description };
      const files = {};

      if (!kind) {
        setText('evidenceResult', 'ابتدا نوع شاهد را انتخاب کنید.');
        return;
      }

      if (!caseId || !title || !description) {
        setText('evidenceResult', 'پرونده، عنوان و توضیحات الزامی است.');
        return;
      }

      if (kind === 'witness') {
        payload.transcript = String(form.get('transcript') || '').trim();
        const media = createForm.querySelector('input[name="media"]')?.files?.[0];
        if (media) files.media = media;
      }

      if (kind === 'biological') {
        payload.is_verified = String(form.get('is_verified')) === 'true';
        payload.medical_follow_up = String(form.get('medical_follow_up') || '').trim();
        payload.database_follow_up = String(form.get('database_follow_up') || '').trim();
      }

      if (kind === 'vehicle') {
        payload.model_name = String(form.get('model_name') || '').trim();
        payload.color = String(form.get('color') || '').trim();
        payload.license_plate = String(form.get('license_plate') || '').trim() || null;
        payload.serial_number = String(form.get('serial_number') || '').trim() || null;

        const hasLP = !!payload.license_plate;
        const hasSN = !!payload.serial_number;
        if (hasLP === hasSN) {
          setText('evidenceResult', 'برای وسیله نقلیه: دقیقاً یکی از شماره پلاک یا شماره سریال را وارد کنید.');
          return;
        }
      }

      if (kind === 'id-document') {
        payload.owner_full_name = String(form.get('owner_full_name') || '').trim();
        const extraRaw = String(form.get('extra_info') || '').trim();
        if (extraRaw) {
          try {
            payload.extra_info = JSON.parse(extraRaw);
          } catch {
            setText('evidenceResult', 'اطلاعات تکمیلی باید JSON معتبر باشد.');
            return;
          }
        } else {
          payload.extra_info = {};
        }
      }

      await createEvidence(kind, payload, files);
    });

  // initial load
  loadCasesIntoSelect().then(refreshEvidenceList);

  // re-list when selected case changes
  const caseSelect = document.getElementById('caseSelect');
  if (caseSelect) caseSelect.addEventListener('change', refreshEvidenceList);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEvidencePage);
} else {
  initEvidencePage();
}
