import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { investigationAPI } from '../services/investigationApi';
import { caseAPI } from '../services/caseApi';
import './Ranking.css';

interface MostWantedSuspect {
  national_code: string;
  full_name: string;
  suspect_ids: number[];
  case_ids: number[];
  image: string | null;
  max_pursuit_days: number;
  max_crime_level: number;
  score: number;
  reward_amount: number;
}

interface RewardReport {
  id: number;
  reporter_name: string;
  reporter_national_code?: string;
  description: string;
  status: string;
  status_display: string;
  reward_amount: number | null;
  reward_code: string | null;
  tracking_code: string | null;
  officer_notes?: string;
  detective_notes?: string;
  created_at: string;
}

const Ranking = () => {
  const { user } = useAuth();
  const [mostWanted, setMostWanted] = useState<MostWantedSuspect[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reporting (Citizen)
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<MostWantedSuspect | null>(null);
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // My Rewards (All users)
  const [showMyRewardsModal, setShowMyRewardsModal] = useState(false);
  const [myApprovedReports, setMyApprovedReports] = useState<RewardReport[]>([]);

  // Reviewing (Police) - Changed to map to isolate notes per report
  const [showReportsListModal, setShowReportsListModal] = useState(false);
  const [sightingReports, setSightingReports] = useState<RewardReport[]>([]);
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<number, string>>({});

  // Verification (Any Police)
  const [showVerifySection, setShowVerifySection] = useState(false);
  const [vNationalCode, setVNationalCode] = useState('');
  const [vRewardCode, setVRewardCode] = useState('');
  const [vResult, setVResult] = useState<any>(null);
  const [vLoading, setVLoading] = useState(false);

  // Case Summary Reports (High Rank Only)
  const [showCaseReports, setShowCaseReports] = useState(false);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [selectedCaseReport, setSelectedCaseReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isHighRank = userRoles.some(r => ['captain', 'police_chief', 'judge', 'qazi'].includes(r));
  const isPolice = userRoles.some(r => ['trainee', 'police_officer', 'detective', 'sergeant', 'captain', 'police_chief', 'judge', 'qazi'].includes(r));
  const isOfficer = userRoles.includes('police_officer') || userRoles.includes('captain') || userRoles.includes('police_chief') || userRoles.includes('sergeant');
  const isDetective = userRoles.includes('detective');

  useEffect(() => {
    fetchMostWanted();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleOpenMyRewards = async () => {
    try {
      const data = await investigationAPI.listRewardReports();
      // Filter only approved ones (Status code 'AP' from backend)
      const approved = data.filter((r: RewardReport) => r.status === 'AP');
      setMyApprovedReports(approved);
      setShowMyRewardsModal(true);
    } catch (err: any) {
      showToast('خطا در دریافت لیست پاداش‌ها', 'error');
    }
  };

  const handleOpenCaseReports = async () => {
    try {
      setLoading(true);
      const data = await caseAPI.listCases();
      setAllCases(data);
      setShowCaseReports(!showCaseReports);
    } catch (err: any) {
      showToast('خطا در دریافت لیست پرونده‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFullCaseReport = async (caseId: number) => {
    try {
      setReportLoading(true);
      const data = await caseAPI.getTrialHistory(caseId);
      setSelectedCaseReport(data);
    } catch (err: any) {
      showToast('خطا در دریافت جزئیات گزارش', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchMostWanted = async () => {
    try {
      setLoading(true);
      const data = await investigationAPI.listMostWanted();
      setMostWanted(data);
    } catch (error) {
      console.error('Failed to fetch most wanted:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (s: MostWantedSuspect) => {
    setSelectedSuspect(s);
    setShowReportModal(true);
  };

  const handleOpenReportsList = async (s: MostWantedSuspect) => {
    setSelectedSuspect(s);
    try {
      const data = await investigationAPI.listRewardReports(s.national_code || '');
      setSightingReports(data);
      setShowReportsListModal(true);
    } catch (err: any) {
      console.error('List reports error:', err);
      showToast('خطا در دریافت لیست گزارش‌ها. لطفاً دوباره تلاش کنید.', 'error');
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedSuspect || !reportText.trim()) return;
    try {
      setSubmitting(true);
      await investigationAPI.createRewardReport({
        suspect_full_name: selectedSuspect.full_name,
        suspect_national_code: selectedSuspect.national_code,
        description: reportText,
      });
      showToast('گزارش شما با موفقیت ثبت شد و پس از بررسی پاداش آن محاسبه خواهد شد.', 'success');
      setShowReportModal(false);
      setReportText('');
    } catch (error) {
      showToast('خطا در ثبت گزارش', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (reportId: number, approved: boolean, role: 'officer' | 'detective') => {
    try {
      const currentNotes = reviewNotesMap[reportId] || '';
      if (role === 'officer') {
        await investigationAPI.reviewRewardReportOfficer(reportId, approved, currentNotes);
      } else {
        await investigationAPI.reviewRewardReportDetective(reportId, approved, currentNotes);
      }
      showToast('عملیات با موفقیت انجام شد', 'success');
      if (selectedSuspect) {
        const data = await investigationAPI.listRewardReports(selectedSuspect.national_code || '');
        setSightingReports(data);
      }
      
      // Clear notes after action
      setReviewNotesMap(prev => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    } catch (err) {
      showToast('خطا در انجام عملیات', 'error');
    }
  };

  const handleRunVerification = async () => {
    if (!vNationalCode || !vRewardCode) return;
    try {
      setVLoading(true);
      setVResult(null);
      const res = await investigationAPI.verifyRewardPayout(vNationalCode, vRewardCode);
      setVResult(res);
      showToast('استعلام با موفقیت انجام شد.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'مشخصات وارد شده معتبر نیست', 'error');
    } finally {
      setVLoading(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        {/* Toast Notifier */}
        {toast && (
          <div className={`lux-toast ${toast.type}`}>
            <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
            {toast.message}
          </div>
        )}
        
        <div className="ranking-content">
          <header className="ranking-header" style={{ flexDirection: 'column', textAlign: 'center' }}>
            <h1 className="gold-text">لیست سیاه و تحت پیگیری شدید</h1>
            <p className="welcome-text">اطلاعات هر شخص در این لیست شامل پاداش نقدی سنگین است.</p>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                className="btn-gold-solid" 
                style={{ marginTop: '15px' }}
                onClick={handleOpenMyRewards}
              >
                📜 گزارش‌های تایید شده من
              </button>

              {isPolice && (
                <button 
                  className="btn-gold-outline" 
                  style={{ marginTop: '15px' }}
                  onClick={() => {
                    setShowVerifySection(!showVerifySection);
                    setShowCaseReports(false);
                  }}
                >
                  {showVerifySection ? 'بستن پنل استعلام' : '🛡️ پنل استعلام پاداش'}
                </button>
              )}

              {isHighRank && (
                <button 
                  className="btn-gold-outline" 
                  style={{ marginTop: '15px', borderColor: '#bd93f9', color: '#bd93f9' }}
                  onClick={() => {
                    handleOpenCaseReports();
                    setShowVerifySection(false);
                  }}
                >
                  {showCaseReports ? 'بستن پنل گزارشات' : '📊 پنل گزارش جامع پرونده‌ها'}
                </button>
              )}
            </div>
          </header>

          {showVerifySection && (
            <div className="verification-panel" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-gold)', marginBottom: '30px' }}>
              <h3 className="gold-text">استعلام و تایید واریز مژدگانی</h3>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <input 
                  className="lux-input" 
                  placeholder="کد ملی شهروند" 
                  value={vNationalCode}
                  onChange={e => setVNationalCode(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input 
                  className="lux-input" 
                  placeholder="کد پاداش ۶ رقمی" 
                  value={vRewardCode}
                  onChange={e => setVRewardCode(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn-gold-solid" onClick={handleRunVerification} disabled={vLoading}>
                  {vLoading ? '...' : 'استعلام'}
                </button>
              </div>

              {vResult && (
                <div className="verification-result" style={{ marginTop: '20px', padding: '20px', background: 'rgba(212,175,55,0.08)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <p style={{ margin: '5px 0' }}>👤 <strong>نام شهروند:</strong> {vResult.reporter_name}</p>
                      <p style={{ margin: '5px 0' }}>🆔 <strong>کد ملی:</strong> {vResult.reporter_national_code}</p>
                      <p style={{ margin: '5px 0' }}>📂 <strong>نام کاربری:</strong> {vResult.reporter_username}</p>
                      <p style={{ margin: '5px 0' }}>📞 <strong>شماره تماس:</strong> {vResult.reporter_phone}</p>
                    </div>
                    <div>
                      <p style={{ margin: '5px 0' }}>🎯 <strong>مربوط به متهم:</strong> {vResult.suspect_info}</p>
                      <p style={{ margin: '5px 0' }}>💰 <strong>مبلغ پاداش:</strong> <span style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 'bold' }}>{vResult.reward_amount.toLocaleString()} ریال</span></p>
                      <p style={{ margin: '5px 0' }}>📅 <strong>تاریخ ثبت:</strong> {vResult.report_date}</p>
                      {vResult.is_paid ? (
                        <div style={{ color: '#4ade80', fontWeight: 'bold', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '1.2rem' }}>💰</span> این پاداش پرداخت شده است.
                        </div>
                      ) : (
                        <div style={{ color: '#fb923c', fontWeight: 'bold', marginTop: '10px' }}>⚠️ آماده پرداخت (تایید شده)</div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'var(--accent-gold)', marginBottom: '10px' }}>📜 محتوای گزارش ارسالی شهروند:</h4>
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{vResult.description}</p>
                    
                    {(vResult.officer_notes || vResult.detective_notes) && (
                      <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                        {vResult.officer_notes && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>👮 یادداشت افسر: {vResult.officer_notes}</p>}
                        {vResult.detective_notes && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🕵️ یادداشت کارآگاه: {vResult.detective_notes}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {showCaseReports && (
            <div className="verification-panel" style={{ background: '#0a0a0a', padding: '30px', borderRadius: '15px', border: '1px solid #bd93f9', marginBottom: '30px', boxShadow: '0 0 40px rgba(189, 147, 249, 0.1)' }}>
              <h2 style={{ color: '#bd93f9' }}>📊 داشبورد مدیریت و گزارشات جامع قضایی</h2>
              <p style={{ color: '#888', marginBottom: '20px' }}>این پنل مخصوص مقامات قضایی و فرماندهان ارشد جهت نظارت کامل بر روند پرونده‌هاست.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
                {/* List of Cases */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '15px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '15px' }}>انتخاب پرونده:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                    {allCases.map(c => (
                      <button 
                        key={c.id} 
                        className={`case-select-item ${selectedCaseReport?.case?.id === c.id ? 'active' : ''}`}
                        onClick={() => fetchFullCaseReport(c.id)}
                        style={{
                          textAlign: 'right', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                          background: selectedCaseReport?.case?.id === c.id ? 'rgba(189, 147, 249, 0.1)' : 'rgba(255,255,255,0.02)',
                          color: '#fff', cursor: 'pointer', transition: '0.3s'
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{c.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>شناسه: #{c.id} | {c.status_label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Content */}
                <div style={{ minHeight: '400px' }}>
                  {reportLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#bd93f9' }}>در حال استخراج و تحلیل داده‌های امنیتی...</div>
                  ) : selectedCaseReport ? (
                    <div className="professional-report" style={{ color: '#eee', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px' }}>
                      <header style={{ borderBottom: '2px solid #bd93f9', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2 style={{ margin: 0, color: '#fff' }}>گزارش جامع پرونده: {selectedCaseReport.case.title}</h2>
                          <span style={{ color: '#bd93f9' }}>شماره کلاسه: {selectedCaseReport.case.id}</span>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div>تاریخ تشکیل: {new Date(selectedCaseReport.case.created_at).toLocaleDateString('fa-IR')}</div>
                          <div style={{ color: '#bd93f9' }}>وضعیت: {selectedCaseReport.case.status_label}</div>
                        </div>
                      </header>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        {/* Section 1: Involved People */}
                        <section style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                          <h4 style={{ color: '#bd93f9', borderBottom: '1px solid rgba(189, 147, 249, 0.3)', paddingBottom: '5px' }}>👥 افراد دخیل در پرونده</h4>
                          <div style={{ marginTop: '10px' }}>
                            <p><strong>شاکیان:</strong> {selectedCaseReport.complainants?.length > 0 ? selectedCaseReport.complainants.map((cp:any) => `${cp.first_name} ${cp.last_name}`).join('، ') : 'نامشخص'}</p>
                            <p style={{ marginTop: '10px' }}><strong>تیم امنیتی و تحقیقاتی:</strong></p>
                            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
                              {selectedCaseReport.officers_involved?.map((off:any, idx:number) => (
                                <li key={idx} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  🛡️ {off.full_name} ({off.roles.join(', ')})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        {/* Section 2: Witnesses & Evidence */}
                        <section style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                          <h4 style={{ color: '#bd93f9', borderBottom: '1px solid rgba(189, 147, 249, 0.3)', paddingBottom: '5px' }}>🔍 شواهد و شاهدان</h4>
                          <div style={{ marginTop: '10px' }}>
                            <p><strong>شاهدین صحنه:</strong> {selectedCaseReport.witnesses?.length > 0 ? selectedCaseReport.witnesses.map((w:any) => w.national_code).join('، ') : 'بدون شاهد'}</p>
                            <div style={{ marginTop: '10px' }}>
                              <strong>مدارک ثبت شده:</strong>
                              <ul style={{ fontSize: '0.9rem', color: '#bbb' }}>
                                {selectedCaseReport.evidence?.map((e:any, idx:number) => (
                                  <li key={idx}>[{e.type_display}] {e.description.substring(0, 50)}...</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </section>

                        {/* Section 3: Suspects & Criminals */}
                        <section style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', gridColumn: 'span 2' }}>
                          <h4 style={{ color: '#bd93f9', borderBottom: '1px solid rgba(189, 147, 249, 0.3)', paddingBottom: '5px' }}>⚖️ وضعیت مظنونین و احکام نهایی</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
                            {selectedCaseReport.suspects?.map((s:any) => (
                              <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '5px' }}>
                                <strong>👤 {s.first_name} {s.last_name}</strong>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                  وضعیت: {s.status_label}<br/>
                                  {selectedCaseReport.verdicts?.find((v:any) => v.suspect === s.id) ? (
                                    <span style={{ color: '#f87171' }}>🏮 مجرم (حکم صادر شده)</span>
                                  ) : (
                                    <span style={{ color: '#4ade80' }}>تحت بازجویی</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed rgba(189, 147, 249, 0.5)', borderRadius: '8px', fontSize: '0.9rem' }}>
                        🏁 <strong>خلاصه اجرایی:</strong> {selectedCaseReport.case.description}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#555' }}>جهت مشاهده گزارش کامل، یک پرونده را از لیست سمت راست انتخاب کنید.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="ranking-board">
            {loading ? (
              <div className="no-data-pursuit">
                <div className="loading-flicker">در حال استعلام موارد فراری از مرکز سرور...</div>
              </div>
            ) : mostWanted.length === 0 ? (
              <div className="no-data-pursuit">
                <h2>موردی در لیست سیاه یافت نشد</h2>
                <p>مظنونانی که بیش از یک ماه (۳۰ روز) متواری باشند در این لیست قرار می‌گیرند.</p>
              </div>
            ) : (
              <div className="wanted-grid">
                {mostWanted.map((s, index) => (
                  <div 
                    key={index}
                    className="most-wanted-card"
                  >
                    <div className="tag-intensive">UNDER INTENSIVE PURSUIT</div>
                    <div className="wanted-image-container">
                      {s.image ? (
                        <img src={`http://localhost:8000${s.image}`} alt={s.full_name} className="wanted-image" />
                      ) : (
                        <span className="wanted-placeholder">👤</span>
                      )}
                    </div>
                    <div className="wanted-info">
                      <h3 className="wanted-name">{s.full_name}</h3>
                      <div className="wanted-score">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>امتیاز پیگیری: </span>
                        {s.score}
                      </div>
                      <div className="wanted-details">
                        <strong>مدت فرار:</strong> {s.max_pursuit_days} روز<br />
                        <strong>بالاترین سطح جرم:</strong> {s.max_crime_level}<br />
                        <strong>کد ملی:</strong> {s.national_code || 'نامعلوم'}
                      </div>
                      <div className="wanted-meta" style={{ marginTop: '5px' }}>
                        <span className="reward-badge">💰 پاداش: {s.reward_amount.toLocaleString()} ریال</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        <button 
                          className="btn-gold-solid" 
                          style={{ width: '100%', padding: '10px' }}
                          onClick={() => handleOpenReport(s)}
                        >
                          ارسال اطلاعات و دریافت مژدگانی
                        </button>

                        {isPolice && (
                          <button 
                            className="btn-gold-outline" 
                            style={{ width: '100%', padding: '10px' }}
                            onClick={() => handleOpenReportsList(s)}
                          >
                            👁️ مشاهده گزارش‌های کاربران
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && selectedSuspect && (
        <div className="lux-modal-overlay">
          <div className="lux-modal-content" style={{ maxWidth: '500px' }}>
            <h3 className="gold-text">ارسال اطلاعات در مورد {selectedSuspect.full_name}</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
              لطفاً هرگونه اطلاعاتی از مخفیگاه یا فعالیت‌های اخیر این شخص دارید بنویسید. 
              پس از تایید توسط پلیس، پاداش نقدی به حساب شما واریز خواهد شد.
            </p>
            <textarea 
              className="lux-textarea"
              rows={5}
              placeholder="شرح اطلاعات..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              style={{ width: '100%', marginBottom: '20px', padding: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-gold-solid" 
                style={{ flex: 1 }}
                onClick={handleSubmitReport}
                disabled={submitting}
              >
                {submitting ? 'در حال ارسال...' : 'ثبت گزارش'}
              </button>
              <button 
                className="btn-gold-outline" 
                style={{ flex: 1 }}
                onClick={() => setShowReportModal(false)}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportsListModal && selectedSuspect && (
        <div className="lux-modal-overlay">
          <div className="lux-modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="gold-text">گزارش‌های متهم: {selectedSuspect.full_name}</h2>
              <button onClick={() => setShowReportsListModal(false)} className="btn-gold-outline" style={{ padding: '5px 15px' }}>بستن</button>
            </div>

            <div className="reports-list-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {sightingReports.length === 0 ? (
                <p>هیچ گزارشی برای این متهم ثبت نشده است.</p>
              ) : (
                sightingReports.map(report => (
                  <div key={report.id} className="report-item-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>📝 گزارشگر: {report.reporter_name}</strong>
                      <span className={`status-badge ${report.status}`} style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                        {report.status_display}
                      </span>
                    </div>
                    <p style={{ margin: '15px 0', fontSize: '0.95rem' }}>{report.description}</p>
                    
                    {report.reward_code && (
                      <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '4px', color: '#4ade80', marginBottom: '15px' }}>
                        💳 کد پاداش ۶ رقمی: <strong>{report.reward_code}</strong>
                        <br/>
                        💰 مبلغ تایید شده: {report.reward_amount?.toLocaleString()} ریال
                      </div>
                    )}

                    <div style={{ marginTop: '10px' }}>
                      {/* Show existing notes if any */}
                      {report.officer_notes && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                          👮 یادداشت افسر: {report.officer_notes}
                        </div>
                      )}
                      {report.detective_notes && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>
                          🕵️ یادداشت کارآگاه: {report.detective_notes}
                        </div>
                      )}

                      {/* Display textarea only if status is pending for that role */}
                      {((isOfficer && report.status === 'PO') || (isDetective && report.status === 'PD')) && (
                        <textarea 
                          className="lux-textarea"
                          placeholder="دلیل تایید یا رد..."
                          value={reviewNotesMap[report.id] || ''}
                          onChange={e => setReviewNotesMap({ ...reviewNotesMap, [report.id]: e.target.value })}
                          style={{ width: '100%', marginBottom: '10px', height: '60px' }}
                        />
                      )}
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {isOfficer && report.status === 'PO' && (
                          <>
                            <button className="btn-gold-solid" style={{ flex: 1, padding: '5px' }} onClick={() => handleReviewAction(report.id, true, 'officer')}>تایید افسر (ارسال به کارآگاه)</button>
                            <button className="btn-gold-outline" style={{ flex: 1, padding: '5px', borderColor: '#f87171', color: '#f87171' }} onClick={() => handleReviewAction(report.id, false, 'officer')}>رد گزارش</button>
                          </>
                        )}

                        {isDetective && report.status === 'PD' && (
                          <>
                            <button className="btn-gold-solid" style={{ flex: 1, padding: '5px' }} onClick={() => handleReviewAction(report.id, true, 'detective')}>تایید نهایی کارآگاه (صدور کد پاداش)</button>
                            <button className="btn-gold-outline" style={{ flex: 1, padding: '5px', borderColor: '#f87171', color: '#f87171' }} onClick={() => handleReviewAction(report.id, false, 'detective')}>رد اطلاعات</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showMyRewardsModal && (
        <div className="lux-modal-overlay">
          <div className="lux-modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="gold-text">📜 پاداش‌های تایید شده شما</h2>
              <button 
                onClick={() => setShowMyRewardsModal(false)} 
                className="btn-gold-outline" 
                style={{ padding: '5px 15px' }}
              >
                بستن
              </button>
            </div>

            <div className="rewards-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {myApprovedReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <p style={{ color: 'var(--text-dim)' }}>هنوز گزارش تایید شده‌ای ندارید.</p>
                  <small>پس از اینکه گزارش شما توسط کارآگاه تایید نهایی شد، کد پاداش اینجا ظاهر می‌شود.</small>
                </div>
              ) : (
                myApprovedReports.map(report => (
                  <div key={report.id} style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '20px', borderRadius: '12px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>📅 ثبت در: {new Date(report.created_at).toLocaleDateString('fa-IR')}</span>
                      <span className="status-badge AP" style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' }}>تایید نهایی</span>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0' }}>📂 <strong>محتوای گزارش:</strong></p>
                      <p style={{ fontSize: '0.9rem', color: '#bbb' }}>{report.description}</p>
                    </div>

                    <div style={{ background: '#000', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--accent-gold)' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>💎 کد مژدگانی یکتا (جهت استعلام پلیس/خزانه)</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '8px', color: '#fff' }}>{report.reward_code}</div>
                    </div>

                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#aaa' }}>💰 مبلغ مژدگانی:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>
                        {report.reward_amount?.toLocaleString()} ریال
                      </span>
                    </div>

                    {report.detective_notes && (
                      <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        💬 نظر کارآگاه: {report.detective_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <p style={{ fontSize: '0.75rem', marginTop: '15px', color: '#777', textAlign: 'center' }}>
              ⚠️ حتماً از این کدها اسکرین‌شات بگیرید یا آن را به مسئول خزانه جهت دریافت وجه ارائه دهید.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;
