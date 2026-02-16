import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { investigationAPI } from '../services/investigationApi';
import './Ranking.css';

interface MostWantedSuspect {
  national_code: string;
  full_name: string;
  suspect_ids: number[];
  case_ids: number[];
  max_pursuit_days: number;
  max_crime_level: number;
  score: number;
  reward_amount: number;
}

const Ranking = () => {
  const [mostWanted, setMostWanted] = useState<MostWantedSuspect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMostWanted();
  }, []);

  const fetchMostWanted = async () => {
    try {
      setLoading(true);
      const data = await investigationAPI.listMostWanted();
      setMostWanted(data);
    } catch (error) {
      console.error('Failed to fetch most wanted:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="ranking-content">
          <header className="ranking-header">
            <h1>تحت پیگیری شدید</h1>
          </header>

          <div className="ranking-board">
            {loading ? (
              <div className="no-data-pursuit">
                <div className="loading-flicker">در حال بارگذاری لیست سیاه...</div>
              </div>
            ) : mostWanted.length === 0 ? (
              <div className="no-data-pursuit">
                <h2>هیچ جرمی تحت پیگیری شدید یافت نشد</h2>
                <p>تنها مجرمانی که بیش از ۳۰ روز فراری باشند در این لیست قرار می‌گیرند.</p>
              </div>
            ) : (
              <div className="wanted-grid">
                {mostWanted.map((s, index) => (
                  <div 
                    key={index}
                    className="most-wanted-card"
                  >
                    <div className="tag-intensive">UNDER INTENSIVE PURSUIT</div>
                    <div className="wanted-image-container">
                      <span className="wanted-placeholder">👤</span>
                    </div>
                    <div className="wanted-info">
                      <h3 className="wanted-name">{s.full_name}</h3>
                      <div className="wanted-score">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>امتیاز پیگیری: </span>
                        {s.score}
                      </div>
                      <div className="wanted-details">
                        مدت فرار: {s.max_pursuit_days} روز<br />
                        سطح جرم: {s.max_crime_level}<br />
                        کد ملی: {s.national_code || 'نامعلوم'}
                      </div>
                      <div className="wanted-meta">
                        <span className="reward-badge">💰 پاداش: {s.reward_amount.toLocaleString()} ریال</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
