import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './CreateEvidence.css';

export default function VehicleEvidenceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
    model_name: '',
    color: '',
    license_plate: '',
    serial_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await caseAPI.listCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: must have either license_plate or serial_number
    if (!formData.license_plate && !formData.serial_number) {
      setError('باید حداقل یکی از موارد شماره پلاک یا شماره سریال وارد شود');
      return;
    }

    if (formData.license_plate && formData.serial_number) {
      setError('شماره پلاک و شماره سریال نمی‌توانند همزمان مقدار داشته باشند');
      return;
    }

    setLoading(true);

    try {
      await evidenceAPI.createVehicleEvidence({
        case: parseInt(formData.case),
        title: formData.title,
        description: formData.description,
        model_name: formData.model_name,
        color: formData.color,
        license_plate: formData.license_plate || undefined,
        serial_number: formData.serial_number || undefined,
      });

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
        <h2>وسایل نقلیه</h2>

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
            placeholder="مثال: خودروی مشکوک در محل حادثه"
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
            placeholder="توضیحات کامل درباره وسیله نقلیه"
          />
        </div>

        <div className="form-group">
          <label>مدل *</label>
          <input
            type="text"
            value={formData.model_name}
            onChange={(e) =>
              setFormData({ ...formData, model_name: e.target.value })
            }
            required
            placeholder="مثال: Chevrolet Bel Air 1947"
          />
        </div>

        <div className="form-group">
          <label>رنگ *</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            required
            placeholder="مثال: سیاه"
          />
        </div>

        <div className="form-group">
          <label>شماره پلاک</label>
          <input
            type="text"
            value={formData.license_plate}
            onChange={(e) =>
              setFormData({ ...formData, license_plate: e.target.value })
            }
            placeholder="مثال: ABC-1234"
            disabled={!!formData.serial_number}
          />
          <small style={{ color: '#808080', marginTop: '4px', display: 'block' }}>
            توجه: باید یکی از شماره پلاک یا شماره سریال وارد شود
          </small>
        </div>

        <div className="form-group">
          <label>شماره سریال</label>
          <input
            type="text"
            value={formData.serial_number}
            onChange={(e) =>
              setFormData({ ...formData, serial_number: e.target.value })
            }
            placeholder="مثال: VIN123456789"
            disabled={!!formData.license_plate}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ثبت...' : 'ثبت شواهد'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
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
