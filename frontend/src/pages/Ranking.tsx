import Sidebar from '../components/Sidebar';

const Ranking = () => {
  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content" style={{ padding: '60px', color: '#fff' }}>
        <h1 className="gold-text" style={{ fontSize: '3rem', marginBottom: '40px' }}>رتبه‌بندی مجرمان</h1>
        <div className="lux-card">
          <h3 className="gold-text" style={{ marginBottom: '20px' }}>لیست تحت تعقیب</h3>
          <p style={{ color: '#ccc', lineHeight: '1.8' }}>
            این ماژول در حال پیاده‌سازی است. در این بخش لیست خطرناک‌ترین مجرمان شهر با جزئیات کامل نمایش داده خواهد شد.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
