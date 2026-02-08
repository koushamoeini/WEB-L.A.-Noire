import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { caseAPI } from '../services/caseApi';
import { authAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    solvedCases: 0,
    activeCases: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch cases and user stats from backend
        const [cases, userStats] = await Promise.all([
          caseAPI.listCases(),
          authAPI.getUserStats().catch(() => ({ total_users: 0 })),
        ]);
        
        const solvedCount = cases.filter(c => c.status === 'SO').length;
        const activeCount = cases.filter(c => c.status === 'AC').length;
        
        setStats({
          totalCases: cases.length,
          solvedCases: solvedCount,
          activeCases: activeCount,
          totalUsers: userStats.total_users,
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">سیستم مدیریت پرونده‌های جنایی</h1>
        <h2 className="home-subtitle">L.A. Noire</h2>
        <p className="home-description">
          سامانه‌ای جامع برای مدیریت پرونده‌ها، مدارک، تحقیقات و کاربران
        </p>

        {!loading && (
          <div className="stats-section">
            <h3 className="stats-title">آمار سیستم</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.solvedCases}</div>
                <div className="stat-label">تعداد کل پرونده‌های حل شده</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">تعداد کل کارمندان سازمان</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.activeCases}</div>
                <div className="stat-label">تعداد پرونده‌های فعال</div>
              </div>
            </div>
          </div>
        )}

        <div className="home-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="home-button primary">
              رفتن به داشبورد
            </Link>
          ) : (
            <>
              <Link to="/login" className="home-button primary">
                ورود
              </Link>
              <Link to="/register" className="home-button secondary">
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
