const API_BASE = '/api';

const showMessage = (message) => {
  const target = document.getElementById('registerResult');
  if (!target) return;
  target.textContent = message;
};

const parseError = async (response) => {
  if (!response) return 'خطا در ارتباط با سرور.';
  try {
    const data = await response.json();
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    return Object.values(data)
      .flat()
      .join(' | ');
  } catch {
    return response.statusText || `خطا ${response.status}`;
  }
};

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.target).entries());
  const payload = {
    username: formData.username,
    password: formData.password,
    email: formData.email,
    first_name: formData.first_name,
    last_name: formData.last_name,
    phone: formData.phone,
    national_code: formData.national_code,
  };

  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const body = await response.json();
    showMessage(`حساب ${body.username} ایجاد شد. توکن: ${body.token}`);
    event.target.reset();
  } else {
    const error = await parseError(response);
    showMessage(error);
  }
});
