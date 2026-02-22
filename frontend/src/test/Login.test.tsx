import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/auth/Login';
import { AuthProvider } from '../context/AuthContext';

// Mock the authAPI
vi.mock('../services/authAPI', () => ({
  default: {
    login: vi.fn(),
  },
}));

describe('Login Component', () => {
  it('renders login form with all fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/نام کاربری|ایمیل|identifier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/رمز|password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ورود|login/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /ورود|login/i });
    fireEvent.click(submitButton);

    // HTML5 validation will prevent submission
    const usernameInput = screen.getByLabelText(/نام کاربری|ایمیل|identifier/i) as HTMLInputElement;
    expect(usernameInput.validity.valid).toBe(false);
  });

  it('accepts user input', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/نام کاربری|ایمیل|identifier/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/رمز|password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });
});
