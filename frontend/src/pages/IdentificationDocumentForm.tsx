import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './CreateEvidence.css';

export default function IdentificationDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
    owner_full_name: '',
    extra_info: '',
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
      const data = await evidenceAPI.getIdentificationDocument(parseInt(id!));
      setFormData({
        case: data.case.toString(),
        title: data.title,
        description: data.description,
        owner_full_name: data.owner_full_name,
        extra_info: data.extra_info ? JSON.stringify(data.extra_info, null, 2) : '',
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

    let extraInfoParsed = {};
    if (formData.extra_info.trim()) {
      try {
        extraInfoParsed = JSON.parse(formData.extra_info);
      } catch {
        setError('اطلاعات تکمیلی باید به فرمت JSON صحیح باشد');
        setLoading(false);
        return;
      }
    }

    try {
      let result;
      if (id) {
        result = await evidenceAPI.updateIdentificationDocument(parseInt(id), {
          title: formData.title,
          description: formData.description,
          owner_full_name: formData.owner_full_name,
          extra_info: Object.keys(extraInfoParsed).length > 0 ? extraInfoParsed : undefined,
        });
      } else {
        result = await evidenceAPI.createIdentificationDocument({
          case: parseInt(formData.case),
          title: formData.title,
          description: formData.description,
          owner_full_name: formData.owner_full_name,
          extra_info: Object.keys(extraInfoParsed).length > 0 ? extraInfoParsed : undefined,
        });
      }

      if (images.length > 0) {
        await evidenceAPI.uploadImages('id-document', result.id, images);
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
        <h2>{id ? 'ویرایش مدارک شناسایی' : 'مدارک شناسایی'}</h2>

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
            placeholder="مثال: کارت شناسایی کشف شده"
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
            placeholder="توضیحات کامل درباره مدرک شناسایی"
          />
        </div>

        <div className="form-group">
          <label>نام کامل صاحب مدرک *</label>
          <input
            type="text"
            value={formData.owner_full_name}
            onChange={(e) =>
              setFormData({ ...formData, owner_full_name: e.target.value })
            }
            required
            placeholder="مثال: جان اسمیت"
          />
        </div>

        <div className="form-group">
          <label>اطلاعات تکمیلی (JSON)</label>
          <textarea
            value={formData.extra_info}
            onChange={(e) =>
              setFormData({ ...formData, extra_info: e.target.value })
            }
            placeholder='{"address": "...", "phone": "..."}'
            style={{ fontFamily: 'monospace' }}
          />
          <small style={{ color: '#808080', marginTop: '4px', display: 'block' }}>
            فرمت JSON: {`{"key": "value", "key2": "value2"}`}
          </small>
        </div>

        <div className="form-group">
          <label>تصاویر مدرک:</label>
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
