const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const setMsg = (text) => {
  const el = document.getElementById('routerMsg');
  if (el) el.textContent = text;
};

const setHelp = (text) => {
  const el = document.getElementById('routerHelp');
  if (el) el.textContent = text;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
});

const pickDashboardPath = (me) => {
  if (me?.is_superuser) return '/dashboard/admin/';

  const codes = (me?.roles || []).map((r) => r.code).filter(Boolean);

  // Keep legacy judge dashboard route.
  // Support either 'judge' or Persian-transliterated 'qazi' depending on seeding.
  if (codes.includes('judge') || codes.includes('qazi')) return '/dashboard/judge/';

  // Prefer higher-privilege roles when user has multiple roles.
  const priority = [
    'system_admin',
    'police_chief',
    'captain',
    'sergeant',
    'police_officer',
    'patrol_officer',
    'trainee',
    'forensic_doctor',
    'complainant',
    'witness',
    'suspect',
    'criminal',
    'detective',
    'base_user',
  ];

  const chosen = priority.find((p) => codes.includes(p)) || codes[0];
  if (chosen === 'base_user') return '/dashboard/user/';
  if (chosen) return `/dashboard/role/${encodeURIComponent(chosen)}/`;

  return '/dashboard/user/';
};

async function routeDashboard() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_superuser');
    window.location.href = '/login/';
  });

  if (!getToken()) {
    setMsg('ابتدا وارد شوید.');
    setHelp('از صفحه ورود وارد شوید تا توکن ذخیره شود.');
    return;
  }

  setMsg('در حال تشخیص نقش…');

  const res = await fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) {
      setMsg('توکن نامعتبر یا منقضی شده است.');
      setHelp('دوباره وارد شوید.');
      return;
    }
    setMsg('خطا در دریافت اطلاعات کاربر: ' + res.status);
    return;
  }

  const me = await res.json();
  const target = pickDashboardPath(me);
  window.location.replace(target);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', routeDashboard);
} else {
  routeDashboard();
}
