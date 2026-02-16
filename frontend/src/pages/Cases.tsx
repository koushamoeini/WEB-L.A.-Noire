import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import { CASE_STATUS } from '../types/case';
import Sidebar from '../components/Sidebar';
import './Cases.css';

const Cases = () => {
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

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="cases-container">
          <div className="cases-header">
            <h1 className="gold-text">پرونده‌ها</h1>
            <div className="cases-actions">
              <button 
                onClick={() => navigate('/cases/create-complaint')}
                className="btn-gold-solid"
              >
                ثبت شکایت جدید
              </button>
              <button 
                onClick={() => navigate('/cases/create-scene')}
                className="btn-gold-outline"
              >
                ثبت صحنه جرم
              </button>
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
                  className="lux-card case-card-lux"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <div className="case-header">
                    <span className="red-badge">#{caseItem.id}</span>
                    <span className={`case-status ${caseItem.status}`}>
                      {CASE_STATUS[caseItem.status as keyof typeof CASE_STATUS]}
                    </span>
                  </div>

                  <h3 className="gold-text case-title">{caseItem.title}</h3>
                  
                  <p className="case-description">
                    {caseItem.description.substring(0, 150)}...
                  </p>

                  <div className="case-meta">
                    <span className={`crime-level level-${caseItem.crime_level}`}>
                      {caseItem.level_label}
                    </span>
                    <span className="case-date">
                      {new Date(caseItem.created_at).toLocaleDateString('fa-IR')}
                    </span>
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
