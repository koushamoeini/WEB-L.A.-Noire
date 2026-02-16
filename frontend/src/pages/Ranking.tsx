import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import Sidebar from '../components/Sidebar';
import { investigationAPI } from '../services/investigationApi';
import './Ranking.css';

interface MostWantedSuspect {
  national_code: string;
  full_name: string;
  suspect_ids: number[];
  case_ids: number[];
  max_pursuit_days: number;
  max_crime_level: number;
  score: number;
  reward_amount: number;
  position?: { x: number; y: number };
}

const Ranking = () => {
  const [mostWanted, setMostWanted] = useState<MostWantedSuspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMostWanted();
  }, []);

  const fetchMostWanted = async () => {
    try {
      setLoading(true);
      const data = await investigationAPI.listMostWanted();
      
      // Load saved positions or generate defaults
      const savedPos = JSON.parse(localStorage.getItem('most-wanted-pos') || '{}');
      
      const enrichedData = data.map((s: any, index: number) => {
        const key = s.national_code || `id-${s.suspect_ids[0]}`;
        const defaultPos = { 
          x: 50 + (index % 4) * 320, 
          y: 50 + Math.floor(index / 4) * 350 
        };
        return {
          ...s,
          position: savedPos[key] || defaultPos
        };
      });
      
      setMostWanted(enrichedData);
    } catch (error) {
      console.error('Failed to fetch most wanted:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    setDraggingIndex(index);
    setDragOffset({
      x: e.clientX - mostWanted[index].position!.x,
      y: e.clientY - mostWanted[index].position!.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIndex === null) return;

    setMostWanted(prev => prev.map((s, idx) => {
      if (idx === draggingIndex) {
        return {
          ...s,
          position: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        };
      }
      return s;
    }));
  };

  const handleMouseUp = () => {
    if (draggingIndex !== null) {
      // Save positions to localStorage
      const positions: any = {};
      mostWanted.forEach(s => {
        const key = s.national_code || `id-${s.suspect_ids[0]}`;
        positions[key] = s.position;
      });
      localStorage.setItem('most-wanted-pos', JSON.stringify(positions));
    }
    setDraggingIndex(null);
  };

  const handleExport = async () => {
    if (!boardRef.current) return;
    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#0a0a0a',
        useCORS: true,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `intensive-pursuit-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export board:', error);
    }
  };

  return (
    <div className="layout-with-sidebar" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <Sidebar />
      <div className="main-content">
        <div className="ranking-content">
          <header className="ranking-header">
            <h1>تحت پیگیری شدید</h1>
            <div className="actions-top">
              <button className="btn-gold-solid export-btn" onClick={handleExport}>
                📸 خروجی تصویر
              </button>
              <button className="btn-gold-outline" onClick={fetchMostWanted}>
                🔄 بروزرسانی
              </button>
            </div>
          </header>

          <div 
            className="ranking-board" 
            ref={boardRef}
          >
            {loading ? (
              <div className="no-data-pursuit">
                <h2>در حال بارگذاری لیست سیاه...</h2>
              </div>
            ) : mostWanted.length === 0 ? (
              <div className="no-data-pursuit">
                <h2>هیچ جرمی تحت پیگیری شدید یافت نشد</h2>
                <p>تنها مجرمانی که بیش از ۳۰ روز فراری باشند در این لیست قرار می‌گیرند.</p>
              </div>
            ) : (
              mostWanted.map((s, index) => (
                <div 
                  key={index}
                  className="most-wanted-card"
                  style={{
                    left: `${s.position?.x}px`,
                    top: `${s.position?.y}px`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                >
                  <div className="tag-intensive">UNDER INTENSIVE PURSUIT</div>
                  <div className="wanted-image-container">
                    <span className="wanted-placeholder">👤</span>
                  </div>
                  <div className="wanted-info">
                    <h3 className="wanted-name">{s.full_name}</h3>
                    <div className="wanted-score">
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>امتیاز پیگیری: </span>
                      {s.score}
                    </div>
                    <div className="wanted-details">
                      مدت فرار: {s.max_pursuit_days} روز<br />
                      سطح جرم: {s.max_crime_level}<br />
                      کد ملی: {s.national_code || 'نامعلوم'}
                    </div>
                    <div className="wanted-meta">
                      <span className="reward-badge">💰 پاداش: {s.reward_amount.toLocaleString()} ریال</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
