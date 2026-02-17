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
        <header className="home-hero">
          <h1 className="home-title">سیستم مدیریت پرونده‌های جنایی</h1>
          <h2 className="home-subtitle">L.A. Noire</h2>
          <p className="home-description">
            سامانه‌ای جامع برای مدیریت پرونده‌های جنایی، مدارک، تحقیقات و کاربران
          </p>
        </header>

        <section className="intro-section">
          <h3>درباره اداره پلیس و سامانه</h3>
          <p>
            اداره پلیس مرکزی با هدف برقراری عدالت و امنیت، این سامانه پیشرفته را برای تسریع در روند پیگیری پرونده‌ها طراحی کرده است. 
            وظیفه ما شناسایی مجرمان، جمع‌آوری شواهد غیرقابل انکار و ایجاد پرونده‌های مستند برای قضات است. این سامانه به افسران، کارآگاهان و تیم‌های تخصصی اجازه می‌دهد تا در یک محیط امن و یکپارچه، از لحظه وقوع جرم تا صدور حکم نهایی، همکاری کنند.
          </p>
        </section>

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
            <Link to="/dashboard" className="btn-gold-solid">
              رفتن به داشبورد
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-gold-solid">
                ورود
              </Link>
              <Link to="/register" className="btn-gold-outline">
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
