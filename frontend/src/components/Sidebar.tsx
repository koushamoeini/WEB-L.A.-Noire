import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setIsOpen(false);

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isOnlyCitizen = userRoles.length === 0 || (userRoles.length === 1 && userRoles.includes('complainant'));

  const isDetective = userRoles.includes('detective');
  const canSeeStats =
    user?.is_superuser ||
    userRoles.some((role) =>
      ['judge', 'qazi', 'captain', 'police_chief'].includes(role)
    );

  const canSeeEvidence =
    user?.is_superuser ||
    userRoles.some((role) =>
      [
        'trainee',
        'police_officer',
        'detective',
        'sergeant',
        'captain',
        'police_chief',
        'forensic_doctor',
        'judge',
        'qazi',
      ].includes(role)
    );

  const menuItems = [
    {
      icon: '🏠',
      label: 'داشبورد',
      path: '/dashboard',
    },
    {
      icon: '📁',
      label: 'وضعیت پرونده‌ها و شکایات',
      path: '/cases',
    },
    {
      icon: '⚖️',
      label: 'تحت پیگیری شدید',
      path: '/ranking',
    },
    {
      icon: '🧾',
      label: 'مدارک و شواهد',
      path: '/evidence',
      hidden: isOnlyCitizen || !canSeeEvidence,
    },
    {
      icon: '🎯',
      label: 'تخته کارآگاه',
      path: '/investigation',
      hidden: isOnlyCitizen || !isDetective,
    },
    {
      icon: '📊',
      label: 'گزارش‌گیری کلی',
      path: '/stats',
      hidden: isOnlyCitizen || !canSeeStats,
    },
    {
      icon: '🔔',
      label: 'اعلان‌ها',
      path: '/notifications',
      hidden: isOnlyCitizen,
    },
  ];

  return (
    <>
      <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>L.A. Noire</h2>
          <div className="user-badge">
            <span className="user-name">{user?.username}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            if (item.hidden) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </div>
    </>
  );
}
