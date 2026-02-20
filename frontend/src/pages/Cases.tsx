import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import { CASE_STATUS } from '../types/case';
import Sidebar from '../components/Sidebar';
import './Cases.css';
import { useAuth } from '../context/AuthContext';

const Cases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await caseAPI.listCases();
        setCases(data);
      } catch (err: any) {
        setError('خطا در بارگذاری پرونده‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="cases-container">
            <p>در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isPolice = userRoles.some(r => ['police_officer', 'sergeant', 'detective', 'captain', 'police_chief'].includes(r));
  const isCitizen = userRoles.length === 0;

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="cases-container">
          
          <div className="cases-top-header">
            <div className="header-info">
              <h1 className="gold-text">مدیریت پرونده‌ها</h1>
              <p className="welcome-text">مشاهده، ثبت و پیگیری پرونده‌های جنایی فعال و مختومه.</p>
            </div>
          </div>

          <div className="cases-actions-bar">
            <div className="actions-left">
              {(isCitizen || user?.is_superuser) && (
                <button 
                  onClick={() => navigate('/cases/create-complaint')}
                  className="btn-gold-solid"
                >
                  + ثبت شکایت جدید
                </button>
              )}
              {(isPolice || user?.is_superuser) && (
                <button 
                  onClick={() => navigate('/cases/create-scene')}
                  className="btn-gold-outline"
                >
                  + ثبت صحنه جرم
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {cases.length === 0 ? (
            <div className="empty-state">
              <p>هیچ پرونده‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="cases-grid">
              {cases.map((caseItem) => (
                <div 
                  key={caseItem.id} 
                  className="case-card-luxury"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <div className="card-top">
                    <div className="status-indicator">
                      <span className={`status-dot ${caseItem.status}`}></span>
                      <span className="status-label">{CASE_STATUS[caseItem.status as keyof typeof CASE_STATUS]}</span>
                    </div>
                    <span className="case-id">#{caseItem.id}</span>
                  </div>

                  <h3 className="gold-text case-title">{caseItem.title}</h3>
                  <p className="case-desc">
                    {caseItem.description.length > 120 
                      ? `${caseItem.description.substring(0, 120)}...` 
                      : caseItem.description}
                  </p>

                  <div className="card-bottom">
                    <div className="meta-info">
                      <span className={`crime-level-badge level-${caseItem.crime_level}`}>
                        {caseItem.level_label}
                      </span>
                      <span className="date-text">
                        {new Date(caseItem.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <div className="entry-link">
                      ورود به پرونده ←
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cases;
