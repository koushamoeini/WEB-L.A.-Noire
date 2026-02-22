import { useState, useEffect } from 'react';
import { adminAPI, type AdminUser, type AdminUserCreate, type AdminUserUpdate } from '../../services/adminAPI';
import './UserForm.css';

interface UserFormProps {
  user?: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

const UserForm = ({ user, onClose, onSuccess }: UserFormProps) => {
  const isEdit = !!user;
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    national_code: user?.national_code || '',
    is_active: user?.is_active ?? true,
    is_superuser: user?.is_superuser ?? false,
  });
  
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    user?.role_names.map((r: { id: number }) => r.id) || []
  );
  
  const [roles, setRoles] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await adminAPI.getRoles();
        setRoles(rolesData);
      } catch (err: any) {
        setError('خطا در بارگذاری نقش‌ها');
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      setError('نام کاربری الزامی است');
      return;
    }
    
    if (!isEdit && !formData.password) {
      setError('رمز عبور الزامی است');
      return;
    }
    
    if (formData.password && formData.password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload: AdminUserCreate | AdminUserUpdate = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        national_code: formData.national_code.trim() || undefined,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
        role_ids: selectedRoles.length > 0 ? selectedRoles : undefined,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (isEdit) {
        await adminAPI.updateUser(user.id, payload);
      } else {
        await adminAPI.createUser(payload as AdminUserCreate);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail 
        || err.response?.data?.username?.[0]
        || err.response?.data?.email?.[0]
        || err.response?.data?.password?.[0]
        || (isEdit ? 'خطا در ویرایش کاربر' : 'خطا در ایجاد کاربر');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="gold-text">{isEdit ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-section">
            <h3 className="section-title">اطلاعات حساب کاربری</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>نام کاربری *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="مثال: user123"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>ایمیل</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="form-input"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{isEdit ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور *'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEdit}
                  placeholder={isEdit ? 'برای تغییر رمز وارد کنید' : 'حداقل ۸ کاراکتر'}
                  className="form-input"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">اطلاعات شخصی</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>نام</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="نام"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>نام خانوادگی</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="نام خانوادگی"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>شماره تماس</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09xxxxxxxxx"
                  className="form-input"
                  dir="ltr"
                />
              </div>

              <div className="form-group">
                <label>کد ملی</label>
                <input
                  type="text"
                  name="national_code"
                  value={formData.national_code}
                  onChange={handleChange}
                  placeholder="xxxxxxxxxx"
                  className="form-input"
                  dir="ltr"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">نقش‌ها و دسترسی‌ها</h3>
            
            <div className="roles-grid">
              {roles.map(role => (
                <label key={role.id} className="role-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                  />
                  <span className="role-label">{role.name}</span>
                </label>
              ))}
            </div>

            <div className="form-row checkboxes-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span>حساب فعال است</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_superuser"
                  checked={formData.is_superuser}
                  onChange={handleChange}
                />
                <span>مدیر ارشد (دسترسی کامل)</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              انصراف
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'در حال پردازش...' : (isEdit ? 'ذخیره تغییرات' : 'ایجاد کاربر')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
