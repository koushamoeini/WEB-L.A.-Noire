import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../services/caseApi';
import { CRIME_LEVELS } from '../types/case';
import type { CreateCaseFromSceneRequest, SceneWitness } from '../types/case';
import Sidebar from '../components/Sidebar';
import './CreateCase.css';
import { useAuth } from '../context/AuthContext';

const CreateCaseScene = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roles = user?.roles?.map(r => r.code) || [];
    const isPolice = roles.some(r => ['police_officer', 'sergeant', 'detective', 'captain', 'police_chief'].includes(r));
    if (!isPolice && !user?.is_superuser) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const currentYear = 1404; // Current Persian year
  const [formData, setFormData] = useState<CreateCaseFromSceneRequest>({
    title: '',
    description: '',
    crime_level: 3,
    location: '',
    occurrence_time: '',
    witnesses: [],
  });
  const [persianDate, setPersianDate] = useState({ year: currentYear, month: 1, day: 1 });
  const [selectedTime, setSelectedTime] = useState({ hour: '12', minute: '00' });
  const [witnessForm, setWitnessForm] = useState<SceneWitness>({
    phone: '',
    national_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Persian month names
  const persianMonths = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' },
  ];

  // Get days in month
  const getDaysInMonth = (month: number) => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 29;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'crime_level' ? parseInt(value) : value,
    });
  };

  const handleWitnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWitnessForm({
      ...witnessForm,
      [name]: value,
    });
  };

  const addWitness = () => {
    if (witnessForm.phone && witnessForm.national_code) {
      setFormData({
        ...formData,
        witnesses: [...formData.witnesses, { ...witnessForm }],
      });
      setWitnessForm({ phone: '', national_code: '' });
    }
  };

  const removeWitness = (index: number) => {
    setFormData({
      ...formData,
      witnesses: formData.witnesses.filter((_, i) => i !== index),
    });
  };

  const jalaliToGregorian = (jYear: number, jMonth: number, jDay: number) => {
    const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    
    let jy = jYear - 979;
    let jm = jMonth - 1;
    let jd = jDay - 1;

    let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
    for (let i = 0; i < jm; ++i) j_day_no += j_days_in_month[i];

    j_day_no += jd;

    let g_day_no = j_day_no + 79;

    let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
    g_day_no = g_day_no % 146097;

    let leap = true;
    if (g_day_no >= 36525) {
      g_day_no--;
      gy += 100 * Math.floor(g_day_no / 36524);
      g_day_no = g_day_no % 36524;

      if (g_day_no >= 365) g_day_no++;
      leap = false;
    }

    gy += 4 * Math.floor(g_day_no / 1461);
    g_day_no %= 1461;

    if (g_day_no >= 366) {
      leap = false;

      g_day_no--;
      gy += Math.floor(g_day_no / 365);
      g_day_no = g_day_no % 365;
    }

    let gm = 0;
    for (let i = 0; g_day_no >= g_days_in_month[i] + (i === 1 && leap ? 1 : 0); i++) {
      g_day_no -= g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
      gm++;
    }
    let gd = g_day_no + 1;

    return { year: gy, month: gm + 1, day: gd };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert Jalali to Gregorian
      const gDate = jalaliToGregorian(persianDate.year, persianDate.month, persianDate.day);
      // Format as ISO datetime
      const isoDateTime = `${gDate.year}-${String(gDate.month).padStart(2, '0')}-${String(gDate.day).padStart(2, '0')}T${selectedTime.hour}:${selectedTime.minute}:00`;
      
      const dataToSubmit = {
        ...formData,
        occurrence_time: isoDateTime,
      };

      await caseAPI.createCaseFromScene(dataToSubmit);
      navigate('/cases', { state: { message: 'صحنه جرم با موفقیت ثبت شد' } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'خطا در ثبت صحنه جرم';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="create-case-container">
      <div className="create-case-card">
        <h1 className="create-case-title">ثبت صحنه جرم</h1>
        <p className="create-case-subtitle">
          اطلاعات صحنه جرم را ثبت کنید
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-case-form">
          <div className="form-group">
            <label htmlFor="title">عنوان پرونده</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="عنوان پرونده را وارد کنید"
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
              placeholder="توضیحات صحنه جرم را وارد کنید"
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">محل وقوع</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="آدرس دقیق محل وقوع را وارد کنید"
            />
          </div>

          <div className="form-group">
            <label>تاریخ وقوع (شمسی)</label>
            <div className="persian-date-selectors">
              <div className="date-selector-group">
                <label htmlFor="year">سال</label>
                <select
                  id="year"
                  value={persianDate.year}
                  onChange={(e) => setPersianDate({ ...persianDate, year: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="date-selector-group">
                <label htmlFor="month">ماه</label>
                <select
                  id="month"
                  value={persianDate.month}
                  onChange={(e) => setPersianDate({ ...persianDate, month: parseInt(e.target.value), day: 1 })}
                >
                  {persianMonths.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div className="date-selector-group">
                <label htmlFor="day">روز</label>
                <select
                  id="day"
                  value={persianDate.day}
                  onChange={(e) => setPersianDate({ ...persianDate, day: parseInt(e.target.value) })}
                >
                  {Array.from({ length: getDaysInMonth(persianDate.month) }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="selected-date-display">
              تاریخ انتخاب شده: {persianDate.year}/{persianDate.month}/{persianDate.day}
            </div>
          </div>

          <div className="form-group">
            <label>ساعت وقوع</label>
            <div className="time-inputs">
              <div className="time-input-group">
                <label htmlFor="hour">ساعت</label>
                <input
                  type="number"
                  id="hour"
                  min="0"
                  max="23"
                  value={selectedTime.hour}
                  onChange={(e) => setSelectedTime({ ...selectedTime, hour: e.target.value.padStart(2, '0') })}
                  placeholder="12"
                />
              </div>
              <span className="time-separator">:</span>
              <div className="time-input-group">
                <label htmlFor="minute">دقیقه</label>
                <input
                  type="number"
                  id="minute"
                  min="0"
                  max="59"
                  value={selectedTime.minute}
                  onChange={(e) => setSelectedTime({ ...selectedTime, minute: e.target.value.padStart(2, '0') })}
                  placeholder="00"
                />
              </div>
            </div>
          </div>

          <div className="witnesses-section">
            <h3>شهود</h3>
            
            <div className="witness-form">
              <div className="form-group">
                <label htmlFor="phone">شماره تماس</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={witnessForm.phone}
                  onChange={handleWitnessChange}
                  placeholder="09123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="national_code">کد ملی</label>
                <input
                  type="text"
                  id="national_code"
                  name="national_code"
                  value={witnessForm.national_code}
                  onChange={handleWitnessChange}
                  placeholder="1234567890"
                  pattern="[0-9]{10}"
                />
              </div>

              <button 
                type="button" 
                onClick={addWitness}
                className="btn-gold-solid"
                disabled={!witnessForm.phone || !witnessForm.national_code}
                style={{ padding: '13px 20px' }}
              >
                افزودن
              </button>
            </div>

            {formData.witnesses.length > 0 && (
              <div className="witnesses-list">
                {formData.witnesses.map((witness, index) => (
                  <div key={index} className="witness-item">
                    <span>{witness.phone} - {witness.national_code}</span>
                    <button
                      type="button"
                      onClick={() => removeWitness(index)}
                      className="btn-remove"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-gold-solid" disabled={loading}>
              {loading ? 'در حال ثبت...' : 'ثبت صحنه جرم'}
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

export default CreateCaseScene;
