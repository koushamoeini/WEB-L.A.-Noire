import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investigationAPI } from '../../../services/investigationApi';
import { caseAPI } from '../../../services/caseApi';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/Sidebar';
import { SkeletonCard } from '../../../components/Skeleton';
import type { Verdict } from '../../../types/investigation';
import '../../cases/detail/CaseDetail.css';

export default function BailPayment() {
  const { verdictId } = useParams<{ verdictId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [suspect, setSuspect] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form for setting bail/fine amounts
  const [bailAmount, setBailAmount] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [showSetAmountForm, setShowSetAmountForm] = useState(false);

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isJudge = userRoles.includes('judge') || userRoles.includes('qazi');
  const isSergeant = userRoles.includes('sergeant');
  const canSetAmounts = isJudge || isSergeant;

  useEffect(() => {
    fetchData();
  }, [verdictId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const verdictRes = await investigationAPI.getVerdict(Number(verdictId));
      setVerdict(verdictRes);

      // Fetch case and suspect details
      const [caseRes, suspectRes] = await Promise.all([
        caseAPI.getCase(verdictRes.case),
        investigationAPI.getSuspect(verdictRes.suspect)
      ]);
      setCaseData(caseRes);
      setSuspect(suspectRes);

      // Set initial form values if already set
      if (verdictRes.bail_amount) setBailAmount(verdictRes.bail_amount.toString());
      if (verdictRes.fine_amount) setFineAmount(verdictRes.fine_amount.toString());
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBailFine = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      if (!verdict) return;

      const payload: { bail_amount?: number; fine_amount?: number } = {};
      if (verdict.is_eligible_for_bail && !verdict.bail_paid) {
        payload.bail_amount = Number(bailAmount) || 0;
      }
      if (!verdict.fine_paid) {
        payload.fine_amount = Number(fineAmount) || 0;
      }

      if (Object.keys(payload).length === 0) {
        setError('پس از پرداخت، مبلغ قابل ویرایش نیست.');
        return;
      }

      await investigationAPI.setBailFine(Number(verdictId), payload);
      setSuccess('مبالغ وثیقه و جریمه با موفقیت تنظیم شد');
      setShowSetAmountForm(false);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در تنظیم مبالغ');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayBail = () => {
    const url = investigationAPI.requestBailPayment(Number(verdictId));
    window.open(url, '_blank', 'width=700,height=800');
    // Refresh data after a delay to check payment status
    setTimeout(() => fetchData(), 2000);
  };

  const handlePayFine = () => {
    const url = investigationAPI.requestFinePayment(Number(verdictId));
    window.open(url, '_blank', 'width=700,height=800');
    // Refresh data after a delay to check payment status
    setTimeout(() => fetchData(), 2000);
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <SkeletonCard count={1} />
        </div>
      </div>
    );
  }

  if (!verdict || !caseData || !suspect) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <p>اطلاعات یافت نشد</p>
        </div>
      </div>
    );
  }

  const canPayBail = verdict.bail_amount && !verdict.bail_paid && verdict.is_eligible_for_bail;
  const canPayFine = verdict.fine_amount && !verdict.fine_paid;
  const canEditBailAmount = verdict.is_eligible_for_bail && !verdict.bail_paid;
  const canEditFineAmount = !verdict.fine_paid;
  const canEditAnyAmount = canEditBailAmount || canEditFineAmount;

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="case-detail-container">
          <div className="case-detail-header">
            <h1 className="gold-text">💰 مدیریت وثیقه و جریمه</h1>
            <button 
              className="btn-gold-outline" 
              onClick={() => navigate(`/cases/${caseData.id}`)}
            >
              بازگشت به پرونده
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              padding: '15px', 
              background: '#d1fae5', 
              border: '1px solid #10b981', 
              borderRadius: '8px', 
              color: '#065f46',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          {/* Verdict Information */}
          <div className="lux-card" style={{ marginBottom: '25px' }}>
            <h3 className="gold-text">اطلاعات حکم</h3>
            <div style={{ display: 'grid', gap: '12px', marginTop: '15px' }}>
              <p><strong>عنوان حکم:</strong> {verdict.title}</p>
              <p><strong>متهم:</strong> {suspect.first_name} {suspect.last_name}</p>
              <p><strong>کد ملی متهم:</strong> {suspect.national_code || 'ثبت نشده'}</p>
              <p><strong>پرونده:</strong> {caseData.title}</p>
              <p><strong>قاضی:</strong> {verdict.judge_username}</p>
              <p>
                <strong>نتیجه:</strong>{' '}
                <span className={`status-badge ${verdict.result === 'GUILTY' ? 'status-rejected' : 'status-active'}`}>
                  {verdict.result === 'GUILTY' ? 'گناهکار' : 'بی‌گناه'}
                </span>
              </p>
              {verdict.punishment && <p><strong>مجازات:</strong> {verdict.punishment}</p>}
              <p>
                <strong>واجد شرایط وثیقه:</strong>{' '}
                {verdict.is_eligible_for_bail ? (
                  <span style={{ color: '#10b981' }}>✓ بله (جرم سطح {verdict.case_crime_level})</span>
                ) : (
                  <span style={{ color: '#ef4444' }}>✗ خیر (جرم سطح {verdict.case_crime_level})</span>
                )}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          {(verdict.bail_amount || verdict.fine_amount) && (
            <div className="lux-card" style={{ marginBottom: '25px' }}>
              <h3 className="gold-text">وضعیت پرداخت</h3>
              <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                {verdict.bail_amount && (
                  <div style={{ 
                    padding: '15px', 
                    background: verdict.bail_paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${verdict.bail_paid ? '#10b981' : '#ef4444'}`
                  }}>
                    <h4 style={{ marginBottom: '10px' }}>وثیقه</h4>
                    <p><strong>مبلغ:</strong> {verdict.bail_amount.toLocaleString('fa-IR')} تومان</p>
                    <p>
                      <strong>وضعیت:</strong>{' '}
                      {verdict.bail_paid ? (
                        <span style={{ color: '#10b981' }}>✓ پرداخت شده</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>✗ پرداخت نشده</span>
                      )}
                    </p>
                    {verdict.bail_tracking_code && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        کد رهگیری: {verdict.bail_tracking_code}
                      </p>
                    )}
                    {verdict.bail_paid_at && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        تاریخ پرداخت: {new Date(verdict.bail_paid_at).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                )}

                {verdict.fine_amount && (
                  <div style={{ 
                    padding: '15px', 
                    background: verdict.fine_paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${verdict.fine_paid ? '#10b981' : '#ef4444'}`
                  }}>
                    <h4 style={{ marginBottom: '10px' }}>جریمه</h4>
                    <p><strong>مبلغ:</strong> {verdict.fine_amount.toLocaleString('fa-IR')} تومان</p>
                    <p>
                      <strong>وضعیت:</strong>{' '}
                      {verdict.fine_paid ? (
                        <span style={{ color: '#10b981' }}>✓ پرداخت شده</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>✗ پرداخت نشده</span>
                      )}
                    </p>
                    {verdict.fine_tracking_code && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        کد رهگیری: {verdict.fine_tracking_code}
                      </p>
                    )}
                    {verdict.fine_paid_at && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        تاریخ پرداخت: {new Date(verdict.fine_paid_at).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Set Amounts (Judge/Sergeant Only) */}
          {canSetAmounts && (
            <div className="lux-card" style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 className="gold-text">تنظیم مبالغ</h3>
                <button 
                  className="btn-gold-outline"
                  onClick={() => setShowSetAmountForm(!showSetAmountForm)}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  disabled={!canEditAnyAmount}
                >
                  {!canEditAnyAmount ? 'قفل شده' : showSetAmountForm ? 'بستن' : 'ویرایش مبالغ'}
                </button>
              </div>

              {!canEditAnyAmount && (
                <p style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  پس از پرداخت، مبلغ وثیقه/جریمه قابل تغییر نیست.
                </p>
              )}

              {showSetAmountForm && (
                <form onSubmit={handleSetBailFine} style={{ marginTop: '15px' }}>
                  {verdict.is_eligible_for_bail && (
                    <div className="form-group">
                      <label>مبلغ وثیقه (تومان)</label>
                      <input 
                        type="number"
                        value={bailAmount}
                        onChange={(e) => setBailAmount(e.target.value)}
                        placeholder="مثلاً: 50000000"
                        min="0"
                        className="lux-input"
                        disabled={!canEditBailAmount}
                      />
                      <small style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        فقط برای جرائم سطح 2 و 3 {verdict.bail_paid ? '(پرداخت شده و قفل است)' : ''}
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>مبلغ جریمه (تومان)</label>
                    <input 
                      type="number"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(e.target.value)}
                      placeholder="مثلاً: 10000000"
                      min="0"
                      className="lux-input"
                      disabled={!canEditFineAmount}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-gold-solid" 
                    style={{ width: '100%', padding: '12px' }}
                    disabled={processing || !canEditAnyAmount}
                  >
                    {processing ? 'در حال ثبت...' : 'ثبت مبالغ'}
                  </button>
                </form>
              )}

              {!showSetAmountForm && (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  شما می‌توانید مبالغ وثیقه و جریمه را برای این حکم تنظیم کنید.
                </p>
              )}
            </div>
          )}

          {/* Payment Actions */}
          {(canPayBail || canPayFine) && (
            <div className="lux-card">
              <h3 className="gold-text">پرداخت آنلاین</h3>
              <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>
                با استفاده از درگاه‌های پرداخت اینترنتی، می‌توانید وثیقه یا جریمه خود را پرداخت کنید.
              </p>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {canPayBail && (
                  <button 
                    className="btn-gold-solid" 
                    onClick={handlePayBail}
                    style={{ flex: '1', minWidth: '200px', padding: '15px' }}
                  >
                    💳 پرداخت وثیقه ({verdict.bail_amount?.toLocaleString('fa-IR')} تومان)
                  </button>
                )}

                {canPayFine && (
                  <button 
                    className="btn-gold-solid" 
                    onClick={handlePayFine}
                    style={{ flex: '1', minWidth: '200px', padding: '15px' }}
                  >
                    💳 پرداخت جریمه ({verdict.fine_amount?.toLocaleString('fa-IR')} تومان)
                  </button>
                )}
              </div>

              <div style={{ 
                marginTop: '20px', 
                padding: '12px', 
                background: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#856404'
              }}>
                ⚠️ <strong>توجه:</strong> پس از کلیک بر روی دکمه پرداخت، به درگاه پرداخت آزمایشی منتقل می‌شوید.
                در این محیط می‌توانید پرداخت موفق یا ناموفق را شبیه‌سازی کنید.
              </div>
            </div>
          )}

          {/* No Payment Needed */}
          {!canSetAmounts && !canPayBail && !canPayFine && (verdict.bail_paid || verdict.fine_paid || (!verdict.bail_amount && !verdict.fine_amount)) && (
            <div className="lux-card">
              <h3 className="gold-text">وضعیت</h3>
              {verdict.bail_paid && verdict.fine_paid && (
                <p style={{ color: '#10b981' }}>✓ تمام پرداخت‌ها انجام شده است.</p>
              )}
              {!verdict.bail_amount && !verdict.fine_amount && (
                <p style={{ color: 'var(--text-dim)' }}>
                  هنوز مبالغ وثیقه یا جریمه برای این حکم تعیین نشده است.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
