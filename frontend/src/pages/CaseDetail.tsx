import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseAPI } from '../services/caseApi';
import { evidenceAPI } from '../services/evidenceApi';
import { investigationAPI } from '../services/investigationApi';
import { useAuth } from '../context/AuthContext';
import type { Case } from '../types/case';
import type { Evidence } from '../types/evidence';
import type { Suspect, Verdict } from '../types/investigation';
import Sidebar from '../components/Sidebar';
import './CaseDetail.css';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedComplainants, setSelectedComplainants] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resubmitMode, setResubmitMode] = useState(false);
  const [resubmitData, setResubmitData] = useState({ title: '', description: '', crime_level: 3 });
  const [newComplainantId, setNewComplainantId] = useState('');
  const [addingComplainant, setAddingComplainant] = useState(false);

  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);

  // Verdict Form State
  const [verdictForm, setVerdictForm] = useState({
    suspect: '',
    title: '',
    result: 'GUILTY' as 'GUILTY' | 'INNOCENT',
    punishment: '',
    description: '',
  });

  const userRoles = user?.roles?.map(r => r.code) || [];

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch the main case data first. This MUST succeed.
      const caseResult = await caseAPI.getCase(Number(id));
      setCaseData(caseResult);
      setResubmitData({ 
        title: caseResult.title, 
        description: caseResult.description,
        crime_level: caseResult.crime_level
      });
      setSelectedComplainants(caseResult.complainants);

      // 2. Fetch supplementary data. These might fail based on permissions (e.g. for Trainees).
      const [evidenceResult, suspectResult, verdictResult] = await Promise.all([
        evidenceAPI.listAllEvidence(Number(id)).catch(() => []),
        investigationAPI.listSuspects(Number(id)).catch(() => []),
        investigationAPI.listVerdicts(Number(id)).catch(() => []),
      ]);

      setEvidences(evidenceResult);
      setSuspects(suspectResult);
      setVerdicts(verdictResult);
    } catch (err: any) {
      console.error('Error fetching case detail:', err);
      setError(err.response?.data?.detail || 'خطا در بارگذاری پرونده');
    } finally {
      setLoading(false);
    }
  };

  const handleTraineeReview = async (approved: boolean) => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.traineeReview(caseData.id, {
        approved,
        notes: reviewNotes,
        confirmed_complainants: selectedComplainants,
      });
      alert(approved ? 'پرونده تایید و به افسر ارسال شد' : 'پرونده رد شد');
      navigate('/cases');
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بررسی پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const handleOfficerReview = async (approved: boolean) => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.officerReview(caseData.id, {
        approved,
        notes: reviewNotes,
      });
      alert(approved ? 'پرونده فعال شد' : 'پرونده به کارآموز بازگردانده شد');
      navigate('/cases');
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بررسی پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResolution = async () => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.submitResolution(caseData.id);
      alert('پرونده برای بررسی گروهبان ارسال شد');
      fetchCase();
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در ارسال پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const handleSergeantReview = async (approved: boolean) => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.sergeantReview(caseData.id, {
        approved,
        notes: reviewNotes,
      });
      alert(approved ? 'پرونده تایید شد' : 'پرونده به کارآگاه بازگردانده شد');
      navigate('/cases');
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بررسی پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const handleChiefReview = async (approved: boolean) => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.chiefReview(caseData.id, {
        approved,
        notes: reviewNotes,
      });
      alert(approved ? 'پرونده مختومه شد' : 'پرونده به کارآگاه بازگردانده شد');
      navigate('/cases');
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بررسی پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !verdictForm.suspect) {
      alert('لطفاً متهم را انتخاب کنید');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      await investigationAPI.createVerdict({
        ...verdictForm,
        case: caseData.id,
        suspect: Number(verdictForm.suspect),
      });
      alert('حکم با موفقیت صادر شد');
      setVerdictForm({ suspect: '', title: '', result: 'GUILTY', punishment: '', description: '' });
      fetchCase();
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در صدور حکم');
    } finally {
      setProcessing(false);
    }
  };

  const handleResubmit = async () => {
    if (!caseData) return;
    setProcessing(true);
    setError('');
    try {
      await caseAPI.resubmitCase(caseData.id, {
        title: resubmitData.title,
        description: resubmitData.description,
        crime_level: resubmitData.crime_level,
      });
      alert('پرونده مجددا ارسال شد');
      setResubmitMode(false);
      fetchCase();
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در ارسال مجدد پرونده');
    } finally {
      setProcessing(false);
    }
  };

  const toggleComplainant = (userId: number) => {
    setSelectedComplainants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddComplainant = async () => {
    if (!caseData || !newComplainantId) return;
    setAddingComplainant(true);
    setError('');
    try {
      await caseAPI.addComplainant(caseData.id, newComplainantId);
      alert('شاکی با موفقیت اضافه شد');
      setNewComplainantId('');
      fetchCase();
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در افزودن شاکی');
    } finally {
      setAddingComplainant(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="case-detail-container">
            <p>در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="case-detail-container">
            <p>پرونده یافت نشد</p>
          </div>
        </div>
      </div>
    );
  }

  const isOfficerOrHigher = userRoles.some(r => ['police_officer', 'sergeant', 'detective', 'captain', 'police_chief'].includes(r));
  const isSergeantOrHigher = userRoles.some(r => ['sergeant', 'captain', 'police_chief'].includes(r));
  const isChief = userRoles.includes('police_chief');

  const canTraineeReview = userRoles.includes('trainee') && caseData.status === 'PT';
  const canOfficerReview = isOfficerOrHigher && caseData.status === 'PO';
  const canDetectiveSubmit = userRoles.includes('detective') && caseData.status === 'AC';
  const canSergeantReview = isSergeantOrHigher && caseData.status === 'PS';
  const canChiefReview = isChief && caseData.status === 'PC';

  const canJudgeVerdict = (userRoles.includes('judge') || userRoles.includes('qazi')) && caseData.status === 'SO';
  const canResubmit = caseData.creator === user?.id && caseData.status === 'RE';

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="case-detail-container">
          <div className="case-detail-header">
            <div>
              <h1>پرونده #{caseData.id}</h1>
              <span className={`status-badge status-${caseData.status}`}>
                {caseData.status_label}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/cases')}>
              بازگشت به لیست
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="case-info-grid">
            <div className="info-section">
              <h3>اطلاعات پرونده</h3>
              {resubmitMode ? (
                <>
                  <div className="form-group">
                    <label>عنوان</label>
                    <input
                      type="text"
                      value={resubmitData.title}
                      onChange={(e) => setResubmitData({ ...resubmitData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>توضیحات</label>
                    <textarea
                      value={resubmitData.description}
                      onChange={(e) => setResubmitData({ ...resubmitData, description: e.target.value })}
                      rows={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>سطح جرم</label>
                    <select
                      value={resubmitData.crime_level}
                      onChange={(e) => setResubmitData({ ...resubmitData, crime_level: Number(e.target.value) })}
                      className="form-control"
                    >
                      <option value={3}>سطح ۳ (جرائم خرد)</option>
                      <option value={2}>سطح ۲ (جرائم بزرگ)</option>
                      <option value={1}>سطح ۱ (جرائم کلان)</option>
                      <option value={0}>سطح بحرانی</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>عنوان:</strong> {caseData.title}</p>
                  <p><strong>توضیحات:</strong> {caseData.description}</p>
                  <p><strong>سطح جرم:</strong> {caseData.level_label}</p>
                </>
              )}
              <p><strong>تاریخ ثبت:</strong> {new Date(caseData.created_at).toLocaleDateString('fa-IR')}</p>
              {caseData.submission_attempts > 0 && (
                <p className="warning-text">
                  <strong>تعداد دفعات رد:</strong> {caseData.submission_attempts} از 3
                </p>
              )}
            </div>

            {caseData.scene_data && (
              <div className="info-section">
                <h3>اطلاعات صحنه جرم</h3>
                <p><strong>محل وقوع:</strong> {caseData.scene_data.location}</p>
                <p><strong>زمان وقوع:</strong> {new Date(caseData.scene_data.occurrence_time).toLocaleString('fa-IR')}</p>
                {caseData.scene_data.witnesses.length > 0 && (
                  <div>
                    <strong>شاهدان:</strong>
                    <ul>
                      {caseData.scene_data.witnesses.map((w, i) => (
                        <li key={i}>
                          {w.national_code} - {w.phone}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {caseData.review_notes && (
              <div className="info-section">
                <h3>یادداشت داور</h3>
                <p className="review-notes">{caseData.review_notes}</p>
              </div>
            )}

            {canTraineeReview && (
              <div className="info-section">
                <h3>تایید شاکیان</h3>
                {caseData.complainant_details?.map((detail) => (
                  <label key={detail.user} className="complainant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedComplainants.includes(detail.user)}
                      onChange={() => toggleComplainant(detail.user)}
                    />
                    {detail.first_name || detail.last_name 
                      ? `${detail.first_name} ${detail.last_name} (${detail.username})` 
                      : detail.username}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="case-lists-grid">
            <div className="info-section">
              <div className="section-header-row">
                <h3>لیست شواهد</h3>
                <button className="btn-gold-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => navigate(`/evidence/create?case=${caseData.id}`)}>ثبت جدید</button>
              </div>
              <div className="mini-list">
                {evidences.length > 0 ? evidences.map(e => (
                  <div 
                    key={e.id} 
                    className="mini-list-item" 
                    onClick={() => navigate(`/evidence?case=${caseData.id}`)}
                    style={{ cursor: 'pointer' }}
                    title="برای مشاهده جزئیات کلیک کنید"
                  >
                    <span>🔍 {e.title}</span>
                    <small>{e.type_display}</small>
                  </div>
                )) : <p className="no-data">شواهدی ثبت نشده است.</p>}
              </div>
            </div>

            <div className="info-section">
              <div className="section-header-row">
                <h3>لیست مظنونین</h3>
                <button className="btn-gold-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => navigate(`/suspects?case=${caseData.id}`)}>مدیریت</button>
              </div>
              <div className="mini-list">
                {suspects.length > 0 ? suspects.map(s => (
                  <div key={s.id} className="mini-list-item">
                    <span>👤 {s.first_name} {s.last_name}</span>
                    <small>{s.is_main_suspect ? 'متهم اصلی' : 'مظنون'}</small>
                  </div>
                )) : <p className="no-data">مظنونی ثبت نشده است.</p>}
              </div>
            </div>
          </div>

          {/* Add Complainant Section */}
          {(userRoles.includes('police_officer') || userRoles.includes('sergeant') || 
            userRoles.includes('police_chief') || user?.is_superuser) && (
            <div className="info-section">
              <h3>مدیریت شاکیان</h3>
              <p className="section-description">
                شاکیان فعلی: {caseData.complainant_details && caseData.complainant_details.length > 0 
                  ? caseData.complainant_details.map(d => d.first_name || d.last_name ? `${d.first_name} ${d.last_name}` : d.username).join('، ') 
                  : 'بدون شاکی'}
              </p>
              <div className="add-complainant-form">
                <input
                  type="text"
                  placeholder="نام کاربری یا کد ملی شاکی"
                  value={newComplainantId}
                  onChange={(e) => setNewComplainantId(e.target.value)}
                  className="complainant-input"
                />
                <button
                  className="btn-gold-solid"
                  onClick={handleAddComplainant}
                  disabled={addingComplainant || !newComplainantId}
                  style={{ padding: '12px 24px', borderRadius: '12px' }}
                >
                  {addingComplainant ? 'در حال افزودن...' : 'افزودن شاکی'}
                </button>
              </div>
            </div>
          )}

          {/* Review Actions */}
          {(canTraineeReview || canOfficerReview || canSergeantReview || canChiefReview) && (
            <div className="review-section">
              <h3>بررسی پرونده</h3>
              <div className="form-group">
                <label>یادداشت</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="یادداشت های خود را وارد کنید..."
                />
              </div>
              <div className="review-actions">
                {canTraineeReview && (
                  <>
                    <button
                      className="btn-gold-solid"
                      onClick={() => handleTraineeReview(true)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px' }}
                    >
                      تایید و ارسال به افسر
                    </button>
                    <button
                      className="btn-gold-outline"
                      onClick={() => handleTraineeReview(false)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                    >
                      رد کردن
                    </button>
                  </>
                )}
                {canOfficerReview && (
                  <>
                    <button
                      className="btn-gold-solid"
                      onClick={() => handleOfficerReview(true)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px' }}
                    >
                      تایید و فعال‌سازی
                    </button>
                    <button
                      className="btn-gold-outline"
                      onClick={() => handleOfficerReview(false)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                    >
                      بازگشت به کارآموز
                    </button>
                  </>
                )}
                {canSergeantReview && (
                  <>
                    <button
                      className="btn-gold-solid"
                      onClick={() => handleSergeantReview(true)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px' }}
                    >
                      تایید
                    </button>
                    <button
                      className="btn-gold-outline"
                      onClick={() => handleSergeantReview(false)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                    >
                      بازگشت به کارآگاه
                    </button>
                  </>
                )}
                {canChiefReview && (
                  <>
                    <button
                      className="btn-gold-solid"
                      onClick={() => handleChiefReview(true)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px' }}
                    >
                      تایید نهایی
                    </button>
                    <button
                      className="btn-gold-outline"
                      onClick={() => handleChiefReview(false)}
                      disabled={processing}
                      style={{ flex: 1, padding: '14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                    >
                      بازگشت به کارآگاه
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Judge's Verdict Section */}
          {(canJudgeVerdict || verdicts.length > 0) && (
            <div className="review-section">
              <h3 className="gold-text">احکام قضایی</h3>
              
              {verdicts.map((v) => (
                <div key={v.id} className="lux-card" style={{ marginBottom: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ color: 'var(--primary)' }}>{v.title}</h4>
                    <span className={`status-badge ${v.result === 'GUILTY' ? 'status-rejected' : 'status-active'}`}>
                      {v.result === 'GUILTY' ? 'گناهکار' : 'بی‌گناه'}
                    </span>
                  </div>
                  <p><strong>متهم:</strong> {suspects.find(s => s.id === v.suspect)?.name || 'نامعلوم'}</p>
                  <p><strong>قاضی:</strong> {v.judge_username}</p>
                  <p><strong>توضیحات:</strong> {v.description}</p>
                  {v.punishment && <p><strong>مجازات:</strong> {v.punishment}</p>}
                </div>
              ))}

              {canJudgeVerdict && suspects.some(s => !verdicts.some(v => v.suspect === s.id)) ? (
                <form onSubmit={handleCreateVerdict} className="verdict-form">
                  <div className="form-group">
                    <label>متهم</label>
                    <select 
                      value={verdictForm.suspect}
                      onChange={(e) => setVerdictForm({ ...verdictForm, suspect: e.target.value })}
                      required
                    >
                      <option value="">انتخاب متهم (فقط بدون حکم)...</option>
                      {suspects
                        .filter(s => !verdicts.some(v => v.suspect === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} {s.is_main_suspect ? '(متهم اصلی)' : ''}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="form-group">
                    <label>عنوان حکم</label>
                    <input 
                      type="text"
                      value={verdictForm.title}
                      onChange={(e) => setVerdictForm({ ...verdictForm, title: e.target.value })}
                      placeholder="مثلاً: حکم نهایی سرقت مسلحانه"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>رای نهایی</label>
                      <select 
                        value={verdictForm.result}
                        onChange={(e) => setVerdictForm({ ...verdictForm, result: e.target.value as any })}
                      >
                        <option value="GUILTY">گناهکار</option>
                        <option value="INNOCENT">بی‌گناه</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>توضیحات قاضی</label>
                    <textarea 
                      value={verdictForm.description}
                      onChange={(e) => setVerdictForm({ ...verdictForm, description: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  {verdictForm.result === 'GUILTY' && (
                    <div className="form-group">
                      <label>مجازات (در صورت گناهکار بودن)</label>
                      <textarea 
                        value={verdictForm.punishment}
                        onChange={(e) => setVerdictForm({ ...verdictForm, punishment: e.target.value })}
                        rows={2}
                        placeholder="میزان حبس، جریمه و ..."
                      />
                    </div>
                  )}

                  <button type="submit" className="btn-gold-solid" style={{ width: '100%', padding: '16px' }} disabled={processing}>
                    {processing ? 'در حال ثبت...' : 'ثبت حکم نهایی'}
                  </button>
                </form>
              ) : canJudgeVerdict && (
                <div className="info-card" style={{ marginTop: '20px', textAlign: 'center', borderColor: 'var(--primary)' }}>
                  <p className="gold-text">تمامی متهمین این پرونده دارای حکم نهایی هستند.</p>
                </div>
              )}
            </div>
          )}

          {canDetectiveSubmit && (
            <div className="review-section">
              <h3>ارسال برای بررسی</h3>
              <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>پرونده برای بررسی گروهبان ارسال شود؟</p>
              <button
                className="btn-gold-solid"
                onClick={handleSubmitResolution}
                disabled={processing}
                style={{ width: '100%', padding: '16px' }}
              >
                ارسال برای بررسی گروهبان
              </button>
            </div>
          )}

          {canResubmit && (
            <div className="review-section">
              <h3>ارسال مجدد پرونده</h3>
              <p className="warning-text">
                این پرونده رد شده است. می‌توانید اطلاعات را اصلاح کرده و مجددا ارسال کنید.
                {caseData.submission_attempts >= 2 && (
                  <strong> هشدار: یک شانس دیگر دارید، در غیر این صورت پرونده باطل می‌شود.</strong>
                )}
              </p>
              {!resubmitMode ? (
                <button
                  className="btn-gold-solid"
                  onClick={() => setResubmitMode(true)}
                  style={{ width: '100%', padding: '16px' }}
                >
                  ویرایش و ارسال مجدد
                </button>
              ) : (
                <div className="review-actions">
                  <button
                    className="btn-gold-solid"
                    onClick={handleResubmit}
                    disabled={processing}
                    style={{ flex: 1 }}
                  >
                    ارسال مجدد
                  </button>
                  <button
                    className="btn-gold-outline"
                    onClick={() => setResubmitMode(false)}
                    style={{ flex: 1 }}
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="case-actions">
            <button
              className="btn-gold-outline"
              onClick={() => navigate(`/evidence?case=${caseData.id}`)}
              style={{ flex: 1, padding: '14px' }}
            >
              مشاهده شواهد پرونده
            </button>
            <button
              className="btn-gold-outline"
              onClick={() => navigate(`/investigation?case=${caseData.id}`)}
              style={{ flex: 1, padding: '14px' }}
            >
              مشاهده تخته تحقیقات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
