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

// Tab Management
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // Hide all
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.add('ghost');
      });

      // Show selected
      const tabName = btn.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).style.display = 'block';
      btn.classList.remove('ghost');

      if (tabName === 'pending') fetchPendingReports();
      if (tabName === 'approved') fetchApprovedReports();
    });
  });
}

// Create Reward Report
function setupCreateForm() {
  const form = document.getElementById('createRewardForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      suspect_full_name: document.getElementById('suspectName').value,
      suspect_national_code: document.getElementById('suspectCode').value,
      description: form.querySelector('[name="description"]').value,
    };

    try {
      const res = await fetch(`${API_BASE}/investigation/reward-reports/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const result = document.getElementById('createResult');
      if (res.ok) {
        const data = await res.json();
        result.textContent = `گزارش ثبت شد. کد پیگیری: ${data.tracking_code || data.id}`;
        result.style.display = 'block';
        form.reset();
      } else {
        const err = await res.json();
        result.textContent = `خطا: ${JSON.stringify(err)}`;
        result.style.display = 'block';
      }
    } catch (err) {
      const result = document.getElementById('createResult');
      result.textContent = `خطا در ارسال: ${err.message}`;
      result.style.display = 'block';
    }
  });
}

// Fetch Pending Reports
async function fetchPendingReports() {
  try {
    const res = await fetch(
      `${API_BASE}/investigation/reward-reports/?status=PO`,
      { headers: authHeaders() }
    );

    if (!res.ok) {
      setText('pendingList', `خطا: ${res.status}`);
      return;
    }

    const reports = await res.json();
    renderReports(reports, 'pendingList');
  } catch (err) {
    setText('pendingList', `خطا: ${err.message}`);
  }
}

// Fetch Approved Reports
async function fetchApprovedReports() {
  try {
    const res = await fetch(
      `${API_BASE}/investigation/reward-reports/?status=AP`,
      { headers: authHeaders() }
    );

    if (!res.ok) {
      setText('approvedList', `خطا: ${res.status}`);
      return;
    }

    const reports = await res.json();
    renderReports(reports, 'approvedList');
  } catch (err) {
    setText('approvedList', `خطا: ${err.message}`);
  }
}

function renderReports(reports, containerId) {
  const container = document.getElementById(containerId);
  if (!reports || reports.length === 0) {
    container.innerHTML = '<div class="guidance">هیچ گزارشی یافت نشد</div>';
    return;
  }

  let html = '<div style="display: grid; gap: 15px;">';

  reports.forEach(r => {
    const amount = r.reward_amount 
      ? `${(r.reward_amount / 1000000).toFixed(1)} میلیون ریال` 
      : 'محاسبه نشده';
    
    html += `
      <div class="card" style="padding: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0 0 8px 0;">متهم: ${r.suspect_full_name || r.suspect_national_code || '-'}</h4>
            <p class="guidance" style="margin: 0 0 5px 0;">
              کد ملی: ${r.suspect_national_code || '-'}
            </p>
            <p class="guidance" style="margin: 0 0 5px 0;">
              وضعیت: <strong>${r.status_display || r.status}</strong>
            </p>
            <p style="font-size: 0.9em; margin: 0 0 5px 0;">
              <strong>پاداش: ${amount}</strong>
            </p>
            <p class="guidance" style="margin: 8px 0 0 0;">
              کد پیگیری: ${r.tracking_code || r.id}
            </p>
          </div>
          <div style="text-align: left;">
            <p class="guidance" style="margin: 0;">
              ایجاد: ${new Date(r.created_at).toLocaleDateString('fa-IR')}
            </p>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// Lookup Report
function setupLookup() {
  const lookupBtn = document.getElementById('lookupBtn');
  if (!lookupBtn) return;

  lookupBtn.addEventListener('click', async () => {
    const national = document.getElementById('lookupNational').value;
    const tracking = document.getElementById('lookupTracking').value;

    if (!national || !tracking) {
      setText('lookupResult', 'هر دو مورد (کد ملی و کد پیگیری) الزامی است');
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/investigation/reward-reports/lookup/?national_code=${national}&tracking_code=${tracking}`,
        { headers: authHeaders() }
      );

      if (!res.ok) {
        setText('lookupResult', 'گزارشی یافت نشد');
        return;
      }

      const data = await res.json();
      renderReports(Array.isArray(data) ? data : [data], 'lookupResult');
    } catch (err) {
      setText('lookupResult', `خطا: ${err.message}`);
    }
  });
}

// Update Stats
async function updateRewardStats() {
  try {
    const res = await fetch(
      `${API_BASE}/investigation/reward-reports/`,
      { headers: authHeaders() }
    );

    if (!res.ok) return;

    const reports = await res.json();

    const newCount = reports.filter(r => r.status === 'PO' || r.status === 'PD').length;
    const approved = reports.filter(r => r.status === 'AP').length;
    const rejected = reports.filter(r => r.status === 'RE').length;

    setText('statNew', newCount);
    setText('statApproved', approved);
    setText('statRejected', rejected);
  } catch (err) {
    console.error(err);
  }
}

function initRewardPage() {
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
    hide('rewardArea');
    return;
  }

  if (hint) hint.textContent = 'در حال بارگذاری...';
  show('rewardArea');

  setupTabs();
  setupCreateForm();
  setupLookup();
  updateRewardStats();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRewardPage);
} else {
  initRewardPage();
}
