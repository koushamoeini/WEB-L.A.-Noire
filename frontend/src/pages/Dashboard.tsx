import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRoles = user?.roles?.map(r => r.code) || [];

  const modules = [
    {
      id: 'cases',
      title: 'مدیریت پرونده‌ها',
      icon: '📁',
      path: '/cases',
      description: 'مشاهده، ثبت و پیگیری پرونده‌های جنایی فعال و مختومه.',
      roles: ['trainee', 'police_officer', 'detective', 'sergeant', 'captain', 'police_chief', 'judge'],
    },
    {
      id: 'investigation',
      title: 'تخته تحقیقات کارآگاه',
      icon: '🎯',
      path: '/investigation',
      description: 'ابزار حرفه‌ای برای برقرای ارتباط میان شواهد و مظنونین.',
      roles: ['detective'],
    },
    {
      id: 'ranking',
      title: 'تحت پیگیری شدید',
      icon: '🔥',
      path: '/ranking',
      description: 'لیست سیاه خطرناک‌ترین مجرمان که تحت پیگرد قانونی ویژه هستند.',
      roles: ['police_officer', 'detective', 'sergeant', 'captain', 'police_chief'],
    },
    {
      id: 'stats',
      title: 'آمار و گزارشات',
      icon: '📊',
      path: '/stats',
      description: 'تحلیل داده‌های کل سامانه و وضعیت کلی اداره پلیس.',
      roles: ['sergeant', 'captain', 'police_chief'],
    },
  ];

  const visibleModules = modules.filter(m => 
    m.roles.some(role => userRoles.includes(role))
  );

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-content">
          <header className="dashboard-welcome">
            <div>
              <h1>خوش آمدید، {user?.username}</h1>
              <p>وضعیت جاری شما در سامانه: <strong>{user?.roles?.[0]?.name || 'بدون نقش'}</strong></p>
            </div>
          </header>

          <div className="modular-grid">
            {visibleModules.map(module => (
              <div key={module.id} className="module-card" onClick={() => navigate(module.path)}>
                <div className="module-icon">{module.icon}</div>
                <div className="module-info">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>
                <div className="module-footer">
                  <span>ورود به ماژول ←</span>
                </div>
              </div>
            ))}
          </div>

          <div className="info-card">
            <h3>درباره سیستم</h3>
            <p>
              این سیستم برای مدیریت پرونده‌های جنایی، مدارک، تحقیقات و کاربران طراحی شده است.
            </p>
            <p className="note">
              از ماژول‌های بالا یا منوی سمت راست برای دسترسی به بخش‌های مختلف استفاده کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
