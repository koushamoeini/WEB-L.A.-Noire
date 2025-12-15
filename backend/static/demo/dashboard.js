const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const isSuper = () => localStorage.getItem('is_superuser') === 'true';

const showAdminArea = () => {
  const area = document.getElementById('adminArea');
  if (!area) return;
  if (getToken() && isSuper()) area.style.display = 'block';
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
});

const refreshRoles = async () => {
  const list = document.getElementById('rolesList');
  if (!list) return;
  list.innerHTML = 'در حال بارگذاری...';
  const res = await fetch(`${API_BASE}/roles/`, { headers: authHeaders() });
  if (!res.ok) { list.innerHTML = '<li>عدم دسترسی یا خطا</li>'; return; }
  const roles = await res.json();
  list.innerHTML = roles.map(r => `<li>${r.id} — ${r.name} (${r.code || ''})</li>`).join('') || '<li>(none)</li>';
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
    roles.forEach(r => { roleMap[r.id] = r.name; });
  }
  const res = await fetch(`${API_BASE}/users/`, { headers: authHeaders() });
  if (!res.ok) { list.innerHTML = '<li>عدم دسترسی یا خطا</li>'; return; }
  const users = await res.json();
  list.innerHTML = users.map(u => `
    <li data-id="${u.id}">${u.id} — ${u.username} — roles: [${u.roles.map(id => roleMap[id] ? `${roleMap[id]}(${id})` : id).join(', ')}]</li>
  `).join('') || '<li>(none)</li>';
};

document.addEventListener('DOMContentLoaded', () => {
  showAdminArea();
  const showRolesBtn = document.getElementById('showRolesBtn');
  if (showRolesBtn) showRolesBtn.addEventListener('click', async () => {
    const list = document.getElementById('rolesList');
    if (list.style.display === 'none') { await refreshRoles(); list.style.display = 'block'; } else { list.style.display = 'none'; }
  });

  const showUsersBtn = document.getElementById('showUsersBtn');
  if (showUsersBtn) showUsersBtn.addEventListener('click', async () => {
    const list = document.getElementById('usersList');
    if (list.style.display === 'none') { await refreshUsers(); list.style.display = 'block'; } else { list.style.display = 'none'; }
  });

  const createForm = document.getElementById('createRoleForm');
  if (createForm) createForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(createForm);
    const body = { name: form.get('name') };
    const res = await fetch(`${API_BASE}/roles/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    const out = document.getElementById('adminResult');
    if (res.ok) { out.textContent = 'نقش ایجاد شد'; refreshRoles(); } else { out.textContent = 'خطا: ' + res.status; }
  });

  const assignForm = document.getElementById('assignRoleForm');
  if (assignForm) assignForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(assignForm);
    const uid = form.get('userId');
    const rid = Number(form.get('roleId'));
    const res = await fetch(`${API_BASE}/users/${uid}/roles/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ roles: [rid] }) });
    const out = document.getElementById('adminResult');
    if (res.ok) { out.textContent = 'نقش اختصاص یافت'; } else { out.textContent = 'خطا: ' + res.status; }
  });
});
// ensure admin area is evaluated (in case script loads after DOMContentLoaded)
showAdminArea();
