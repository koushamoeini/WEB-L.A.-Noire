import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import type { Evidence } from '../types/evidence';
import Sidebar from '../components/Sidebar';
import './Evidence.css';

export default function Evidence() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case');
  const navigate = useNavigate();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvidences();
  }, [caseId]);

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      const data = await evidenceAPI.listAllEvidence(
        caseId ? parseInt(caseId) : undefined
      );
      setEvidences(data);
    } catch (error) {
      console.error('Failed to fetch evidences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="evidence-container">
            <div className="loading-flicker">در حال بارگذاری شواهد...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="evidence-container">
          
          <div className="evidence-top-header">
            <div className="header-info">
              <h1 className="gold-text">شواهد {caseId ? `پرونده ${caseId}` : ''}</h1>
              <p className="welcome-text">لیست دقیق مدارک، شواهد زیستی و فیزیکی جمع‌آوری شده از صحنه جرم.</p>
            </div>
          </div>

          <div className="evidence-actions-bar">
            <div className="actions-left">
              <button
                className="btn-gold-solid"
                onClick={() => navigate('/evidence/create')}
              >
                + ثبت شواهد جدید
              </button>
              {caseId && (
                <button
                  className="btn-gold-outline"
                  onClick={() => navigate(`/cases/${caseId}`)}
                >
                  بازگشت به پرونده
                </button>
              )}
            </div>
          </div>

          {evidences.length === 0 ? (
            <div className="empty-state">
              <p>هیچ شواهدی برای این پرونده ثبت نشده است.</p>
            </div>
          ) : (
            <div className="evidence-grid">
              {evidences.map((evidence) => (
                <div key={evidence.id} className="evidence-card-luxury" onClick={() => navigate(`/investigation?case=${evidence.case}`)}>
                  <div className="card-top">
                    <div className="status-indicator">
                      <span className={`status-dot ${evidence.is_on_board ? 'active' : 'inactive'}`}></span>
                      <span className="status-label">
                        {evidence.is_on_board ? 'روی تخته کارآگاه' : 'در بایگانی'}
                      </span>
                    </div>
                    <span className="case-id">#{evidence.id}</span>
                  </div>

                  <div className="type-badge-container">
                    <span className="luxury-type-badge">{evidence.type_display}</span>
                  </div>

                  <h3 className="gold-text evidence-title">{evidence.title}</h3>
                  <p className="evidence-desc">
                    {evidence.description.length > 120 
                      ? `${evidence.description.substring(0, 120)}...` 
                      : evidence.description}
                  </p>

                  <div className="card-bottom">
                    <div className="meta-info">
                      <div className="meta-item">
                        <span className="meta-label">ثبت کننده:</span>
                        <span className="meta-value">{evidence.recorder_name}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">تاریخ:</span>
                        <span className="meta-value">{new Date(evidence.recorded_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    <div className="entry-link">
                      مشاهده در تخته ←
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
}

