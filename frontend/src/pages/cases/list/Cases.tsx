import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../../../services/caseApi';
import type { Case } from '../../../types/case';
import Sidebar from '../../../components/Sidebar';
import { SkeletonCard } from '../../../components/Skeleton';
import './Cases.css';
import { useAuth } from '../../../context/AuthContext';

const Cases = () => {
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  console.log('📋 Cases component mounted, user:', user?.username, 'authLoading:', authLoading);

  useEffect(() => {
    if (authLoading) {
      console.log('📋 Waiting for auth to finish loading...');
      return;
    }
    
    if (!user) {
      console.log('📋 No user, should redirect to login');
      setLoading(false);
      return;
    }

    const fetchCases = async () => {
      try {
        console.log('📋 Fetching cases...');
        const data = await caseAPI.listCases();
        console.log('📋 Cases fetched successfully:', data?.length || 0, 'cases');
        // Ensure data is always an array
        setCases(Array.isArray(data) ? data : []);
        setError('');
      } catch (err: any) {
        console.error('📋 Error fetching cases:', err);
        const errorMsg = err.response?.data?.detail || err.message || 'خطا در بارگذاری پرونده‌ها';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [authLoading, user]);

  if (loading || authLoading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="cases-container">
            <div style={{
              padding: '40px',
              textAlign: 'center',
              fontSize: '24px',
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              marginTop: '40px'
            }}>
              در حال بارگذاری پرونده‌ها...
            </div>
            <SkeletonCard count={5} />
          </div>
        </div>
      </div>
    );
  }

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isPolice = userRoles.some(r => ['police_officer', 'sergeant', 'detective', 'captain', 'police_chief'].includes(r));
  const isCitizen = userRoles.length === 0;

  console.log('📋 Rendering Cases page - loading:', loading, 'error:', error, 'cases:', cases.length);

  if (error) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="cases-container">
            <div className="error-message" style={{
              padding: '20px',
              margin: '20px',
              backgroundColor: '#ff4444',
              color: 'white',
              borderRadius: '8px',
              fontSize: '18px'
            }}>
              {error}
            </div>
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
                    <span className="case-id">#{caseItem.id}</span>
                    <div className="status-indicator">
                      <span className={`status-dot ${caseItem.status}`}></span>
                      <span className="status-label">{caseItem.status_label}</span>
                    </div>
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
