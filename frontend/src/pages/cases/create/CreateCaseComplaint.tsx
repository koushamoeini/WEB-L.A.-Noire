import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../../../services/caseApi';
import { CRIME_LEVELS } from '../../../types/case';
import type { CreateCaseRequest } from '../../../types/case';
import Sidebar from '../../../components/Sidebar';
import './CreateCase.css';

const CreateCaseComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateCaseRequest>({
    title: '',
    description: '',
    crime_level: 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'crime_level' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await caseAPI.createCaseFromComplaint(formData);
      navigate('/cases', { state: { message: 'شکایت با موفقیت ثبت شد' } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'خطا در ثبت شکایت';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="create-case-container luxury-form-container">
      <div className="create-case-card module-card-luxury">
        <header className="page-header-lux">
          <h1 className="gold-text">ثبت شکایت جدید</h1>
          <p className="subtitle-lux">برای ثبت شکایت، اطلاعات پرونده را کامل وارد کنید</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-case-form">
          <div className="form-group">
            <label htmlFor="title">عنوان شکایت</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="عنوان شکایت را وارد کنید"
            />
          </div>

          <div className="form-group">
            <label htmlFor="crime_level">سطح جرم</label>
            <select
              id="crime_level"
              name="crime_level"
              value={formData.crime_level}
              onChange={handleChange}
            >
              {CRIME_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">توضیحات</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="توضیحات کامل شکایت را وارد کنید"
              rows={6}
            />
          </div>

          <div className="form-actions form-actions-lux">
            <button type="submit" className="btn-gold-solid" disabled={loading}>
              {loading ? 'در حال ثبت...' : 'ثبت شکایت'}
            </button>
            <button 
              type="button" 
              className="btn-gold-outline"
              onClick={() => navigate('/cases')}
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCaseComplaint;
