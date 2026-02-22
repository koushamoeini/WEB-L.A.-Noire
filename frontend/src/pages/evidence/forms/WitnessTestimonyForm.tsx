import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { evidenceAPI } from '../../../services/evidenceApi';
import { caseAPI } from '../../../services/caseApi';
import type { Case } from '../../../types/case';
import Sidebar from '../../../components/Sidebar';
import '../create/CreateEvidence.css';

export default function WitnessTestimonyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
    transcript: '',
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
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
      const data = await evidenceAPI.getWitnessTestimony(parseInt(id!));
      setFormData({
        case: data.case.toString(),
        title: data.title,
        description: data.description,
        transcript: data.transcript,
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
        result = await evidenceAPI.updateWitnessTestimony(parseInt(id), {
          title: formData.title,
          description: formData.description,
          transcript: formData.transcript,
          media: mediaFile || undefined,
        });
      } else {
        result = await evidenceAPI.createWitnessTestimony({
          case: parseInt(formData.case),
          title: formData.title,
          description: formData.description,
          transcript: formData.transcript,
          media: mediaFile || undefined,
        });
      }

      if (images.length > 0) {
        await evidenceAPI.uploadImages('witness', result.id, images);
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
        <h2>{id ? 'ویرایش استشهاد شاهد' : 'استشهاد شاهد'}</h2>

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
            placeholder="مثال: شهادت جان اسمیت"
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
            placeholder="توضیحات کلی درباره شهادت"
          />
        </div>

        <div className="form-group">
          <label>رونوشت صحبت‌ها *</label>
          <textarea
            value={formData.transcript}
            onChange={(e) =>
              setFormData({ ...formData, transcript: e.target.value })
            }
            required
            placeholder="متن کامل صحبت‌های شاهد"
            style={{ minHeight: '200px' }}
          />
        </div>

        <div className="form-group">
          <label>فایل‌های مرتبط (تصاویر، صوت یا ویدیو)</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                setImages(files);
                const firstMedia = files.find(f => !f.type.startsWith('image/')) || files[0];
                setMediaFile(firstMedia || null);
              }
            }}
            accept="image/*,audio/*,video/*"
          />
          <small className="form-text text-muted">می‌توانید چندین فایل را انتخاب کنید.</small>
        </div>

        {images.length > 0 && (
          <div className="selected-files-preview">
            {images.map((file, idx) => (
              <div key={idx} className="file-preview-card">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="preview" />
                ) : (
                  <div className="file-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📄</div>
                )}
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
