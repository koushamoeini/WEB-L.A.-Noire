import Sidebar from '../components/Sidebar';

const Ranking = () => {
  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content" style={{ padding: '40px', color: '#fff' }}>
        <h1 style={{ color: '#d4af37' }}>رتبه‌بندی مجرمان</h1>
        <p>این ماژول در حال پیاده‌سازی است...</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#1a1a1a', border: '1px solid #333' }}>
          <p>لیست خطرناک‌ترین مجرمان شهر لوس‌آنجلس در اینجا نمایش داده خواهد شد.</p>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
