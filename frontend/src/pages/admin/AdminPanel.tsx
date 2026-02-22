import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import UserManagement from './UserManagement';
import UserForm from './UserForm';
import Statistics from './Statistics';
import type { AdminUser } from '../../services/adminAPI';
import './AdminPanel.css';

type TabType = 'users' | 'statistics';

const AdminPanel = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user has admin access (superuser or police_chief)
  const userRoles = user?.roles?.map((r: { code: string }) => r.code) || [];
  const isAdmin = user?.is_superuser || userRoles.includes('police_chief');

  // Debug logging
  console.log('🔍 AdminPanel State:', {
    loading,
    hasUser: !!user,
    username: user?.username,
    is_superuser: user?.is_superuser,
    roles: userRoles,
    isAdmin
  });

  // Show loading while checking authentication or if user is not loaded yet
  if (loading || (!user && !loading)) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="admin-panel-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>در حال بررسی دسترسی...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not admin after loading completes and user is available
  if (!loading && user && !isAdmin) {
    console.log('❌ AdminPanel - Redirecting: User is not admin');
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setShowUserForm(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(undefined);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="admin-panel-container">
          <div className="admin-header">
            <div>
              <h1 className="gold-text">پنل مدیریت سیستم</h1>
              <p className="welcome-text">
                مدیریت کاربران، نقش‌ها و مشاهده آمار کلی سیستم
              </p>
            </div>
          </div>

          <div className="admin-tabs">
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="tab-icon">👥</span>
              <span>مدیریت کاربران</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <span className="tab-icon">📊</span>
              <span>آمار و گزارشات</span>
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'users' ? (
              <UserManagement
                key={`users-${refreshTrigger}`}
                onEdit={handleEditUser}
                onCreate={handleCreateUser}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <Statistics key="statistics" />
            )}
          </div>

          {showUserForm && (
            <UserForm
              user={editingUser}
              onClose={handleCloseForm}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
