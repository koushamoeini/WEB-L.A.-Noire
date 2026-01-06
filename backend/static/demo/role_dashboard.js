const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
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
    localStorage.removeItem('is_superuser');
    window.location.href = '/login/';
  });

  const roleCode = document.body?.dataset?.roleCode || '';

  if (!getToken()) {
    setText('whoami', 'ابتدا وارد شوید (Login).');
    setText('roleInfo', 'بدون ورود، دسترسی به داشبورد امکان‌پذیر نیست.');
    return;
  }

  const res = await fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() });
  if (!res.ok) {
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRoleDashboard);
} else {
  initRoleDashboard();
}
