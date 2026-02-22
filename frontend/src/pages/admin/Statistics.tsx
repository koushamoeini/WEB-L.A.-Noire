import { useState, useEffect } from 'react';
import { adminAPI, type AdminStats } from '../../services/adminAPI';
import { SkeletonStats } from '../../components/Skeleton';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Statistics - Loading stats...');
        const data = await adminAPI.getStats();
        console.log('Statistics - Stats loaded');
        setStats(data);
      } catch (err: any) {
        console.error('Statistics - Error:', err);
        const errorMsg = err.response?.data?.detail || err.message || 'خطا در بارگذاری آمار';
        setError(errorMsg);
        
        // If unauthorized, show specific message
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('دسترسی غیرمجاز. لطفا دوباره وارد شوید.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <SkeletonStats />;
  }

  if (error || !stats) {
    return (
      <div className="statistics-container">
        <div className="error-message">{error || 'خطا در بارگذاری آمار'}</div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <div className="stats-header">
        <h2 className="gold-text">آمار و گزارشات سیستم</h2>
        <p className="subtitle-text">نمای کلی از وضعیت سیستم و فعالیت‌های کاربران</p>
      </div>

      {/* User Statistics */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="icon">👥</span>
          آمار کاربران
        </h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-label">کل کاربران</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats.users.active}</div>
            <div className="stat-label">کاربران فعال</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.users.inactive}</div>
            <div className="stat-label">کاربران غیرفعال</div>
          </div>
          <div className="stat-card info">
            <div className="stat-value">{stats.users.superusers}</div>
            <div className="stat-label">مدیران ارشد</div>
          </div>
        </div>

        <div className="detailed-section">
          <h4 className="subsection-title">توزیع کاربران بر اساس نقش</h4>
          <div className="role-stats-grid">
            {stats.users.by_role.map((role: { role_code: string; role_name: string; count: number }, index: number) => (
              <div key={index} className="role-stat-item">
                <div className="role-name">{role.role_name}</div>
                <div className="role-count">{role.count} نفر</div>
              </div>
            ))}
          </div>
        </div>

        {stats.users.recent.length > 0 && (
          <div className="detailed-section">
            <h4 className="subsection-title">کاربران جدید (۵ نفر اخیر)</h4>
            <div className="recent-list">
              {stats.users.recent.map((user: { id: number; username: string; email: string; date_joined: string }) => (
                <div key={user.id} className="recent-item">
                  <span className="item-id">#{user.id}</span>
                  <span className="item-name">{user.username}</span>
                  <span className="item-email">{user.email}</span>
                  <span className="item-date">
                    {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Case Statistics */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="icon">📁</span>
          آمار پرونده‌ها
        </h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{stats.cases.total}</div>
            <div className="stat-label">کل پرونده‌ها</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.cases.pending}</div>
            <div className="stat-label">در انتظار بررسی</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats.cases.active}</div>
            <div className="stat-label">فعال</div>
          </div>
          <div className="stat-card solved">
            <div className="stat-value">{stats.cases.solved}</div>
            <div className="stat-label">مختومه</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{stats.cases.rejected}</div>
            <div className="stat-label">رد / لغو شده</div>
          </div>
        </div>

        {stats.cases.recent.length > 0 && (
          <div className="detailed-section">
            <h4 className="subsection-title">پرونده‌های اخیر (۵ مورد)</h4>
            <div className="recent-list">
              {stats.cases.recent.map((caseItem: { id: number; title: string; created_at: string; status: string }) => (
                <div key={caseItem.id} className="recent-item">
                  <span className="item-id">#{caseItem.id}</span>
                  <span className="item-name">{caseItem.title}</span>
                  <span className="item-status">
                    <span className={`status-badge ${caseItem.status}`}>
                      {caseItem.status}
                    </span>
                  </span>
                  <span className="item-date">
                    {new Date(caseItem.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence Statistics */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="icon">🔍</span>
          آمار مدارک و شواهد
        </h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{stats.evidence.total}</div>
            <div className="stat-label">کل مدارک</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats.evidence.verified}</div>
            <div className="stat-label">تایید شده</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.evidence.pending}</div>
            <div className="stat-label">در انتظار تایید</div>
          </div>
        </div>

        {stats.evidence.recent.length > 0 && (
          <div className="detailed-section">
            <h4 className="subsection-title">مدارک اخیر (۵ مورد)</h4>
            <div className="recent-list">
              {stats.evidence.recent.map((evidence: { id: number; title: string; recorded_at: string }) => (
                <div key={evidence.id} className="recent-item">
                  <span className="item-id">#{evidence.id}</span>
                  <span className="item-name">{evidence.title}</span>
                  <span className="item-date">
                    {new Date(evidence.recorded_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Investigation Statistics */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="icon">🕵️</span>
          آمار تحقیقات
        </h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{stats.investigation.suspects}</div>
            <div className="stat-label">متهمان</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.investigation.arrests}</div>
            <div className="stat-label">دستگیری‌ها</div>
          </div>
          <div className="stat-card info">
            <div className="stat-value">{stats.investigation.verdicts.total}</div>
            <div className="stat-label">کل احکام</div>
          </div>
        </div>

        <div className="verdict-details">
          <div className="verdict-item guilty">
            <div className="verdict-icon">⚖️</div>
            <div className="verdict-info">
              <div className="verdict-value">{stats.investigation.verdicts.guilty}</div>
              <div className="verdict-label">محکومیت</div>
            </div>
          </div>
          <div className="verdict-item not-guilty">
            <div className="verdict-icon">✓</div>
            <div className="verdict-info">
              <div className="verdict-value">{stats.investigation.verdicts.innocent}</div>
              <div className="verdict-label">تبرئه</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
