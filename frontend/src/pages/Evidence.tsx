import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import type { Evidence, BiologicalEvidence } from '../types/evidence';
import Sidebar from '../components/Sidebar';
import './Evidence.css';
import { useAuth } from '../context/AuthContext';

export default function Evidence() {
  const { user } = useAuth();
  const isForensicDoctor = user?.roles?.some((r) => r.code === 'forensic_doctor') || false;

  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case');
  const navigate = useNavigate();

  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [bioEvidences, setBioEvidences] = useState<BiologicalEvidence[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyId, setVerifyId] = useState<number | null>(null);
  const [medicalFollowUp, setMedicalFollowUp] = useState('');
  const [databaseFollowUp, setDatabaseFollowUp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchEvidences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const bioMap = useMemo(() => {
    const map = new Map<number, BiologicalEvidence>();
    bioEvidences.forEach((b) => map.set(b.id, b));
    return map;
  }, [bioEvidences]);

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      setError(null);
      const cid = caseId ? parseInt(caseId) : undefined;

      const [all, biological] = await Promise.all([
        evidenceAPI.listAllEvidence(cid),
        evidenceAPI.listBiologicalEvidence(cid).catch(() => [] as BiologicalEvidence[]),
      ]);

      setEvidences(all);
      setBioEvidences(biological);
    } catch (err) {
      console.error('Failed to fetch evidences:', err);
      setError('خطا در دریافت لیست شواهد');
    } finally {
      setLoading(false);
    }
  };

  const openVerify = (bio: BiologicalEvidence) => {
    setVerifyId(bio.id);
    setMedicalFollowUp(bio.medical_follow_up ?? '');
    setDatabaseFollowUp(bio.database_follow_up ?? '');
    setVerifyOpen(true);
  };

  const closeVerify = () => {
    setVerifyOpen(false);
    setVerifyId(null);
    setMedicalFollowUp('');
    setDatabaseFollowUp('');
  };

  const submitVerify = async () => {
    if (!verifyId) return;
    try {
      setVerifyLoading(true);
      await evidenceAPI.verifyBiologicalEvidence(verifyId, {
        medical_follow_up: medicalFollowUp,
        database_follow_up: databaseFollowUp,
      });
      closeVerify();
      await fetchEvidences();
    } catch (err) {
      console.error(err);
      setError('خطا در تایید مدرک زیستی');
    } finally {
      setVerifyLoading(false);
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
          <header className="evidence-header page-header-lux">
            <div>
              <h1 className="gold-text">ثبت و بررسی مدارک (۵.۸){caseId ? ` — پرونده ${caseId}` : ''}</h1>
              <p className="subtitle-lux">مشاهده، مدیریت و ارجاع شواهد پرونده</p>
            </div>
            <div className="evidence-actions">
              <button className="btn-gold-solid" onClick={() => navigate('/evidence/create')}>
                ثبت شواهد جدید
              </button>
              {caseId && (
                <button className="btn-gold-outline" onClick={() => navigate(`/cases/${caseId}`)}>
                  بازگشت به پرونده
                </button>
              )}
            </div>
          </header>

          {error && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,90,90,0.35)',
                background: 'rgba(255,90,90,0.08)',
                color: '#ffd2d2',
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {isForensicDoctor && (
            <div className="lux-card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 className="gold-text" style={{ marginTop: 0 }}>
                شواهد زیستیِ در انتظار تایید
              </h3>

              {bioEvidences.filter((b) => !b.is_verified).length === 0 ? (
                <p style={{ color: '#ccc', margin: 0, lineHeight: 1.8 }}>فعلاً مدرک زیستیِ تایید نشده‌ای وجود ندارد.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {bioEvidences
                    .filter((b) => !b.is_verified)
                    .map((b) => (
                      <div
                        key={b.id}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: 'rgba(0,0,0,0.18)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{b.title}</div>
                          <div style={{ color: '#ccc', fontSize: 12, marginTop: 4 }}>
                            ثبت‌کننده: {b.recorder_name} • تاریخ: {new Date(b.recorded_at).toLocaleDateString('fa-IR')}
                          </div>
                        </div>
                        <button className="btn-gold-solid" onClick={() => openVerify(b)}>
                          تایید پزشکی
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {evidences.length === 0 ? (
            <div className="no-data">
              <p>هیچ شواهدی یافت نشد</p>
            </div>
          ) : (
            <div className="evidence-grid">
              {evidences.map((evidence) => (
                <div key={evidence.id} className="evidence-card module-card-luxury">
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
                    className="btn-gold-outline"
                    style={{ width: '100%', marginTop: '10px' }}
                    onClick={() => navigate(`/investigation?case=${evidence.case}`)}
                  >
                    مشاهده در تخته کارآگاه
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
