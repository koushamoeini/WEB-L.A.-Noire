import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { evidenceAPI } from '../../../services/evidenceApi';
import { caseAPI } from '../../../services/caseApi';
import { useAuth } from '../../../context/AuthContext';
import type { Case } from '../../../types/case';
import Sidebar from '../../../components/Sidebar';
import '../create/CreateEvidence.css';

export default function BiologicalEvidenceForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const isForensicDoctor = user?.roles?.some(r => r.code === 'forensic_doctor') || false;

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
    is_verified: false,
    medical_follow_up: '',
    database_follow_up: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
    if (id) {
      fetchEvidence();
    }
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
        is_verified: data.is_verified,
        medical_follow_up: data.medical_follow_up || '',
        database_follow_up: data.database_follow_up || '',
      });
    } catch (err) {
      console.error('Failed to fetch evidence details:', err);
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
          is_verified: formData.is_verified,
          medical_follow_up: formData.medical_follow_up || undefined,
          database_follow_up: formData.database_follow_up || undefined,
        });
      } else {
        result = await evidenceAPI.createBiologicalEvidence({
          case: parseInt(formData.case),
          title: formData.title,
          description: formData.description,
          is_verified: formData.is_verified,
          medical_follow_up: formData.medical_follow_up || undefined,
          database_follow_up: formData.database_follow_up || undefined,
        });
      }

      if (images.length > 0) {
        await evidenceAPI.uploadImages('biological', result.id, images);
      }

      navigate(`/evidence${formData.case ? `?case=${formData.case}` : ''}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت شواهد');
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
        <h2>{id ? 'ویرایش شواهد زیستی و پزشکی' : 'ثبت شواهد زیستی و پزشکی'}</h2>

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
            placeholder="مثال: نمونه DNA از صحنه جرم"
          />
        </div>

        <div className="form-group">
          <label>توضیحات *</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            placeholder="توضیحات کامل درباره شواهد زیستی"
          />
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="is_verified"
            checked={formData.is_verified}
            disabled={!isForensicDoctor}
            onChange={(e) =>
              setFormData({ ...formData, is_verified: e.target.checked })
            }
          />
          <label htmlFor="is_verified">
            تایید شده توسط پزشکی قانونی {!isForensicDoctor && '(فقط توسط پزشک قابل تغییر است)'}
          </label>
        </div>

        <div className="form-group">
          <label>نتیجه پیگیری پزشکی</label>
          <textarea
            value={formData.medical_follow_up}
            disabled={!isForensicDoctor}
            onChange={(e) =>
              setFormData({ ...formData, medical_follow_up: e.target.value })
            }
            placeholder="نتایج آزمایش‌های پزشکی و بررسی‌های انجام شده"
          />
        </div>

        <div className="form-group">
          <label>نتیجه پیگیری بانک داده</label>
          <textarea
            value={formData.database_follow_up}
            disabled={!isForensicDoctor}
            onChange={(e) =>
              setFormData({ ...formData, database_follow_up: e.target.value })
            }
            placeholder="نتایج جستجو در بانک اطلاعات DNA و اثر انگشت"
          />
        </div>

        <div className="form-group">
          <label>تصاویر شواهد:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                setImages(Array.from(e.target.files));
              }
            }}
          />
          <small className="form-text text-muted">می‌توانید چندین تصویر را انتخاب کنید.</small>
        </div>

        {images.length > 0 && (
          <div className="selected-files-preview">
            {images.map((file, idx) => (
              <div key={idx} className="file-preview-card">
                <img src={URL.createObjectURL(file)} alt="preview" />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'در حال آپلود...' : 'ثبت مدرک و آپلود فایل‌ها'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            انصراف
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}
