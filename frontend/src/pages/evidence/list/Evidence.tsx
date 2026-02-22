import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../../../services/evidenceApi';
import type { Evidence, BiologicalEvidence } from '../../../types/evidence';
import Sidebar from '../../../components/Sidebar';
import { SkeletonList } from '../../../components/Skeleton';
import './Evidence.css';
import { useAuth } from '../../../context/AuthContext';

export default function Evidence() {
  const { user } = useAuth();
  const isForensicDoctor = user?.roles?.some((r) => r.code === 'forensic_doctor') || false;
  const BACKEND_URL = 'http://localhost:8000';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm('آیا از حذف این مدرک اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) return;
    try {
      await evidenceAPI.deleteEvidence(type, id);
      await fetchEvidences();
    } catch (err) {
      console.error('Failed to delete evidence:', err);
      setError('خطا در حذف مدرک');
    }
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <SkeletonList items={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="evidence-container">
          <header className="evidence-header page-header-lux">
            <div>
              <h1 className="gold-text">ثبت و بررسی مدارک {caseId ? ` — پرونده ${caseId}` : ''}</h1>
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
              {evidences.map((evidence) => {
                const bio = bioMap.get(evidence.id);
                const isBio = !!bio;
                const verified = bio?.is_verified;

                return (
                  <div key={evidence.id} className="evidence-card module-card-luxury">
                    <div className="evidence-card-header">
                      <span className="evidence-type-badge">{evidence.type_display}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {evidence.is_on_board && <span className="board-badge">روی تخته</span>}
                        {isBio && (
                          <span
                            style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              borderRadius: 999,
                              border: verified
                                ? '1px solid rgba(120,255,120,0.35)'
                                : '1px solid rgba(255,200,120,0.35)',
                              background: verified ? 'rgba(120,255,120,0.08)' : 'rgba(255,200,120,0.08)',
                              color: verified ? '#c7ffd1' : '#ffe1c2',
                            }}
                          >
                            {verified ? 'تایید شد' : 'در انتظار تایید'}
                          </span>
                        )}
                      </div>
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

                    {isBio && bio && (bio.medical_follow_up || bio.database_follow_up) && (
                      <div style={{ marginTop: 10, color: '#ddd', fontSize: 12, lineHeight: 1.8 }}>
                        {bio.medical_follow_up && (
                          <div>
                            <b>پیگیری پزشکی:</b> {bio.medical_follow_up}
                          </div>
                        )}
                        {bio.database_follow_up && (
                          <div>
                            <b>پیگیری بانک داده:</b> {bio.database_follow_up}
                          </div>
                        )}
                      </div>
                    )}

                    {evidence.images && evidence.images.length > 0 && (
                      <div className="evidence-images">
                        {evidence.images.map((img) => {
                          // Handle multiple types of potential paths from Django
                          let imgPath = img.image;
                          if (!imgPath) return null;
                          
                          // If it's a relative path like /evidence/images/..., prepend backend URL
                          // and optionally handle the /media/ prefix if it's missing but expected
                          let fullUrl = imgPath.startsWith('http') ? imgPath : `${BACKEND_URL}${imgPath}`;
                          
                          // Special check: if we updated MEDIA_ROOT to BASE_DIR, paths might look like /evidence/images/...
                          // but Django static serves them at /media/evidence/images/...
                          if (!fullUrl.includes('/media/') && !imgPath.startsWith('http')) {
                            fullUrl = `${BACKEND_URL}/media${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
                          }

                          return (
                            <img 
                              key={img.id} 
                              src={fullUrl} 
                              alt="Evidence" 
                              onClick={() => setSelectedImage(fullUrl)}
                              title="برای بزرگ‌نمایی کلیک کنید"
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Witness Media handling */}
                    {(evidence as any).media && (
                      <div className="evidence-media-item" style={{ marginTop: 10 }}>
                        <a 
                          href={(evidence as any).media.startsWith('http') ? (evidence as any).media : `${BACKEND_URL}${((evidence as any).media.includes('/media/') || (evidence as any).media.startsWith('http')) ? '' : '/media'}${(evidence as any).media.startsWith('/') ? '' : '/'}${(evidence as any).media}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-gold-outline"
                          style={{ display: 'block', textAlign: 'center', padding: '8px' }}
                        >
                          📎 دانلود فایل ضمیمه (صوت/ویدیو)
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                      <button
                        className="btn-gold-outline"
                        style={{ width: '100%' }}
                        onClick={() => navigate(`/investigation?case=${evidence.case}`)}
                      >
                        مشاهده در تخته
                      </button>

                      <button
                        className="btn-gold-outline"
                        style={{ width: '100%' }}
                        onClick={() => {
                          const type = evidence.type;
                          let path = '';
                          if (type === 'biological') path = `/evidence/edit/biological/${evidence.id}`;
                          else if (type === 'witness') path = `/evidence/edit/witness/${evidence.id}`;
                          else if (type === 'vehicle') path = `/evidence/edit/vehicle/${evidence.id}`;
                          else if (type === 'identification') path = `/evidence/edit/id-document/${evidence.id}`;
                          else if (type === 'other') path = `/evidence/edit/other/${evidence.id}`;
                          
                          if (path) navigate(`${path}?case=${evidence.case}`);
                        }}
                      >
                        ویرایش مدرک
                      </button>

                      {isForensicDoctor && isBio && bio && !bio.is_verified && (
                        <button
                          className="btn-gold-solid"
                          style={{ width: '100%', gridColumn: 'span 2' }}
                          onClick={() => openVerify(bio)}
                        >
                          تایید پزشکی این مدرک
                        </button>
                      )}

                      <button
                        className="btn-gold-outline"
                        style={{ width: '100%', gridColumn: 'span 2', borderColor: 'rgba(255, 90, 90, 0.5)', color: '#ffbaba' }}
                        onClick={() => handleDelete(evidence.type, evidence.id)}
                      >
                        حذف مدرک
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {verifyOpen && (
          <div
            onClick={closeVerify}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 999,
            }}
          >
            <div onClick={(e) => e.stopPropagation()} className="lux-card" style={{ width: 'min(720px, 100%)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <h3 className="gold-text" style={{ margin: 0 }}>
                  تایید مدرک زیستی
                </h3>
                <button className="btn-gold-outline" onClick={closeVerify}>
                  بستن
                </button>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ color: '#ddd', fontSize: 12 }}>پیگیری پزشکی</label>
                  <textarea
                    value={medicalFollowUp}
                    onChange={(e) => setMedicalFollowUp(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.22)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#ddd', fontSize: 12 }}>پیگیری بانک داده</label>
                  <textarea
                    value={databaseFollowUp}
                    onChange={(e) => setDatabaseFollowUp(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.22)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <button className="btn-gold-solid" onClick={submitVerify} disabled={verifyLoading}>
                  {verifyLoading ? 'در حال ارسال...' : 'ثبت تایید'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="image-preview-overlay"
            onClick={() => setSelectedImage(null)}
          >
            <div className="image-preview-container" onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="Large Preview" />
              <button className="close-preview" onClick={() => setSelectedImage(null)}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
