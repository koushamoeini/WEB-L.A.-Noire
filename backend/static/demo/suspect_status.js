const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

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

let allSuspects = [];

async function fetchSuspectStatus() {
  if (!getToken()) return;

  try {
    const res = await fetch(`${API_BASE}/investigation/suspects/status_list/`, {
      headers: authHeaders()
    });
    
    if (!res.ok) {
      setText('suspectsList', `خطا: ${res.status}`);
      return;
    }

    const data = await res.json();
    allSuspects = data;
    renderSuspects(data);
    updateStats(data);
  } catch (err) {
    setText('suspectsList', `خطا در دریافت اطلاعات: ${err.message}`);
  }
}

function renderSuspects(suspects) {
  if (!suspects || suspects.length === 0) {
    document.getElementById('suspectsList').innerHTML = '<div class="guidance">هیچ مظنونی یافت نشد</div>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">';

  suspects.forEach(s => {
    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'نام نامشخص';
    const pursuit = s.pursuit_days || 0;
    const severe = s.is_severe_pursuit ? 'شدید' : '';
    const score = s.pursuit_score || 0;
    const reward = s.reward_amount ? `${(s.reward_amount / 1000000).toFixed(1)} میلیون ریال` : '-';

    const borderStyle = s.is_under_pursuit
      ? 'border-left: 4px solid var(--accent);'
      : 'border-left: 1px solid rgba(255,255,255,0.12);';

    html += `
      <div class="card" style="${borderStyle} padding: 15px;">
        <h3 style="margin: 0 0 10px 0;">${name}</h3>
        <p class="guidance" style="margin: 5px 0;">
          کد ملی: ${s.national_code || 'ندارد'}
        </p>
        <p class="guidance" style="margin: 5px 0;">
          پرونده: ${s.case_title || 'بدون عنوان'}
        </p>
        <div style="margin-top: 10px; font-size: 0.85em;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>مدت تعقیب:</span> <strong>${pursuit} روز</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>سطح جرم:</span> <strong>${s.crime_level_label || '-'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>امتیاز:</span> <strong>${score}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0; color: var(--accent);">
            <span>پاداش:</span> <strong>${reward}</strong>
          </div>
          <div style="margin-top: 10px; text-align: left;">
            ${severe ? `<span class="note" style="color: var(--accent);">${severe}</span>` : '<span class="guidance">عادی</span>'}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  document.getElementById('suspectsList').innerHTML = html;
}

function updateStats(suspects) {
  if (!suspects) suspects = [];

  const pursuit = suspects.filter(s => s.is_under_pursuit).length;
  const severe = suspects.filter(s => s.is_severe_pursuit).length;

  setText('countPursuit', pursuit);
  setText('countSevere', severe);
}

function filterSuspects() {
  let filtered = allSuspects;

  // Search
  const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  if (searchTerm) {
    filtered = filtered.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const code = (s.national_code || '').toLowerCase();
      return name.includes(searchTerm) || code.includes(searchTerm);
    });
  }

  // Status
  const status = document.getElementById('statusFilter')?.value;
  if (status) {
    filtered = filtered.filter(s => s.case_status === status);
  }

  renderSuspects(filtered);
  updateStats(filtered);
}

function initSuspectStatusPage() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('is_superuser');
    window.location.href = '/';
  });

  const hint = document.getElementById('authHint');
  if (!getToken()) {
    if (hint) hint.textContent = 'لطفاً ابتدا وارد شوید (Login)';
    hide('suspectArea');
    return;
  }

  if (hint) hint.textContent = 'در حال بارگذاری اطلاعات...';
  show('suspectArea');

  fetchSuspectStatus();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', filterSuspects);

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) statusFilter.addEventListener('change', filterSuspects);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    fetchSuspectStatus();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSuspectStatusPage);
} else {
  initSuspectStatusPage();
}
