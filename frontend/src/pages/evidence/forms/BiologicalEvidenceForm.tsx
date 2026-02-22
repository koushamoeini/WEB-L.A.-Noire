import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { evidenceAPI } from '../../../services/evidenceApi';
import { caseAPI } from '../../../services/caseApi';
import type { Case } from '../../../types/case';
import Sidebar from '../../../components/Sidebar';
import '../create/CreateEvidence.css';

export default function BiologicalEvidenceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
    medical_follow_up: '',
    database_follow_up: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
    if (id) fetchEvidence();
  }, [id]);

  const fetchCases = async () => {
    try {
      const data = await caseAPI.listCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const data = await evidenceAPI.getBiologicalEvidence(parseInt(id!));
      setFormData({
        case: data.case.toString(),
        title: data.title,
        description: data.description,
        medical_follow_up: data.medical_follow_up || '',
        database_follow_up: data.database_follow_up || '',
      });
    } catch (err) {
      console.error('Failed to fetch biological evidence:', err);
      setError('خطا در دریافت اطلاعات مدرک');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (id) {
        result = await evidenceAPI.updateBiologicalEvidence(parseInt(id), {
          title: formData.title,
          description: formData.description,
          medical_follow_up: formData.medical_follow_up,
          database_follow_up: formData.database_follow_up,
        } as any);
      } else {
        result = await evidenceAPI.createBiologicalEvidence({
          case: parseInt(formData.case),
          title: formData.title,
          description: formData.description,
          medical_follow_up: formData.medical_follow_up || undefined,
          database_follow_up: formData.database_follow_up || undefined,
        });
      }

      if (images.length > 0) {
        await evidenceAPI.uploadImages('biological', result.id, images);
      }

      navigate(`/evidence${formData.case ? `?case=${formData.case}` : ''}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت مدرک زیستی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="evidence-form-container">
          <form className="evidence-form" onSubmit={handleSubmit}>
            <h2>{id ? 'ویرایش مدرک زیستی' : 'ثبت مدرک زیستی'}</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>پرونده *</label>
              <select
                value={formData.case}
                onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                required
                disabled={!!urlCaseId}
              >
                <option value="">انتخاب پرونده</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} - {c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>عنوان *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="مثال: نمونه خون از صحنه جرم"
              />
            </div>

            <div className="form-group">
              <label>توضیحات *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="توضیحات کامل مدرک زیستی"
              />
            </div>

            <div className="form-group">
              <label>پیگیری پزشکی</label>
              <textarea
                value={formData.medical_follow_up}
                onChange={(e) => setFormData({ ...formData, medical_follow_up: e.target.value })}
                placeholder="نتایج پزشکی/آزمایشگاه"
              />
            </div>

            <div className="form-group">
              <label>پیگیری پایگاه داده</label>
              <textarea
                value={formData.database_follow_up}
                onChange={(e) => setFormData({ ...formData, database_follow_up: e.target.value })}
                placeholder="نتیجه بررسی در بانک اطلاعاتی"
              />
            </div>

            <div className="form-group">
              <label>تصاویر ضمیمه</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) setImages(Array.from(e.target.files));
                }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'در حال ثبت...' : 'ثبت مدرک'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
