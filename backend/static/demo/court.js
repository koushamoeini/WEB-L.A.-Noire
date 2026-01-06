const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const getCaseId = () => new URLSearchParams(window.location.search).get('case');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
});

async function loadTrialData() {
  const caseId = getCaseId();
  if (!caseId) {
    document.getElementById('caseTitle').textContent = 'شناسه پرونده یافت نشد.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/trial_history/`, { headers: authHeaders() });
    if (!res.ok) throw new Error('خطا در دریافت اطلاعات');
    const data = await res.json();
    renderTrial(data);
  } catch (err) {
    console.error(err);
    document.getElementById('caseTitle').textContent = 'خطا در بارگذاری اطلاعات پرونده';
  }
}

function renderTrial(data) {
  const { case: c, evidence, suspects, verdicts } = data;

  // Case Header
  document.getElementById('caseTitle').textContent = `پرونده #${c.id}: ${c.title}`;
  document.getElementById('caseMeta').textContent = `شاکی: ${c.creator_name || 'نامعلوم'} | سطح جرم: ${c.level_label || c.crime_level}`;

  // Evidence
  const eList = document.getElementById('evidenceList');
  if (evidence.length === 0) eList.innerHTML = '<p class="subtitle">هیچ مدرکی ثبت نشده است.</p>';
  else {
    eList.innerHTML = evidence.map(e => `
      <div class="history-card">
        <strong>${e.title}</strong><br/>
        <small>${e.description || 'بدون توضیحات'}</small>
      </div>
    `).join('');
  }

  // Suspects & Interrogations
  const sList = document.getElementById('suspectsList');
  const sSelect = document.getElementById('verdictSuspect');
  if (suspects.length === 0) {
    sList.innerHTML = '<p class="subtitle">متهمی یافت نشد.</p>';
    sSelect.innerHTML = '<option value="">متهمی برای این پرونده نیست</option>';
  } else {
    sList.innerHTML = suspects.map(s => `
      <div class="history-card">
        <strong>${s.name} ${s.is_main_suspect ? '<span class="badge badge-guilty">متهم اصلی</span>' : ''}</strong>
        <p><small>${s.details}</small></p>
        ${s.interrogations.map(i => `
          <div style="background: rgba(0,0,0,0.2); padding: 5px; margin-top:5px; font-size: 0.9em;">
            بازجویی توسط ${i.interrogator_username}: ${i.transcript} <br/>
            <strong>امتیاز اولیه: ${i.score}</strong> | 
            <strong>تایید نهایی: ${i.feedback?.final_score || 'در انتظار'}</strong>
          </div>
        `).join('')}
      </div>
    `).join('');

    sSelect.innerHTML = '<option value="">انتخاب متهم...</option>' + 
      suspects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }

  // Police History (Notes)
  const pList = document.getElementById('policeHistory');
  pList.innerHTML = `
    <div class="history-card">
        <strong>یادداشت نهایی افسر:</strong>
        <p>${c.review_notes || '(بدون یادداشت)'}</p>
        <small>وضعیت فعلی پرونده: ${c.status_label}</small>
    </div>
  `;

  // Issued Verdicts
  renderVerdicts(verdicts);
}

function renderVerdicts(verdicts) {
  const vList = document.getElementById('issuedVerdicts');
  if (verdicts.length === 0) vList.innerHTML = '<p class="subtitle">هنوز حکمی صادر نشده است.</p>';
  else {
    vList.innerHTML = verdicts.map(v => `
      <div class="history-card" style="border-color: ${v.result === 'GUILTY' ? '#ff4d4d' : '#2ecc71'}">
        <strong>${v.title}</strong> - <span class="badge ${v.result === 'GUILTY' ? 'badge-guilty' : 'badge-innocent'}">${v.result_display}</span>
        <p><small>${v.description}</small></p>
        ${v.punishment ? `<p><strong>مجازات:</strong> ${v.punishment}</p>` : ''}
        <small>صادر شده توسط: ${v.judge_username}</small>
      </div>
    `).join('');
  }
}

document.getElementById('verdictForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const resultDiv = document.getElementById('verdictResult');
  
  const payload = {
    case: getCaseId(),
    suspect: formData.get('suspect'),
    result: formData.get('result'),
    title: formData.get('title'),
    punishment: formData.get('punishment'),
    description: formData.get('description'),
  };

  try {
    const res = await fetch(`${API_BASE}/investigation/verdicts/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      resultDiv.textContent = 'حکم با موفقیت صادر شد.';
      e.target.reset();
      loadTrialData();
    } else {
      const data = await res.json();
      resultDiv.textContent = 'خطا: ' + JSON.stringify(data);
    }
  } catch (err) {
    resultDiv.textContent = 'خطای سیستمی در ثبت حکم';
  }
});

// Initial Load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTrialData);
} else {
  loadTrialData();
}
