import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseAPI } from '../services/caseApi';
import { useAuth } from '../context/AuthContext';
import type { Case } from '../types/case';
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
  const [resubmitData, setResubmitData] = useState({ title: '', description: '' });
  const [newComplainantId, setNewComplainantId] = useState('');
  const [addingComplainant, setAddingComplainant] = useState(false);

  const userRoles = user?.roles?.map(r => r.code) || [];

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      const data = await caseAPI.getCase(Number(id));
      setCaseData(data);
      setResubmitData({ title: data.title, description: data.description });
      setSelectedComplainants(data.complainants);
    } catch (err: any) {
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
      fetchCase();
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
      fetchCase();
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
      fetchCase();
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
      fetchCase();
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بررسی پرونده');
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
        crime_level: caseData.crime_level,
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
      await caseAPI.addComplainant(caseData.id, Number(newComplainantId));
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

  const canTraineeReview = userRoles.includes('trainee') && caseData.status === 'PT';
  const canOfficerReview = userRoles.includes('police_officer') && caseData.status === 'PO';
  const canDetectiveSubmit = userRoles.includes('detective') && caseData.status === 'AC';
  const canSergeantReview = userRoles.includes('sergeant') && caseData.status === 'PS';
  const canChiefReview = userRoles.includes('police_chief') && caseData.status === 'PC';
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
                </>
              ) : (
                <>
                  <p><strong>عنوان:</strong> {caseData.title}</p>
                  <p><strong>توضیحات:</strong> {caseData.description}</p>
                </>
              )}
              <p><strong>سطح جرم:</strong> {caseData.level_label}</p>
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
                <h3>شاکیان</h3>
                {caseData.complainants.map((userId) => (
                  <label key={userId} className="complainant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedComplainants.includes(userId)}
                      onChange={() => toggleComplainant(userId)}
                    />
                    کاربر {userId}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Add Complainant Section */}
          {(userRoles.includes('police_officer') || userRoles.includes('sergeant') || 
            userRoles.includes('police_chief') || user?.is_superuser) && (
            <div className="info-section">
              <h3>مدیریت شاکیان</h3>
              <p className="section-description">
                شاکیان فعلی: {caseData.complainants.length > 0 ? caseData.complainants.join(', ') : 'بدون شاکی'}
              </p>
              <div className="add-complainant-form">
                <input
                  type="number"
                  placeholder="شناسه کاربری شاکی"
                  value={newComplainantId}
                  onChange={(e) => setNewComplainantId(e.target.value)}
                  className="complainant-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddComplainant}
                  disabled={addingComplainant || !newComplainantId}
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
                      className="btn btn-success"
                      onClick={() => handleTraineeReview(true)}
                      disabled={processing}
                    >
                      تایید و ارسال به افسر
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleTraineeReview(false)}
                      disabled={processing}
                    >
                      رد کردن
                    </button>
                  </>
                )}
                {canOfficerReview && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleOfficerReview(true)}
                      disabled={processing}
                    >
                      تایید و فعال‌سازی
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleOfficerReview(false)}
                      disabled={processing}
                    >
                      بازگشت به کارآموز
                    </button>
                  </>
                )}
                {canSergeantReview && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleSergeantReview(true)}
                      disabled={processing}
                    >
                      تایید
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleSergeantReview(false)}
                      disabled={processing}
                    >
                      بازگشت به کارآگاه
                    </button>
                  </>
                )}
                {canChiefReview && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleChiefReview(true)}
                      disabled={processing}
                    >
                      تایید نهایی
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleChiefReview(false)}
                      disabled={processing}
                    >
                      بازگشت به کارآگاه
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {canDetectiveSubmit && (
            <div className="review-section">
              <h3>ارسال برای بررسی</h3>
              <p>پرونده برای بررسی گروهبان ارسال شود؟</p>
              <button
                className="btn btn-primary"
                onClick={handleSubmitResolution}
                disabled={processing}
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
                  className="btn btn-warning"
                  onClick={() => setResubmitMode(true)}
                >
                  ویرایش و ارسال مجدد
                </button>
              ) : (
                <div className="review-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleResubmit}
                    disabled={processing}
                  >
                    ارسال مجدد
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setResubmitMode(false)}
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="case-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/evidence?case=${caseData.id}`)}
            >
              مشاهده شواهد پرونده
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/investigation?case=${caseData.id}`)}
            >
              مشاهده تخته تحقیقات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
