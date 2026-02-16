import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evidenceAPI } from '../services/evidenceApi';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './CreateEvidence.css';

export default function OtherEvidenceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCaseId = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState({
    case: urlCaseId || '',
    title: '',
    description: '',
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
    setLoading(true);

    try {
      await evidenceAPI.createOtherEvidence({
        case: parseInt(formData.case),
        title: formData.title,
        description: formData.description,
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
        <h2>سایر موارد</h2>

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
            placeholder="مثال: یادداشت کشف شده در محل"
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
            placeholder="توضیحات کامل درباره شواهد"
            style={{ minHeight: '200px' }}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'در حال ثبت...' : 'ثبت شواهد'}
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
