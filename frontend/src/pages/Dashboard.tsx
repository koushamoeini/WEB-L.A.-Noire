import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>خوش آمدید، {user?.username}!</h2>
            <div className="user-info">
              <p><strong>ایمیل:</strong> {user?.email}</p>
              <p><strong>شناسه کاربری:</strong> {user?.id}</p>
              {user?.roles && user.roles.length > 0 && (
                <div className="user-roles">
                  <strong>نقش‌های شما:</strong>
                  <ul>
                    {user.roles.map((role) => (
                      <li key={role.id}>{role.name} ({role.code})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="info-card">
            <h3>درباره سیستم</h3>
            <p>
              این سیستم برای مدیریت پرونده‌های جنایی، مدارک، تحقیقات و کاربران طراحی شده است.
            </p>
            <p className="note">
              از منوی سمت راست برای دسترسی به تمام بخش‌ها استفاده کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
