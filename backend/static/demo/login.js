const API_BASE = '/api';

const showMessage = (message) => {
  const target = document.getElementById('loginResult');
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

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target).entries());
    const payload = {
      identifier: formData.identifier,
      password: formData.password,
    };

    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const body = await response.json();
      showMessage(`ورود موفقیت‌آمیز؛ توکن: ${body.token}`);
      event.target.reset();
    } else {
      const error = await parseError(response);
      showMessage(error);
    }
  });
}
