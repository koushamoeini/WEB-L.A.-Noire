import { useState, useEffect } from 'react';
import { adminAPI, type AdminUser } from '../../services/adminAPI';
import { SkeletonTable } from '../../components/Skeleton';
import './UserManagement.css';

interface UserManagementProps {
  onEdit: (user: AdminUser) => void;
  onCreate: () => void;
  refreshTrigger?: number;
}

const UserManagement = ({ onEdit, onCreate, refreshTrigger }: UserManagementProps) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [ordering, setOrdering] = useState('-date_joined');
  const [roles, setRoles] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  console.log('🔥 UserManagement mounted, refreshTrigger:', refreshTrigger);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('UserManagement - Loading data...');
      
      const [usersData, rolesData] = await Promise.all([
        adminAPI.listUsers({
          search: searchQuery || undefined,
          role: roleFilter || undefined,
          is_active: statusFilter,
          ordering,
        }),
        adminAPI.getRoles(),
      ]);
      
      console.log('UserManagement - Raw API response:', usersData);
      
      // Handle both paginated and non-paginated responses safely
      let usersList: AdminUser[] = [];
      
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && typeof usersData === 'object') {
        if ('results' in usersData && Array.isArray(usersData.results)) {
          usersList = usersData.results;
        } else {
          console.warn('Unexpected API response format:', usersData);
          throw new Error('فرمت پاسخ API نامعتبر است');
        }
      } else {
        console.warn('Invalid API response:', usersData);
        throw new Error('پاسخ نامعتبر از سرور');
      }
      
      console.log('UserManagement - Data loaded:', {
        users: usersList.length,
        roles: Array.isArray(rolesData) ? rolesData.length : 0
      });
      
      setUsers(usersList);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err: any) {
      console.error('UserManagement - Error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'خطا در بارگذاری کاربران';
      setError(errorMsg);
      
      // If unauthorized, show specific message
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('دسترسی غیرمجاز. لطفا دوباره وارد شوید.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, roleFilter, statusFilter, ordering, refreshTrigger]);

  const handleToggleActive = async (id: number) => {
    try {
      await adminAPI.toggleActive(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'خطا در تغییر وضعیت کاربر');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      return;
    }

    try {
      setDeletingId(id);
      await adminAPI.deleteUser(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'خطا در حذف کاربر');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (id: number, username: string) => {
    const newPassword = prompt(`رمز عبور جدید برای کاربر "${username}" را وارد کنید:`);
    if (!newPassword) return;

    try {
      await adminAPI.resetPassword(id, newPassword);
      alert('رمز عبور با موفقیت تغییر یافت');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'خطا در تغییر رمز عبور');
    }
  };

  if (loading) {
    return <SkeletonTable rows={10} />;
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <div>
          <h2 className="gold-text">مدیریت کاربران</h2>
          <p className="subtitle-text">مشاهده، ایجاد، ویرایش و حذف کاربران سیستم</p>
        </div>
        <button onClick={onCreate} className="btn-gold-solid">
          + کاربر جدید
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-bar">
        <input
          type="text"
          placeholder="جستجو (نام کاربری، ایمیل، نام)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">همه نقش‌ها</option>
          {roles.map(role => (
            <option key={role.id} value={role.code}>{role.name}</option>
          ))}
        </select>

        <select
          value={statusFilter === undefined ? '' : statusFilter.toString()}
          onChange={(e) => setStatusFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="filter-select"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>

        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="filter-select"
        >
          <option value="-date_joined">جدیدترین</option>
          <option value="date_joined">قدیمی‌ترین</option>
          <option value="username">الفبایی (الف-ی)</option>
          <option value="-username">الفبایی (ی-الف)</option>
        </select>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>هیچ کاربری یافت نشد</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>نام کاربری</th>
                <th>نام و نام خانوادگی</th>
                <th>ایمیل</th>
                <th>نقش‌ها</th>
                <th>وضعیت</th>
                <th>مدیر ارشد</th>
                <th>تاریخ عضویت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td className="username-cell">{user.username}</td>
                  <td>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '-'}</td>
                  <td className="email-cell">{user.email || '-'}</td>
                  <td>
                    <div className="roles-cell">
                      {user.role_names.length > 0 ? (
                        user.role_names.map((role: { id: number; code: string; name: string }) => (
                          <span key={role.id} className="role-badge">{role.name}</span>
                        ))
                      ) : (
                        <span className="no-role">بدون نقش</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td>
                    {user.is_superuser ? (
                      <span className="superuser-badge">✓</span>
                    ) : (
                      <span className="not-superuser">-</span>
                    )}
                  </td>
                  <td className="date-cell">
                    {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(user)}
                        className="btn-action btn-edit"
                        title="ویرایش"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`btn-action ${user.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                        title={user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                      >
                        {user.is_active ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.username)}
                        className="btn-action btn-password"
                        title="تغییر رمز عبور"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn-action btn-delete"
                        disabled={deletingId === user.id}
                        title="حذف"
                      >
                        {deletingId === user.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="results-count">
        تعداد کاربران: {users.length}
      </div>
    </div>
  );
};

export default UserManagement;
