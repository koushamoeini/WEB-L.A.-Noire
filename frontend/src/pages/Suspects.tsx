import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { investigationAPI } from '../services/investigationApi';
import { caseAPI } from '../services/caseApi';
import type { Suspect } from '../types/investigation';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './Suspects.css';

export default function Suspects() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case');
  const navigate = useNavigate();
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    case: caseId || '',
    name: '',
    details: '',
    is_main_suspect: false,
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
      await investigationAPI.createSuspect({
        case: parseInt(formData.case),
        name: formData.name,
        details: formData.details,
        is_main_suspect: formData.is_main_suspect,
      });
      setShowForm(false);
      setFormData({ case: caseId || '', name: '', details: '', is_main_suspect: false });
      fetchData();
    } catch (error) {
      console.error('Failed to create suspect:', error);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="suspects-header">
          <h1>مدیریت متهمان {caseId ? `- پرونده ${caseId}` : ''}</h1>
          <button className="btn-gold-outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'لغو' : 'افزودن متهم جدید'}
          </button>
        </div>

        {showForm && (
          <form className="suspect-form" onSubmit={handleSubmit}>
            <h3>ثبت متهم جدید</h3>
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
                    {c.title} - {c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>نام متهم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>جزئیات *</label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="is_main_suspect"
                checked={formData.is_main_suspect}
                onChange={(e) =>
                  setFormData({ ...formData, is_main_suspect: e.target.checked })
                }
              />
              <label htmlFor="is_main_suspect">متهم اصلی</label>
            </div>

            <button type="submit" className="btn-gold-solid" style={{ width: '100%', marginTop: '20px' }}>
              ذخیره متهم
            </button>
          </form>
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
              <div key={suspect.id} className="suspect-card">
                <div className="suspect-header">
                  <h3>{suspect.name}</h3>
                  {suspect.is_main_suspect && (
                    <span className="main-suspect-badge">متهم اصلی</span>
                  )}
                  {suspect.is_on_board && (
                    <span className="board-badge">روی تخته</span>
                  )}
                </div>
                <p className="suspect-details">{suspect.details}</p>
                <div className="suspect-actions">
                  <button
                    className="btn btn-info"
                    style={{ width: '100%' }}
                    onClick={() =>
                      navigate(`/investigation?case=${suspect.case}`)
                    }
                  >
                    مشاهده در تخته کارآگاه
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
