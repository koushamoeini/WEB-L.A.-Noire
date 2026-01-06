const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const isSuper = () => localStorage.getItem('is_superuser') === 'true';

const showAreas = async () => {
  const userArea = document.getElementById('userActions');
  const adminArea = document.getElementById('adminArea');
  const investigationBtn = document.getElementById('investigationBtn');
  
  if (getToken()) {
    if (userArea) userArea.style.display = 'block';
    if (isSuper() && adminArea) adminArea.style.display = 'block';

    // Check roles for investigation button visibility
    try {
      const res = await fetch(`${API_BASE}/accounts/auth/me/`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const roles = data.roles.map(r => r.code);
        const canInvestigate = roles.some(r => ['detective', 'sergeant', 'captain', 'police_chief'].includes(r));
        if (investigationBtn) {
          investigationBtn.style.display = canInvestigate ? 'inline-block' : 'none';
        }
      }
    } catch (err) {
      console.error('Error checking roles:', err);
    }
  }
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const refreshRoles = async () => {
  const list = document.getElementById('rolesList');
  if (!list) return;
  list.innerHTML = 'در حال بارگذاری...';
  const res = await fetch(`${API_BASE}/roles/`, { headers: authHeaders() });
  if (!res.ok) { list.innerHTML = '<li>عدم دسترسی یا خطا</li>'; return; }
  const roles = await res.json();
  // ensure ordering by id on the client as well
  roles.sort((a, b) => (a.id || 0) - (b.id || 0));
  list.innerHTML = roles.map(r => `<li>${r.id} — ${r.name} (${r.code || ''})</li>`).join('') || '<li>(none)</li>';
  // update role select used by assignment form
  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) {
    roleSelect.innerHTML = '<option value="">انتخاب نقش (ID - نام)</option>' + roles.map(r => `<option value="${r.id}">${r.id} — ${r.name}${r.code ? ` (${r.code})` : ''}</option>`).join('');
  }
};

const refreshUsers = async () => {
  const list = document.getElementById('usersList');
  if (!list) return;
  list.innerHTML = 'در حال بارگذاری...';
  // fetch roles to build id->name map
  const rolesRes = await fetch(`${API_BASE}/roles/`, { headers: authHeaders() });
  const roleMap = {};
  if (rolesRes.ok) {
    const roles = await rolesRes.json();
    roles.sort((a,b) => (a.id||0)-(b.id||0));
    roles.forEach(r => { roleMap[r.id] = r.name; });
  }
  const res = await fetch(`${API_BASE}/users/`, { headers: authHeaders() });
  if (!res.ok) { list.innerHTML = '<li>عدم دسترسی یا خطا</li>'; return; }
  const users = await res.json();
  users.sort((a,b) => (a.id||0)-(b.id||0));
  list.innerHTML = users.map(u => `
    <li data-id="${u.id}">
      <a class="button ghost small" href="/cases/" target="_blank" rel="noopener">پرونده‌ها</a>
      ${u.id} — ${u.username} — roles: [${u.roles.map(id => roleMap[id] ? `${roleMap[id]}(${id})` : id).join(', ')}]
    </li>
  `).join('') || '<li>(none)</li>';
  // update user select used by assignment form
  const userSelect = document.getElementById('userSelect');
  if (userSelect) {
    userSelect.innerHTML = '<option value="">انتخاب کاربر (ID - نام کاربری)</option>' + users.map(u => `<option value="${u.id}">${u.id} — ${u.username}</option>`).join('');
  }
};

function initDashboard() {
  showAreas();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('is_superuser');
    window.location.href = '/';
  });

  // If a non-admin user manually opens /dashboard/admin/, redirect to their own dashboard.
  if (getToken() && !isSuper()) {
    window.location.replace('/dashboard/');
    return;
  }

  // Preload selects for admins so assignment works without clicking list buttons
  if (getToken() && isSuper()) {
    refreshRoles();
    refreshUsers();
  }

  const showRolesBtn = document.getElementById('showRolesBtn');
  if (showRolesBtn) showRolesBtn.addEventListener('click', async () => {
    const list = document.getElementById('rolesList');
    if (list.style.display === 'none' || !list.style.display) { await refreshRoles(); list.style.display = 'block'; } else { list.style.display = 'none'; }
  });

  const showUsersBtn = document.getElementById('showUsersBtn');
  if (showUsersBtn) showUsersBtn.addEventListener('click', async () => {
    const list = document.getElementById('usersList');
    if (list.style.display === 'none' || !list.style.display) { await refreshUsers(); list.style.display = 'block'; } else { list.style.display = 'none'; }
  });

  const createForm = document.getElementById('createRoleForm');
  if (createForm) createForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(createForm);
    const body = {
      code: String(form.get('code') || '').trim(),
      name: String(form.get('name') || '').trim(),
    };
    const res = await fetch(`${API_BASE}/roles/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    const out = document.getElementById('adminResult');
    if (res.ok) {
      out.textContent = 'نقش ایجاد شد';
      refreshRoles();
    } else {
      try {
        const data = await res.json();
        out.textContent = JSON.stringify(data);
      } catch {
        out.textContent = 'خطا: ' + res.status;
      }
    }
  });

  const assignForm = document.getElementById('assignRoleForm');
  if (assignForm) assignForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(assignForm);
    const uid = form.get('userId');
    const rid = parseInt(String(form.get('roleId') || ''), 10);
    const out = document.getElementById('adminResult');
    if (!uid || !rid) {
      out.textContent = 'ابتدا کاربر و نقش را انتخاب کنید.';
      return;
    }
    const res = await fetch(`${API_BASE}/users/${uid}/roles/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ roles: [rid] }) });
    if (res.ok) { out.textContent = 'نقش اختصاص یافت'; refreshUsers(); } else { try { const data = await res.json(); out.textContent = JSON.stringify(data); } catch { out.textContent = 'خطا: ' + res.status; } }
  });
}

// Bind either immediately or on DOMContentLoaded depending on load timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
// ensure admin area is evaluated (in case script loads after DOMContentLoaded)
showAdminArea();
