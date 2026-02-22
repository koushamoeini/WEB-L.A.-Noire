import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investigationAPI } from '../../../services/investigationApi';
import { caseAPI } from '../../../services/caseApi';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/Sidebar';
import { SkeletonCard } from '../../../components/Skeleton';
import '../../cases/detail/CaseDetail.css'; // Reusing styles

export default function Trial() {
  const { id, suspectId } = useParams<{ id: string; suspectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suspect, setSuspect] = useState<any>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    result: 'GUILTY' as 'GUILTY' | 'INNOCENT',
    punishment: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [id, suspectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [caseRes, suspectRes] = await Promise.all([
        caseAPI.getCase(Number(id)),
        investigationAPI.getSuspect(Number(suspectId))
      ]);
      setCaseData(caseRes);
      setSuspect(suspectRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await investigationAPI.createVerdict({
        ...form,
        case: Number(id),
        suspect: Number(suspectId),
      });
      alert('حکم با موفقیت صادر شد');
      navigate(`/cases/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error submitting verdict');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="layout-with-sidebar"><Sidebar /><div className="main-content"><SkeletonCard count={1} /></div></div>;
  if (!suspect || !caseData) return <div className="layout-with-sidebar"><Sidebar /><div className="main-content"><p>اطلاعات یافت نشد</p></div></div>;

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="case-detail-container">
          <div className="case-detail-header">
            <h1 className="gold-text">جلسه دادگاه: {suspect.first_name} {suspect.last_name}</h1>
            <button className="btn-gold-outline" onClick={() => navigate(`/cases/${id}`)}>بازگشت به پرونده</button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="lux-card" style={{ marginBottom: '25px', padding: '25px' }}>
            <h3 className="gold-text">خلاصه پرونده</h3>
            <p><strong>شماره پرونده:</strong> #{caseData.id}</p>
            <p><strong>عنوان:</strong> {caseData.title}</p>
            <p><strong>شرح:</strong> {caseData.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="verdict-form">
            <h3 className="gold-text">صدور حکم نهایی</h3>
            
            <div className="form-group">
              <label>عنوان حکم (مثلاً: سرقت درجه یک)</label>
              <input 
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>رای نهایی</label>
              <select 
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value as any })}
                className="lux-input"
              >
                <option value="GUILTY">گناهکار</option>
                <option value="INNOCENT">بی‌گناه</option>
              </select>
            </div>

            <div className="form-group">
              <label>توضیحات و استدلال قضاوت</label>
              <textarea 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                required
              />
            </div>

            {form.result === 'GUILTY' && (
              <div className="form-group">
                <label>نوع و میزان مجازات</label>
                <textarea 
                  value={form.punishment}
                  onChange={(e) => setForm({ ...form, punishment: e.target.value })}
                  rows={3}
                  placeholder="مثلاً: ۶ ماه حبس تعزیری و پرداخت جریمه نقدی"
                />
              </div>
            )}

            <button type="submit" className="btn-gold-solid" style={{ width: '100%', padding: '16px', marginTop: '10px' }} disabled={processing}>
              {processing ? 'در حال ثبت...' : 'ثبت رای نهایی و صدور حکم'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
