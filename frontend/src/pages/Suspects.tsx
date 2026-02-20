import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { investigationAPI } from '../services/investigationApi';
import { caseAPI } from '../services/caseApi';
import type { Suspect } from '../types/investigation';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './Suspects.css';

const BACKEND_URL = 'http://localhost:8000';

export default function Suspects() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case');
  const navigate = useNavigate();
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    case: caseId || '',
    first_name: '',
    last_name: '',
    national_code: '',
    details: '',
    is_main_suspect: false,
    is_arrested: false,
    image: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suspectsData, casesData] = await Promise.all([
        investigationAPI.listSuspects(caseId ? parseInt(caseId) : undefined),
        caseAPI.listCases(),
      ]);
      setSuspects(suspectsData);
      setCases(casesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('case', formData.case);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('national_code', formData.national_code);
      formDataToSend.append('details', formData.details);
      formDataToSend.append('is_main_suspect', String(formData.is_main_suspect));
      formDataToSend.append('is_arrested', String(formData.is_arrested));
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingId) {
        await investigationAPI.updateSuspect(editingId, formDataToSend as any);
      } else {
        await investigationAPI.createSuspect(formDataToSend as any);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ case: caseId || '', first_name: '', last_name: '', national_code: '', details: '', is_main_suspect: false, image: null });
      fetchData();
    } catch (error) {
      console.error('Failed to save suspect:', error);
    }
  };

  const handleEdit = (suspect: Suspect) => {
    setEditingId(suspect.id);
    setFormData({
      case: suspect.case.toString(),
      first_name: suspect.first_name,
      last_name: suspect.last_name,
      national_code: suspect.national_code || '',
      details: suspect.details,
      is_main_suspect: suspect.is_main_suspect,
      is_arrested: suspect.is_arrested || false,
      image: null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این متهم اطمینان دارید؟')) return;
    try {
      await investigationAPI.deleteSuspect(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete suspect:', error);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="suspects-page-container">
          <div className="suspects-header">
            <h1>مدیریت متهمان {caseId ? `- پرونده ${caseId}` : ''}</h1>
            <button className="btn-gold-outline" onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ case: caseId || '', first_name: '', last_name: '', national_code: '', details: '', is_main_suspect: false, image: null });
              }
              setShowForm(!showForm);
            }}>
              {showForm ? 'لغو' : 'افزودن متهم جدید'}
            </button>
          </div>

          {showForm && (
            <div className="evidence-form-container" style={{ padding: 0, marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px' }}>
              <form className="evidence-form" onSubmit={handleSubmit} style={{ maxWidth: '100%', margin: 0 }}>
                <h3>{editingId ? 'ویرایش اطلاعات متهم' : 'ثبت متهم جدید'}</h3>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>نام *</label>
                    <input
                      type="text"
                      placeholder="مثلا: جک"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>نام خانوادگی *</label>
                    <input
                      type="text"
                      placeholder="مثلا: ریپر"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>کد ملی</label>
                  <input
                    type="text"
                    placeholder="۱۰ رقم"
                    value={formData.national_code}
                    onChange={(e) => setFormData({ ...formData, national_code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>پرونده *</label>
                  <select
                    value={formData.case}
                    onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                    required
                    disabled={!!caseId}
                  >
                    <option value="">انتخاب پرونده</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} - #{c.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>جزئیات و توضیحات *</label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    required
                    placeholder="شرح مختصری از سوابق و دلایل سوءظن..."
                    style={{ minHeight: '120px' }}
                  />
                </div>

                <div className="form-group">
                  <label>تصویر (چهره‌نگاری/عکس)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="file-input-gold"
                  />
                </div>

                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="is_main_suspect"
                    checked={formData.is_main_suspect}
                    onChange={(e) =>
                      setFormData({ ...formData, is_main_suspect: e.target.checked })
                    }
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="is_main_suspect" style={{ marginBottom: 0 }}>مظنون اصلی پرونده</label>
                </div>

                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="is_arrested"
                    checked={formData.is_arrested}
                    onChange={(e) =>
                      setFormData({ ...formData, is_arrested: e.target.checked })
                    }
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="is_arrested" style={{ marginBottom: 0 }}>مظنون دستگیر شده است</label>
                </div>

                <div className="form-actions" style={{ marginTop: '30px' }}>
                  <button type="submit" className="btn-gold">
                    {editingId ? 'بروزرسانی اطلاعات' : 'تایید و ثبت'}
                  </button>
                  <button type="button" className="btn-gold-outline" onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ case: caseId || '', first_name: '', last_name: '', national_code: '', details: '', is_main_suspect: false, image: null });
                  }}>
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">در حال بارگذاری...</div>
          ) : suspects.length === 0 ? (
            <div className="no-data">
              <p>هیچ متهمی یافت نشد</p>
            </div>
          ) : (
            <div className="suspects-grid">
              {suspects.map((suspect) => (
                <div key={suspect.id} className={`suspect-card module-card-luxury ${suspect.is_main_suspect ? 'main-suspect' : ''}`}>
                   {suspect.image && (
                    <div className="suspect-image-container">
                      <img 
                        src={suspect.image.startsWith('http') ? suspect.image : `${BACKEND_URL}${suspect.image.startsWith('/') ? '' : '/'}${suspect.image.includes('/media/') ? '' : 'media/'}${suspect.image}`} 
                        alt={suspect.first_name} 
                      />
                    </div>
                  )}
                  <div className="suspect-header">
                    <h3>{suspect.first_name} {suspect.last_name}</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {suspect.is_main_suspect && <span className="badge-main">عنصر کلیدی</span>}
                      {suspect.is_arrested && <span className="badge-arrested" style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.65rem' }}>دستگیر شده</span>}
                    </div>
                  </div>
                  <div className="suspect-body">
                    {suspect.national_code && <p className="national-code">کد ملی: {suspect.national_code}</p>}
                    <p className="details">{suspect.details}</p>
                  </div>
                  <div className="suspect-footer" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      onClick={() => navigate(`/cases/${suspect.case}/interrogations?suspectId=${suspect.id}`)}
                      className="btn-gold-sm"
                    >
                      جلسات بازجویی
                    </button>
                    <button 
                      onClick={() => navigate(`/investigation?case=${suspect.case}`)}
                      className="btn-gold-outline-sm"
                    >
                      تخته تحقیقات
                    </button>
                    <button 
                      onClick={() => handleEdit(suspect)}
                      className="btn-gold-outline-sm"
                      style={{ gridColumn: 'span 2' }}
                    >
                      ویرایش اطلاعات متهم
                    </button>
                    <button 
                      onClick={() => handleDelete(suspect.id)}
                      className="btn-gold-outline-sm"
                      style={{ gridColumn: 'span 2', borderColor: 'rgba(255, 90, 90, 0.5)', color: '#ffbaba' }}
                    >
                      حذف متهم
                    </button>
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
