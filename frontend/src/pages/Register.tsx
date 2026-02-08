import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    national_code: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.username?.[0] ||
                          err.response?.data?.email?.[0] ||
                          err.response?.data?.phone?.[0] ||
                          err.response?.data?.national_code?.[0] ||
                          'خطا در ثبت‌نام. لطفا مجددا تلاش کنید.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ثبت‌نام</h1>
        <p className="auth-subtitle">به L.A. Noire خوش آمدید</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">نام کاربری</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="نام کاربری خود را وارد کنید"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">ایمیل</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="national_code">کد ملی</label>
            <input
              type="text"
              id="national_code"
              name="national_code"
              value={formData.national_code}
              onChange={handleChange}
              required
              placeholder="کد ملی ۱۰ رقمی"
              pattern="[0-9]{10}"
              title="کد ملی باید دقیقا ۱۰ رقم باشد"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">شماره تماس</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="09123456789"
              pattern="[0-9]{10,11}"
              title="شماره تماس باید حداقل ۱۰ رقم باشد"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">رمز عبور</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="رمز عبور خود را وارد کنید"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="auth-footer">
          قبلا ثبت‌نام کرده‌اید؟{' '}
          <Link to="/login" className="auth-link">
            ورود
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
