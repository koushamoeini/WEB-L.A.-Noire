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
  const [showForm, setShowForm] = useState(true);
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

  const [feedbackFormData, setFeedbackFormData] = useState<{ [id: number]: { notes: string, score: number, decision: 'INNOCENT' | 'GUILTY' | '' } }>({});
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

      // Automatically set for editing if an interrogation exists for this suspect
      if (suspectId && filtered.length > 0) {
        const inter = filtered[0];
        setFormData({
          suspect: inter.suspect.toString(),
          transcript: inter.transcript,
          interrogator_score: inter.interrogator_score || '',
          supervisor_score: inter.supervisor_score || '',
        });
        setEditingId(inter.id);
      }

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
      fetchData();
      alert('اطلاعات بازجویی با موفقیت ثبت شد.');
    } catch (error: any) {
      console.error('Interrogation submission error:', error);
      const detail = error.response?.data?.detail || JSON.stringify(error.response?.data) || 'خلاصه خطا: متهم هنوز دستگیر نشده یا دسترسی ندارید';
      alert('خطا در ثبت اطلاعات: ' + detail);
    }
  };

  const handleConfirmScore = async (role: 'interrogator' | 'supervisor') => {
    if (!editingId) return;
    try {
      const payload: any = {};
      if (role === 'interrogator') {
        if (formData.interrogator_score === '') {
          alert('لطفا ابتدا نمره را وارد کنید.');
          return;
        }
        payload.interrogator_score = formData.interrogator_score;
        payload.is_interrogator_confirmed = true;
      } else if (role === 'supervisor') {
        if (formData.supervisor_score === '') {
          alert('لطفا ابتدا نمره را وارد کنید.');
          return;
        }
        payload.supervisor_score = formData.supervisor_score;
        payload.is_supervisor_confirmed = true;
      }

      await investigationAPI.updateInterrogation(editingId, payload);
      fetchData();
    } catch (error) {
      console.error('Failed to confirm score:', error);
      alert('خطا در تایید نمره.');
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
    if (!data || !data.decision) {
      alert('لطفا رای نهایی (گناهکار/بی‌گناه) را انتخاب کنید.');
      return;
    }
    try {
      await investigationAPI.interrogationFeedback(interrogationId, {
        notes: data.notes,
        decision: data.decision,
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
              <h1 className="gold-text">گزارش بازجویی</h1>
              {suspect && <p className="subtitle-lux">متهم: {suspect.first_name} {suspect.last_name}</p>}
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.interrogator_score}
                        onChange={(e) => setFormData({ ...formData, interrogator_score: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        placeholder={!isDetective ? "فقط توسط کارآگاه قابل ویرایش است" : "امتیاز توسط کارآگاه..."}
                        disabled={!isDetective || (editingId && interrogations[0]?.is_interrogator_confirmed)}
                        style={{ flex: 1 }}
                      />
                      {isDetective && editingId && !interrogations[0]?.is_interrogator_confirmed && (
                        <button 
                          type="button" 
                          className="btn-gold-solid" 
                          onClick={() => handleConfirmScore('interrogator')}
                          style={{ padding: '0 15px', background: '#059669', borderColor: '#059669' }}
                        >
                          تایید نهایی
                        </button>
                      )}
                      {interrogations[0]?.is_interrogator_confirmed && (
                        <span style={{ display: 'flex', alignItems: 'center', color: '#059669', padding: '0 10px' }}>✓ تایید شده</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>امتیاز گروهبان (۱-۱۰)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.supervisor_score}
                        onChange={(e) => setFormData({ ...formData, supervisor_score: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        placeholder={!isSergeant ? "فقط توسط گروهبان قابل ویرایش است" : "امتیاز توسط گروهبان..."}
                        disabled={!isSergeant || (editingId && interrogations[0]?.is_supervisor_confirmed)}
                        style={{ flex: 1 }}
                      />
                      {isSergeant && editingId && !interrogations[0]?.is_supervisor_confirmed && (
                        <button 
                          type="button" 
                          className="btn-gold-solid" 
                          onClick={() => handleConfirmScore('supervisor')}
                          style={{ padding: '0 15px', background: '#059669', borderColor: '#059669' }}
                        >
                          تایید نهایی
                        </button>
                      )}
                      {interrogations[0]?.is_supervisor_confirmed && (
                        <span style={{ display: 'flex', alignItems: 'center', color: '#059669', padding: '0 10px' }}>✓ تایید شده</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-gold"
                    disabled={editingId && interrogations[0]?.is_interrogator_confirmed && interrogations[0]?.is_supervisor_confirmed}
                  >
                    {editingId ? 'بروزرسانی گزارش بازجویی' : 'ثبت گزارش نهایی بازجویی'}
                  </button>
                </div>
              </form>

              {editingId && interrogations.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  {/* Captain Final Decision Section */}
                  <div className="feedback-section module-card-luxury" style={{ padding: '20px', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <h4 style={{ color: '#d4af37', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚖️</span> نظر نهایی کاپیتان
                    </h4>
                    
                    {interrogations[0].feedback ? (
                      <div className="feedback-content">
                        {/* Show captain decision badge */}
                        {interrogations[0].feedback.decision && (
                          <div style={{ marginBottom: '12px' }}>
                            <span className={`status-badge ${interrogations[0].feedback.decision === 'INNOCENT' ? 'status-active' : 'status-rejected'}`} style={{ padding: '6px 16px', fontSize: '1rem' }}>
                              {interrogations[0].feedback.decision === 'INNOCENT' ? '✓ بی‌گناه' : '✗ گناهکار'}
                            </span>
                          </div>
                        )}
                        <p style={{ fontStyle: 'italic', marginBottom: '15px', borderRight: '3px solid #d4af37', paddingRight: '15px', fontSize: '1rem', color: '#eee' }}>
                          "{interrogations[0].feedback.notes || 'بدون توضیح'}"
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#888', fontSize: '0.9rem' }}>ثبت کننده: {interrogations[0].feedback.captain_name}</span>
                        </div>
                      </div>
                    ) : isCaptain ? (
                      interrogations[0].is_interrogator_confirmed && interrogations[0].is_supervisor_confirmed ? (
                        <div className="feedback-form" style={{ display: 'grid', gap: '15px' }}>
                          {/* Scores Summary */}
                          <div style={{ display: 'flex', gap: '20px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>امتیاز کارآگاه</div>
                              <div style={{ fontSize: '1.4rem', color: '#d4af37' }}>{interrogations[0].interrogator_score ?? '—'}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>امتیاز گروهبان</div>
                              <div style={{ fontSize: '1.4rem', color: '#d4af37' }}>{interrogations[0].supervisor_score ?? '—'}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>امتیاز نهایی</div>
                              <div style={{ fontSize: '1.4rem', color: '#d4af37' }}>{interrogations[0].final_score ?? '—'}</div>
                            </div>
                          </div>
                          {/* Evidences */}
                          {evidences.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                              <p style={{ color: '#d4af37', fontSize: '0.8rem', marginBottom: '5px' }}>📦 مدارک ثبت شده:</p>
                              <ul style={{ paddingRight: '20px', margin: 0, fontSize: '0.8rem', color: '#ccc' }}>
                                {evidences.map(e => <li key={e.id}>{e.title} ({e.type_display})</li>)}
                              </ul>
                            </div>
                          )}
                          {/* Decision radio */}
                          <div style={{ display: 'flex', gap: '15px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: `2px solid ${feedbackFormData[editingId]?.decision === 'INNOCENT' ? '#10b981' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', transition: '0.2s' }}>
                              <input type="radio" name={`decision-${editingId}`} value="INNOCENT" checked={feedbackFormData[editingId]?.decision === 'INNOCENT'} onChange={() => setFeedbackFormData({ ...feedbackFormData, [editingId]: { ...feedbackFormData[editingId], decision: 'INNOCENT', notes: feedbackFormData[editingId]?.notes || '', score: 0 } })} />
                              <span style={{ color: '#10b981', fontWeight: 600 }}>بی‌گناه</span>
                            </label>
                            <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: `2px solid ${feedbackFormData[editingId]?.decision === 'GUILTY' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', transition: '0.2s' }}>
                              <input type="radio" name={`decision-${editingId}`} value="GUILTY" checked={feedbackFormData[editingId]?.decision === 'GUILTY'} onChange={() => setFeedbackFormData({ ...feedbackFormData, [editingId]: { ...feedbackFormData[editingId], decision: 'GUILTY', notes: feedbackFormData[editingId]?.notes || '', score: 0 } })} />
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>گناهکار</span>
                            </label>
                          </div>
                          <textarea 
                            placeholder="توضیحات و جمع‌بندی نهایی کاپیتان..."
                            value={feedbackFormData[editingId]?.notes || ''}
                            onChange={(e) => setFeedbackFormData({ ...feedbackFormData, [editingId]: { ...feedbackFormData[editingId], notes: e.target.value, score: 0, decision: feedbackFormData[editingId]?.decision || '' } })}
                            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px', minHeight: '100px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-gold-solid" style={{ padding: '10px 25px' }} onClick={() => handleFeedbackSubmit(editingId)}>ثبت نظر نهایی کاپیتان</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>در انتظار تایید نهایی نمرات توسط کارآگاه و گروهبان...</p>
                      )
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>در انتظار بررسی و ثبت نظر نهایی توسط کاپیتان...</p>
                    )}
                  </div>

                  {/* Police Chief Confirmation Section (for Critical Crimes) */}
                  {caseObj?.crime_level === 0 && interrogations[0].feedback && (
                    <div className="chief-section module-card-luxury" style={{ marginTop: '25px', padding: '20px', background: 'rgba(255,50,50,0.03)', borderRadius: '12px', border: '1px solid rgba(255,50,50,0.15)' }}>
                      <h4 style={{ color: '#ff4d4d', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🚨</span> تاییدیه نهایی رئیس پلیس (جرم بحرانی)
                      </h4>
                      
                      {interrogations[0].feedback.chief ? (
                        <div className="chief-content">
                          {/* Show captain decision for reference */}
                          <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>نظر کاپیتان: </span>
                            <span className={`status-badge ${interrogations[0].feedback.decision === 'INNOCENT' ? 'status-active' : 'status-rejected'}`} style={{ display: 'inline-block', padding: '2px 10px', fontSize: '0.85rem' }}>
                              {interrogations[0].feedback.decision === 'INNOCENT' ? 'بی‌گناه' : 'گناهکار'}
                            </span>
                          </div>
                          <div className={`status-badge ${interrogations[0].feedback.is_chief_confirmed ? 'status-active' : 'status-rejected'}`} style={{ display: 'inline-block', marginBottom: '15px', padding: '4px 12px' }}>
                            {interrogations[0].feedback.is_chief_confirmed ? '✓ تایید شده توسط رئیس پلیس' : '✗ رد شده توسط رئیس پلیس'}
                          </div>
                          <p style={{ marginBottom: '15px', color: '#eee' }}>{interrogations[0].feedback.chief_notes}</p>
                          <small style={{ color: '#888' }}>توسط: {interrogations[0].feedback.chief_name}</small>
                        </div>
                      ) : isChief ? (
                        <div className="chief-form" style={{ display: 'grid', gap: '15px' }}>
                          {/* Show captain decision for reference */}
                          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#888' }}>نظر کاپیتان: </span>
                            <span className={`status-badge ${interrogations[0].feedback.decision === 'INNOCENT' ? 'status-active' : 'status-rejected'}`} style={{ display: 'inline-block', padding: '2px 10px' }}>
                              {interrogations[0].feedback.decision === 'INNOCENT' ? 'بی‌گناه' : 'گناهکار'} — {interrogations[0].feedback.notes || 'بدون توضیح'}
                            </span>
                          </div>
                          <textarea 
                            placeholder="توضیحات رئیس پلیس..."
                            value={chiefFormData[editingId]?.notes || ''}
                            onChange={(e) => setChiefFormData({ ...chiefFormData, [editingId]: { ...chiefFormData[editingId], notes: e.target.value, is_confirmed: chiefFormData[editingId]?.is_confirmed ?? true } })}
                            style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #444', padding: '12px', borderRadius: '8px' }}
                          />
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn-gold-solid" style={{ flex: 1, padding: '12px', background: '#059669', borderColor: '#059669' }} onClick={() => handleChiefConfirm(editingId, true)}>تایید نظر کاپیتان</button>
                            <button className="btn-gold-outline" style={{ flex: 1, padding: '12px', borderColor: '#ff4d4d', color: '#ff4d4d' }} onClick={() => handleChiefConfirm(editingId, false)}>رد نظر کاپیتان</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>در انتظار تایید نهایی رئیس پلیس...</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
