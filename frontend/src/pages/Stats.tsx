import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { caseAPI } from '../services/caseApi';
import type { Case } from '../types/case';
import type { TrialHistoryReport } from '../types/report';
import { useAuth } from '../context/AuthContext';

const Stats = () => {
  const { user } = useAuth();
  const roles = user?.roles?.map((r) => r.code) ?? [];

  const allowed =
    user?.is_superuser ||
    roles.includes('judge') ||
    roles.includes('qazi') ||
    roles.includes('captain') ||
    roles.includes('police_chief');

  const [cases, setCases] = useState<Case[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<TrialHistoryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCases(true);
        setError(null);
        const list = await caseAPI.listCases();
        const sorted = [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCases(sorted);
      } catch (e) {
        console.error(e);
        setError('خطا در دریافت لیست پرونده‌ها');
      } finally {
        setLoadingCases(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setReport(null);
      return;
    }
    const loadReport = async () => {
      try {
        setLoadingReport(true);
        setError(null);
        const data = await caseAPI.getTrialHistory(selectedId);
        setReport(data);
      } catch (e) {
        console.error(e);
        setError('خطا در دریافت گزارش پرونده');
      } finally {
        setLoadingReport(false);
      }
    };
    loadReport();
  }, [selectedId]);

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) => {
      const hay = `${c.id} ${c.title} ${c.description} ${c.status_label} ${c.level_label}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cases, query]);

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
