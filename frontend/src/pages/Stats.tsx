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
      <div className="main-content" style={{ padding: '24px' }}>
        <h1 className="gold-text" style={{ fontSize: '2.2rem', marginBottom: 16 }}>
          گزارش‌گیری کلی (۵.۷)
        </h1>

        {!allowed && (
          <div className="lux-card" style={{ padding: 16, color: '#fff' }}>
            <p style={{ color: '#ccc', lineHeight: 1.8, margin: 0 }}>
              این صفحه برای نقش‌های <b>قاضی</b>، <b>کاپیتان</b> و <b>رئیس پلیس</b> طراحی شده است.
              <br />
              اگر فکر می‌کنید باید دسترسی داشته باشید، از مدیر سامانه بخواهید نقش مناسب را به حساب شما اضافه کند.
            </p>
          </div>
        )}

        {allowed && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '360px 1fr',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <div className="lux-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="gold-text" style={{ margin: 0 }}>
                  پرونده‌ها
                </h3>
                <span style={{ color: '#999', fontSize: 12 }}>{cases.length}</span>
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو: عنوان، توضیحات، وضعیت، شماره"
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.25)',
                  color: '#fff',
                  outline: 'none',
                }}
              />

              <div style={{ marginTop: 12, maxHeight: '65vh', overflow: 'auto' }}>
                {loadingCases ? (
                  <div style={{ color: '#ccc', padding: 12 }}>در حال بارگذاری لیست...</div>
                ) : filteredCases.length === 0 ? (
                  <div style={{ color: '#ccc', padding: 12 }}>پرونده‌ای پیدا نشد.</div>
                ) : (
                  filteredCases.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: 12,
                          borderRadius: 12,
                          border: active
                            ? '1px solid rgba(212,175,55,0.55)'
                            : '1px solid rgba(255,255,255,0.10)',
                          background: active ? 'rgba(212,175,55,0.12)' : 'rgba(0,0,0,0.18)',
                          color: '#fff',
                          cursor: 'pointer',
                          marginTop: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontWeight: 700 }}>
                            #{c.id} — {c.title}
                          </div>
                          <div style={{ color: '#aaa', fontSize: 12 }}>{c.level_label}</div>
                        </div>
                        <div style={{ color: '#bbb', fontSize: 12, marginTop: 6 }}>
                          {c.status_label}
                          {' • '}
                          {new Date(c.created_at).toLocaleDateString('fa-IR')}
                        </div>
                        <div style={{ color: '#ccc', fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
                          {c.description?.slice(0, 90)}
                          {c.description && c.description.length > 90 ? '…' : ''}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lux-card" style={{ padding: 16 }}>
              <h3 className="gold-text" style={{ marginTop: 0 }}>
                گزارش پرونده
              </h3>

              {error && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(255,90,90,0.35)',
                    background: 'rgba(255,90,90,0.08)',
                    color: '#ffd2d2',
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              )}

              {!selectedId && (
                <div style={{ color: '#ccc', lineHeight: 1.8 }}>
                  یک پرونده از ستون سمت چپ انتخاب کنید تا گزارش کامل آن نمایش داده شود.
                </div>
              )}

              {selectedId && loadingReport && <div style={{ color: '#ccc' }}>در حال بارگذاری گزارش...</div>}

              {selectedId && !loadingReport && report && (
                <div style={{ display: 'grid', gap: 14 }}>
                  <section style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>پرونده</div>
                        <div style={{ fontWeight: 800, color: '#fff' }}>
                          #{report.case.id} — {report.case.title}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>وضعیت</div>
                        <div style={{ color: '#fff' }}>{report.case.status_label}</div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>سطح جرم</div>
                        <div style={{ color: '#fff' }}>{report.case.level_label}</div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>تاریخ تشکیل</div>
                        <div style={{ color: '#fff' }}>
                          {new Date(report.case.created_at).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, color: '#ddd', lineHeight: 1.8 }}>{report.case.description}</div>
                  </section>

                  <section style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 12 }}>
                    <h4 className="gold-text" style={{ marginTop: 0 }}>
                      شواهد و استشهادها ({report.evidence?.length ?? 0})
                    </h4>
                    {report.evidence?.length ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {report.evidence.map((ev) => (
                          <div key={ev.id} style={{ padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{ev.title}</div>
                              <div style={{ color: '#aaa', fontSize: 12 }}>{ev.type_display}</div>
                            </div>
                            <div style={{ color: '#ccc', marginTop: 6, lineHeight: 1.7 }}>{ev.description}</div>
                            <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
                              ثبت‌کننده: {ev.recorder_name} • تاریخ: {new Date(ev.recorded_at).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#ccc' }}>مدرکی ثبت نشده است.</div>
                    )}
                  </section>

                  <section style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 12 }}>
                    <h4 className="gold-text" style={{ marginTop: 0 }}>
                      مظنونین ({report.suspects?.length ?? 0})
                    </h4>
                    {report.suspects?.length ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {report.suspects.map((s) => (
                          <div key={s.id} style={{ padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{s.name}</div>
                              <div style={{ color: '#aaa', fontSize: 12 }}>{s.is_main_suspect ? 'مظنون اصلی' : 'مظنون'}</div>
                            </div>
                            <div style={{ color: '#ccc', marginTop: 6, lineHeight: 1.7 }}>{s.details}</div>

                            {s.interrogations && s.interrogations.length > 0 && (
                              <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                                <div style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>
                                  بازجویی‌ها ({s.interrogations.length})
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                  {s.interrogations.map((i) => (
                                    <div key={i.id} style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ color: '#ddd' }}>
                                          بازجو: {i.interrogator_name ?? i.interrogator}
                                        </div>
                                        <div style={{ color: '#ddd' }}>امتیاز: {i.score}</div>
                                      </div>
                                      <div style={{ color: '#bbb', fontSize: 12, marginTop: 6, lineHeight: 1.7 }}>
                                        {i.transcript?.slice(0, 160)}
                                        {i.transcript && i.transcript.length > 160 ? '…' : ''}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#ccc' }}>مظنونی ثبت نشده است.</div>
                    )}
                  </section>

                  <section style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 12 }}>
                    <h4 className="gold-text" style={{ marginTop: 0 }}>
                      احکام / نتایج دادگاه ({report.verdicts?.length ?? 0})
                    </h4>
                    {report.verdicts?.length ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {report.verdicts.map((v) => (
                          <div key={v.id} style={{ padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 800, color: '#fff' }}>{v.title}</div>
                              <div style={{ color: '#aaa', fontSize: 12 }}>{v.result_display ?? v.result}</div>
                            </div>
                            <div style={{ color: '#ccc', marginTop: 6, lineHeight: 1.7 }}>{v.description}</div>
                            {v.punishment && <div style={{ color: '#ddd', marginTop: 6 }}>مجازات: {v.punishment}</div>}
                            <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
                              قاضی: {v.judge_username ?? v.judge ?? '-'} • تاریخ: {new Date(v.created_at).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#ccc' }}>حکمی ثبت نشده است.</div>
                    )}
                  </section>

                  <section style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 12 }}>
                    <h4 className="gold-text" style={{ marginTop: 0 }}>
                      افراد دخیل ({report.officers_involved?.length ?? 0})
                    </h4>
                    {report.officers_involved?.length ? (
                      <ul style={{ margin: 0, paddingInlineStart: 18, color: '#ddd', lineHeight: 1.9 }}>
                        {report.officers_involved.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: '#ccc' }}>اطلاعاتی ثبت نشده است.</div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
