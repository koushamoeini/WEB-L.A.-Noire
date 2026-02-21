import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { investigationAPI } from '../services/investigationApi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { evidenceAPI } from '../services/evidenceApi';
import type { Interrogation, Suspect } from '../types/investigation';
import type { Evidence } from '../types/evidence';
import './Evidence.css'; // Reusing luxury evidence styles

export default function Interrogations() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const suspectId = searchParams.get('suspectId');
  const { user } = useAuth();

  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [suspect, setSuspect] = useState<Suspect | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<{
    suspect: string;
    transcript: string;
    interrogator_score: number | '';
    supervisor_score: number | '';
  }>({
    suspect: suspectId || '',
    transcript: '',
    interrogator_score: '',
    supervisor_score: '',
  });

  const [feedbackFormData, setFeedbackFormData] = useState<{ [id: number]: { notes: string, score: number } }>({});
  const [chiefFormData, setChiefFormData] = useState<{ [id: number]: { notes: string, is_confirmed: boolean } }>({});
  const [caseObj, setCaseObj] = useState<any>(null);

  const isDetective = user?.roles?.some(r => r.code === 'detective') || false;
  const isSergeant = user?.roles?.some(r => r.code === 'sergeant') || false;
  const isCaptain = user?.roles?.some(r => r.code === 'captain') || false;
  const isChief = user?.roles?.some(r => r.code === 'police_chief') || false;
  const isSupervisor = isSergeant || isCaptain || isChief;

  useEffect(() => {
    fetchData();
  }, [caseId, suspectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await investigationAPI.listInterrogations();
      // Filter by suspect if ID is provided
      const filtered = suspectId 
        ? data.filter(i => i.suspect === parseInt(suspectId))
        : data;
      setInterrogations(filtered);

      if (suspectId) {
        const suspects = await investigationAPI.listSuspects(parseInt(caseId!));
        const found = suspects.find(s => s.id === parseInt(suspectId));
        if (found) setSuspect(found);
      }

      if (caseId) {
        const cases = await api.get(`/cases/${caseId}/`);
        setCaseObj(cases.data);
        const evidenceData = await evidenceAPI.listEvidence(parseInt(caseId));
        setEvidences(evidenceData);
      }
    } catch (error) {
      console.error('Failed to fetch interrogations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.suspect || formData.suspect === '') {
        alert('لطفا ابتدا یک متهم را انتخاب کنید.');
        return;
      }

      const payload: any = {
        suspect: parseInt(formData.suspect),
        transcript: formData.transcript,
      };
      
      // Only include scores if they are provided
      if (formData.interrogator_score !== '') payload.interrogator_score = formData.interrogator_score;
      if (formData.supervisor_score !== '') payload.supervisor_score = formData.supervisor_score;

      if (editingId) {
        await investigationAPI.updateInterrogation(editingId, payload);
      } else {
        await investigationAPI.createInterrogation(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ suspect: suspectId || '', transcript: '', interrogator_score: '', supervisor_score: '' });
      fetchData();
    } catch (error: any) {
      console.error('Interrogation submission error:', error);
      const detail = error.response?.data?.detail || JSON.stringify(error.response?.data) || 'خطا در ارتباط با سرور';
      alert('خطا در ثبت اطلاعات: ' + detail);
    }
  };

  const handleUpdateScore = async (id: number, score: number) => {
    try {
      const payload: any = {};
      if (isDetective) payload.interrogator_score = score;
      if (isSupervisor) payload.supervisor_score = score;

      await investigationAPI.updateInterrogation(id, payload);
      fetchData();
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const handleFeedbackSubmit = async (interrogationId: number) => {
    const data = feedbackFormData[interrogationId];
    if (!data) return;
    try {
      await investigationAPI.interrogationFeedback(interrogationId, {
        notes: data.notes,
        is_confirmed: true
      });
      fetchData();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleChiefConfirm = async (interrogationId: number, isConfirmed: boolean) => {
    const data = chiefFormData[interrogationId] || { notes: '' };
    try {
      await investigationAPI.chiefConfirmInterrogation(interrogationId, {
        is_confirmed: isConfirmed,
        notes: data.notes
      });
      fetchData();
    } catch (error) {
      console.error('Failed to confirm feedback:', error);
    }
  };

  const [editingTranscript, setEditingTranscript] = useState<{ id: number, text: string } | null>(null);

  const handleUpdateTranscript = async (id: number) => {
    if (!editingTranscript) return;
    try {
      await investigationAPI.updateInterrogation(id, { transcript: editingTranscript.text });
      setEditingTranscript(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update transcript:', error);
    }
  };

  const handleDeleteInterrogation = async (id: number) => {
    if (!window.confirm('آیا از حذف این جلسه بازجویی اطمینان دارید؟')) return;
    try {
      await investigationAPI.deleteInterrogation(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete interrogation:', error);
      alert('خطا در حذف بازجویی.');
    }
  };

  const handleEditClick = (inter: Interrogation) => {
    setFormData({
      suspect: inter.suspect.toString(),
      transcript: inter.transcript,
      interrogator_score: inter.interrogator_score || '',
      supervisor_score: inter.supervisor_score || '',
    });
    setEditingId(inter.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="evidence-container">
          <div className="evidence-header">
            <div className="header-titles">
              <h1 className="gold-text">جلسات بازجویی</h1>
              {suspect && <p className="subtitle-lux">متهم: {suspect.first_name} {suspect.last_name}</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-gold-solid" onClick={() => {
                if (showForm) {
                  setEditingId(null);
                  setFormData({ suspect: suspectId || '', transcript: '', interrogator_score: '', supervisor_score: '' });
                }
                setShowForm(!showForm);
              }}>
                {showForm ? 'لغو' : 'ثبت جلسه جدید'}
              </button>
            </div>
          </div>
          
          {showForm && (
            <div className="evidence-form-container" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
              <form className="evidence-form" onSubmit={handleSubmit}>
                <h3>{editingId ? 'ویرایش گزارش جلسه بازجویی' : 'گزارش جلسه بازجویی'}</h3>
                <div className="form-group">
                  <label>متن بازجویی (صورت‌جلسه) *</label>
                  <textarea
                    value={formData.transcript}
                    onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                    required
                    placeholder="جزئیات پرسش‌ها و پاسخ‌های رد و بدل شده..."
                    style={{ minHeight: '200px' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>امتیاز کارآگاه (۱-۱۰)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.interrogator_score}
                      onChange={(e) => setFormData({ ...formData, interrogator_score: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      placeholder="امتیاز توسط کارآگاه..."
                      disabled={!isDetective && !isSupervisor && !editingId}
                    />
                  </div>

                  <div className="form-group">
                    <label>امتیاز گروهبان (۱-۱۰)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.supervisor_score}
                      onChange={(e) => setFormData({ ...formData, supervisor_score: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      placeholder="امتیاز توسط گروهبان..."
                      disabled={!isSergeant && !isCaptain && !isChief && !editingId}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-gold">{editingId ? 'بروزرسانی گزارش' : 'ثبت گزارش'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="evidence-list">
            {loading ? (
              <div className="loading">در حال بارگذاری...</div>
            ) : interrogations.length === 0 ? (
              <div className="no-data">هیچ بازجویی ثبت نشده است.</div>
            ) : (
              <div className="interrogations-list">
                {interrogations.map((inter) => (
                  <div key={inter.id} className="evidence-card module-card-luxury" style={{ marginBottom: '20px' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span className="date">تاریخ: {new Date(inter.created_at).toLocaleDateString('fa-IR')}</span>
                        <span className="badge-gold">بازجو: {inter.interrogator_name}</span>
                      </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleEditClick(inter)}
                            className="btn-gold-outline-sm"
                            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          >
                            ویرایش کلی
                          </button>
                          <button 
                            onClick={() => handleDeleteInterrogation(inter.id)}
                            className="btn-gold-outline-sm"
                            style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: '#ff4d4d', color: '#ff4d4d' }}
                          >
                            حذف
                          </button>
                        </div>
                    </div>
                    <div className="card-body" style={{ marginTop: '15px' }}>
                      {editingTranscript?.id === inter.id ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <textarea 
                            value={editingTranscript.text}
                            onChange={(e) => setEditingTranscript({ ...editingTranscript, text: e.target.value })}
                            style={{ background: '#000', color: '#fff', border: '1px solid #d4af37', padding: '10px', minHeight: '150px' }}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-gold-sm" onClick={() => handleUpdateTranscript(inter.id)}>ذخیره تغییرات</button>
                            <button className="btn-gold-outline-sm" onClick={() => setEditingTranscript(null)}>انصراف</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <p className="transcript" style={{ whiteSpace: 'pre-wrap', color: '#ccc' }}>{inter.transcript}</p>
                          {(user?.id === inter.interrogator || isSupervisor) && (
                            <button 
                              onClick={() => setEditingTranscript({ id: inter.id, text: inter.transcript })}
                              style={{ position: 'absolute', top: 0, left: 0, background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              ✏️ ویرایش متن
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="card-footer" style={{ marginTop: '20px', borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div className="scores-display" style={{ display: 'flex', gap: '20px' }}>
                        <div>
                          <small style={{ display: 'block', color: '#888' }}>امتیاز کارآگاه ({inter.interrogator_name || 'ثبت نشده'})</small>
                          {inter.interrogator_score ? (
                            <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{inter.interrogator_score}</span>
                          ) : (
                            <span style={{ color: '#555' }}>---</span>
                          )}
                        </div>
                        <div>
                          <small style={{ display: 'block', color: '#888' }}>امتیاز گروهبان ({inter.supervisor_name || 'ثبت نشده'})</small>
                          {inter.supervisor_score ? (
                            <span style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{inter.supervisor_score}</span>
                          ) : (
                            <span style={{ color: '#555' }}>---</span>
                          )}
                        </div>
                      </div>

                      {(isDetective || isSergeant) && (
                        <div className="role-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'rgba(212,175,55,0.05)', padding: '10px', borderRadius: '5px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#d4af37' }}>
                            {isDetective ? 'ثبت/ویرایش امتیاز کارآگاه:' : 'ثبت/ویرایش امتیاز گروهبان:'}
                          </label>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <select 
                              onChange={(e) => handleUpdateScore(inter.id, parseInt(e.target.value))}
                              style={{ background: '#111', color: '#fff', border: '1px solid #d4af37', borderRadius: '4px', padding: '4px 10px' }}
                              value={(isDetective ? inter.interrogator_score : inter.supervisor_score) || ""}
                            >
                              <option value="" disabled>نمره (۱-۱۰)</option>
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Captain Final Decision Section */}
                    <div className="feedback-section" style={{ marginTop: '20px', padding: '15px', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.1)' }}>
                      <h4 style={{ color: '#d4af37', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚖️</span> نظر نهایی کاپیتان
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>بر اساس اظهارات، مدارک و امتیازات ثبت شده توسط کارآگاه و گروهبان</p>
                      
                      {inter.feedback ? (
                        <div className="feedback-content">
                          <p style={{ fontStyle: 'italic', marginBottom: '10px', borderRight: '2px solid #d4af37', paddingRight: '10px' }}>"{inter.feedback.notes || 'بدون توضیح'}"</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>ثبت کننده: {inter.feedback.captain_name}</span>
                          </div>
                        </div>
                      ) : isCaptain ? (
                        <div className="feedback-form" style={{ display: 'grid', gap: '10px' }}>
                          <div className="evidence-summary" style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                            <p style={{ color: '#d4af37', fontSize: '0.8rem', marginBottom: '5px' }}>📦 مدارک ثبت شده در پرونده:</p>
                            {evidences.length > 0 ? (
                              <ul style={{ paddingRight: '20px', fontSize: '0.75rem', color: '#ccc' }}>
                                {evidences.map(e => <li key={e.id}>{e.title} ({e.type_display})</li>)}
                              </ul>
                            ) : (
                              <p style={{ fontSize: '0.75rem', color: '#555' }}>مدرکی یافت نشد.</p>
                            )}
                          </div>
                          <textarea 
                            placeholder="جمع‌بندی نهایی خود را بر اساس مدارک و بازجویی‌ها بنویسید..."
                            value={feedbackFormData[inter.id]?.notes || ''}
                            onChange={(e) => setFeedbackFormData({ ...feedbackFormData, [inter.id]: { ...feedbackFormData[inter.id], notes: e.target.value, score: 0 } })}
                            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '5px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-gold-sm" onClick={() => handleFeedbackSubmit(inter.id)}>ثبت نظر نهایی</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#555' }}>در انتظار بررسی و نظر نهایی کاپیتان...</p>
                      )}
                    </div>

                    {/* Police Chief Confirmation Section (for Critical Crimes) */}
                    {caseObj?.crime_level === 0 && inter.feedback && (
                      <div className="chief-section" style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,50,50,0.05)', borderRadius: '8px', border: '1px solid rgba(255,50,50,0.2)' }}>
                         <h4 style={{ color: '#ff4d4d', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>🚨</span> تاییدیه رئیس پلیس (جرم بحرانی)
                        </h4>
                        
                        {inter.feedback.chief ? (
                          <div className="chief-content">
                             <div className={`status-badge ${inter.feedback.is_chief_confirmed ? 'status-active' : 'status-rejected'}`} style={{ display: 'inline-block', marginBottom: '10px' }}>
                              {inter.feedback.is_chief_confirmed ? 'تایید شده' : 'رد شده'}
                            </div>
                            <p style={{ marginBottom: '10px' }}>{inter.feedback.chief_notes}</p>
                            <small style={{ color: '#888' }}>توسط: {inter.feedback.chief_name}</small>
                          </div>
                        ) : isChief ? (
                          <div className="chief-form" style={{ display: 'grid', gap: '10px' }}>
                            <textarea 
                              placeholder="توضیحات رئیس پلیس..."
                              value={chiefFormData[inter.id]?.notes || ''}
                              onChange={(e) => setChiefFormData({ ...chiefFormData, [inter.id]: { ...chiefFormData[inter.id], notes: e.target.value, is_confirmed: chiefFormData[inter.id]?.is_confirmed ?? true } })}
                              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '4px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button className="btn-gold-sm" onClick={() => handleChiefConfirm(inter.id, true)}>تایید نظر کاپیتان</button>
                              <button className="btn-gold-outline-sm" style={{ borderColor: '#ff4d4d', color: '#ff4d4d' }} onClick={() => handleChiefConfirm(inter.id, false)}>رد نظر کاپیتان</button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: '#555' }}>در انتظار تایید نهایی رئیس پلیس...</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
