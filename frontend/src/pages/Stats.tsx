import Sidebar from '../components/Sidebar';

const Stats = () => {
  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content" style={{ padding: '60px', color: '#fff' }}>
        <h1 className="gold-text" style={{ fontSize: '3rem', marginBottom: '40px' }}>آمار و گزارشات</h1>
        <div className="lux-card">
          <h3 className="gold-text" style={{ marginBottom: '20px' }}>تحلیل داده‌های آماری</h3>
          <p style={{ color: '#ccc', lineHeight: '1.8' }}>
            تحلیل داده‌های آماری کلانتری در حال بارگذاری است. نمودارهای وقوع جرم، تراکم پرونده‌ها و عملکرد افسران در این بخش قرار می‌گیرد.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
