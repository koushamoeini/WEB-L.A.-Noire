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

const setHeading = (text) => {
  const el = document.getElementById('dashboardHeading');
  if (el) el.textContent = text;
  document.title = `WP-Project | ${text}`;
};

async function initRoleDashboard() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('is_superuser');
    window.location.href = '/';
  });

  const roleCode = document.body?.dataset?.roleCode || '';

  if (!getToken()) {
    setText('whoami', 'ابتدا وارد شوید (Login).');
    setText('roleInfo', 'بدون ورود، دسترسی به داشبورد امکان‌پذیر نیست.');
    return;
  }

  const res = await fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      setText('whoami', 'نشست شما منقضی شده است.');
      setText('roleInfo', 'در حال انتقال به صفحه ورود...');
      setTimeout(() => { window.location.href = '/'; }, 2000);
      return;
    }
    setText('whoami', 'خطا در دریافت اطلاعات کاربر');
    setText('roleInfo', 'کد خطا: ' + res.status);
    return;
  }

  const me = await res.json();
  setText('whoami', `خوش آمدید، ${me.username}`);

  const rolesArr = me.roles || [];
  const roles = rolesArr.map((r) => `${r.name}${r.code ? ` (${r.code})` : ''}`).join('، ');
  setText('roleInfo', roles ? `نقش‌ها: ${roles}` : 'نقشی برای شما ثبت نشده است.');

  if (roleCode) {
    const matched = rolesArr.find((r) => r.code === roleCode);
    if (matched) {
      setHeading(`داشبورد ${matched.name}`);
    } else if (me?.is_superuser) {
      setHeading(`داشبورد (${roleCode})`);
    } else {
      setHeading('عدم دسترسی');
      setText('roleInfo', 'شما به این داشبورد دسترسی ندارید. در حال بازگشت…');
      setTimeout(() => window.location.replace('/dashboard/'), 800);
    }
  }

  // Handle Judge-specific case list
  if (roleCode === 'judge' || roleCode === 'qazi') {
    const list = document.getElementById('judgeCasesList');
    if (!list) return;

    try {
      const res = await fetch(`${API_BASE}/cases/`, { headers: authHeaders() });
      if (res.ok) {
        const cases = await res.json();
        if (cases.length === 0) {
          list.textContent = 'هیچ پرونده‌ای یافت نشد.';
        } else {
          list.innerHTML = cases.map(c => `
            <div class="inline-form" style="justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 8px;">
              <span>#${c.id} - ${c.title}</span>
              <a href="/court/?case=${c.id}" class="button small">ورود به دادگاه</a>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      list.textContent = 'خطا در دریافت لیست پرونده‌ها.';
    }
  }

  // Handle Forensic Doctor
  if (roleCode === 'forensic_doctor') {
    const section = document.getElementById('forensicSection');
    const list = document.getElementById('bioEvidenceList');
    if (section) section.style.display = 'block';

    if (list) {
      try {
        const res = await fetch(`${API_BASE}/evidence/biological/`, { headers: authHeaders() });
        if (res.ok) {
          const items = await res.json();
          const unverified = items.filter(i => !i.is_verified);
          if (unverified.length === 0) {
            list.textContent = 'هیچ مورد جدیدی برای بررسی وجود ندارد.';
          } else {
            list.innerHTML = unverified.map(i => `
              <div class="card" style="padding: 15px; border: 1px solid #444;">
                <strong>${i.title} (پرونده #${i.case})</strong>
                <p>${i.description}</p>
                <div class="form-grid" style="margin-top: 10px;">
                  <textarea id="med_${i.id}" placeholder="نتیجه پیگیری پزشکی"></textarea>
                  <textarea id="db_${i.id}" placeholder="نتیجه پیگیری بانک داده"></textarea>
                  <button class="button" onclick="verifyBio(${i.id})">تایید و ثبت نهایی</button>
                </div>
              </div>
            `).join('');
          }
        }
      } catch (e) {
        list.textContent = 'خطا در دریافت شواهد.';
      }
    }
  }

  // Handle Sergeant
  if (roleCode === 'sergeant') {
    const section = document.getElementById('sergeantSection');
    const list = document.getElementById('warrantList');
    if (section) section.style.display = 'block';

    if (list) {
      try {
        const res = await fetch(`${API_BASE}/investigation/warrants/`, { headers: authHeaders() });
        if (res.ok) {
          const items = await res.json();
          const pending = items.filter(i => i.status === 'PENDING');
          if (pending.length === 0) {
            list.textContent = 'هیچ درخواست حکم در انتظاری وجود ندارد.';
          } else {
            list.innerHTML = pending.map(i => `
              <div class="card" style="padding: 15px; border: 1px solid #444;">
                <strong>${i.type_display} (پرونده #${i.case})</strong>
                <p>درخواست‌دهنده: ${i.requester_name}</p>
                <p>علت: ${i.description}</p>
                <div class="form-grid" style="margin-top: 10px;">
                  <textarea id="note_${i.id}" placeholder="توضیحات (اختیاری)"></textarea>
                  <div style="display: flex; gap: 8px;">
                    <button class="button" onclick="handleWarrant(${i.id}, 'approve')">تایید حکم</button>
                    <button class="button danger" onclick="handleWarrant(${i.id}, 'reject')">رد درخواست</button>
                  </div>
                </div>
              </div>
            `).join('');
          }
        }
      } catch (e) {
        list.textContent = 'خطا در دریافت لیست احکام.';
      }
    }
  }
}

async function handleWarrant(id, action) {
  const note = document.getElementById(`note_${id}`).value;
  const res = await fetch(`${API_BASE}/investigation/warrants/${id}/${action}/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ notes: note })
  });

  if (res.ok) {
    alert(`حکم با موفقیت ${action === 'approve' ? 'تایید' : 'رد'} شد.`);
    location.reload();
  } else {
    alert('خطا در انجام عملیات.');
  }
}

async function verifyBio(id) {

  const med = document.getElementById(`med_${id}`).value;
  const db = document.getElementById(`db_${id}`).value;

  const res = await fetch(`${API_BASE}/evidence/biological/${id}/verify/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      medical_follow_up: med,
      database_follow_up: db
    })
  });

  if (res.ok) {
    alert('شواهد با موفقیت تایید شد.');
    location.reload();
  } else {
    alert('خطا در ثبت تاییدیه.');
  }
}

if (document.readyState === 'loading') {

  document.addEventListener('DOMContentLoaded', initRoleDashboard);
} else {
  initRoleDashboard();
}
