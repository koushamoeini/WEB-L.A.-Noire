import Sidebar from '../components/Sidebar';

const Stats = () => {
  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content" style={{ padding: '40px', color: '#fff' }}>
        <h1 style={{ color: '#d4af37' }}>آمار و گزارشات</h1>
        <p>تحلیل داده‌های آماری کلانتری در حال بارگذاری است...</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#1a1a1a', border: '1px solid #333' }}>
          <p>نمودارهای وقوع جرم، تراکم پرونده‌ها و عملکرد افسران در این بخش قرار می‌گیرد.</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
