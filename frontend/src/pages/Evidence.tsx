import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import type { Evidence } from '../types/evidence';
import { EVIDENCE_TYPE_LABELS } from '../types/evidence';
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

  const handleToggleBoard = async (type: string, id: number) => {
    try {
      await evidenceAPI.toggleBoard(type, id);
      fetchEvidences(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle board:', error);
    }
  };

  if (loading) {
    return <div className="loading">در حال بارگذاری...</div>;
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="evidence-container">
          <div className="evidence-header">
            <h1>شواهد {caseId ? `پرونده ${caseId}` : ''}</h1>
            <div className="evidence-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/evidence/create')}
              >
                ثبت شواهد جدید
              </button>
              {caseId && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/cases/${caseId}`)}
                >
                  بازگشت به پرونده
                </button>
              )}
            </div>
          </div>

          {evidences.length === 0 ? (
            <div className="no-data">
              <p>هیچ شواهدی یافت نشد</p>
            </div>
          ) : (
            <div className="evidence-grid">
              {evidences.map((evidence) => (
                <div key={evidence.id} className="evidence-card">
                  <div className="evidence-card-header">
                    <span className="evidence-type-badge">{evidence.type_display}</span>
                    {evidence.is_on_board && (
                      <span className="board-badge">روی تخته</span>
                    )}
                  </div>
                  <h3>{evidence.title}</h3>
                  <p className="evidence-description">{evidence.description}</p>
                  <div className="evidence-meta">
                    <div>
                      <small>ثبت‌کننده:</small>
                      <span>{evidence.recorder_name}</span>
                    </div>
                    <div>
                      <small>تاریخ:</small>
                      <span>{new Date(evidence.recorded_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                  {evidence.images && evidence.images.length > 0 && (
                    <div className="evidence-images">
                      {evidence.images.map((img) => (
                        <img key={img.id} src={img.image} alt="Evidence" />
                      ))}
                    </div>
                  )}
                  <button
                    className={`btn btn-toggle ${evidence.is_on_board ? 'active' : ''}`}
                    onClick={() => {
                      const typeKey = Object.entries(EVIDENCE_TYPE_LABELS)
                        .find(([_, label]) => label === evidence.type_display)?.[0];
                      if (typeKey) handleToggleBoard(typeKey, evidence.id);
                    }}
                  >
                    {evidence.is_on_board ? 'حذف از تخته' : 'افزودن به تخته'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
