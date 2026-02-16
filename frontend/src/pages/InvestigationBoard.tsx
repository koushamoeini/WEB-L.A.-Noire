import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { investigationAPI } from '../services/investigationApi';
import { evidenceAPI } from '../services/evidenceApi';
import { caseAPI } from '../services/caseApi';
import type { BoardConnection } from '../types/investigation';
import type { Case } from '../types/case';
import Sidebar from '../components/Sidebar';
import './InvestigationBoard.css';

interface BoardItem {
  id: string;
  type: 'evidence' | 'suspect';
  title: string;
  description: string;
  position: { x: number; y: number };
  actualId: number;
  image?: string;
}

export default function InvestigationBoard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('case');
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [connections, setConnections] = useState<BoardConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (caseId) {
      fetchBoardData();
    }
  }, [caseId]);

  const fetchCases = async () => {
    try {
      const data = await caseAPI.listCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  const fetchBoardData = async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      const [evidences, suspects, conns] = await Promise.all([
        evidenceAPI.listAllEvidence(parseInt(caseId)),
        investigationAPI.listSuspects(parseInt(caseId)),
        investigationAPI.listConnections(parseInt(caseId)),
      ]);

      const evidenceItems: BoardItem[] = evidences
        .filter((e) => e.is_on_board)
        .map((e, index) => ({
          id: `evidence-${e.id}`,
          type: 'evidence',
          title: e.title,
          description: e.type_display,
          position: { x: 50 + (index % 3) * 200, y: 50 + Math.floor(index / 3) * 220 },
          actualId: e.id,
          image: e.images?.[0]?.image,
        }));

      const suspectItems: BoardItem[] = suspects
        .filter((s) => s.is_on_board)
        .map((s, index) => ({
          id: `suspect-${s.id}`,
          type: 'suspect',
          title: s.name,
          description: s.is_main_suspect ? 'متهم اصلی' : 'مظنون',
          position: { x: 700 + (index % 2) * 200, y: 50 + Math.floor(index / 2) * 250 },
          actualId: s.id,
        }));

      setBoardItems([...evidenceItems, ...suspectItems]);
      setConnections(conns);
    } catch (error) {
      console.error('Failed to fetch board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (connectMode) return;
    const item = boardItems.find(i => i.id === itemId);
    if (!item) return;

    setDraggingItem(itemId);
    setDragOffset({
      x: e.clientX - item.position.x,
      y: e.clientY - item.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingItem) return;

    setBoardItems(prev => prev.map(item => {
      if (item.id === draggingItem) {
        return {
          ...item,
          position: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        };
      }
      return item;
    }));
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
  };

  const handleItemClick = (itemId: string) => {
    if (connectMode) {
      if (!connectFrom) {
        setConnectFrom(itemId);
      } else {
        createConnection(connectFrom, itemId);
        setConnectFrom(null);
        setConnectMode(false);
      }
    } else {
      setSelectedItem(itemId === selectedItem ? null : itemId);
    }
  };

  const createConnection = async (fromId: string, toId: string) => {
    if (!caseId || fromId === toId) return;
    const fromItem = boardItems.find(i => i.id === fromId);
    const toItem = boardItems.find(i => i.id === toId);
    if (!fromItem || !toItem) return;

    try {
      await investigationAPI.createConnection({
        case: parseInt(caseId),
        from_evidence: fromItem.type === 'evidence' ? fromItem.actualId : undefined,
        from_suspect: fromItem.type === 'suspect' ? fromItem.actualId : undefined,
        to_evidence: toItem.type === 'evidence' ? toItem.actualId : undefined,
        to_suspect: toItem.type === 'suspect' ? toItem.actualId : undefined,
      });
      fetchBoardData();
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  };

  const exportAsImage = async () => {
    if (!boardRef.current) return;
    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#2c1a12',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `detective-board-${caseId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromId = conn.from_evidence ? `evidence-${conn.from_evidence}` : `suspect-${conn.from_suspect}`;
      const toId = conn.to_evidence ? `evidence-${conn.to_evidence}` : `suspect-${conn.to_suspect}`;

      const fromItem = boardItems.find(i => i.id === fromId);
      const toItem = boardItems.find(i => i.id === toId);

      if (!fromItem || !toItem) return null;

      return (
        <line
          key={index}
          x1={fromItem.position.x + 75}
          y1={fromItem.position.y + 75}
          x2={toItem.position.x + 75}
          y2={toItem.position.y + 75}
          className="yarn-connection"
        />
      );
    });
  };

  if (!caseId) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar />
        <div className="main-content">
          <div className="evidence-container">
            <div className="evidence-header">
              <h1>انتخاب پرونده برای تخته تحقیقات</h1>
            </div>
            <div className="evidence-grid">
              {cases.map((c) => (
                <div key={c.id} className="evidence-card" onClick={() => navigate(`/investigation?case=${c.id}`)}>
                  <div className="evidence-card-header"><span className="evidence-type-badge">#{c.id}</span></div>
                  <h3>{c.title}</h3>
                  <p className="evidence-description">{c.description.substring(0, 100)}...</p>
                  <button className="btn btn-secondary" style={{ width: '100%' }}>بازگشایی پرونده</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="board-header-luxury">
          <div className="case-info">
            <h2>{cases.find(c => c.id === parseInt(caseId))?.title}</h2>
            <span>شناسه پرونده: {caseId}</span>
          </div>
          <div className="board-actions">
            <button className={`btn-lux ${connectMode ? 'active' : ''}`} onClick={() => setConnectMode(!connectMode)}>
              {connectMode ? 'در حال اتصال...' : 'ایجاد اتصال میان مدارک'}
            </button>
            <button className="btn-lux export" onClick={exportAsImage}>
              خروجی تصویر (گزارش)
            </button>
            <button className="btn-lux back" onClick={() => navigate('/cases/' + caseId)}>
              بازگشت به پرونده
            </button>
          </div>
        </div>

        <div 
          className="cork-board" 
          ref={boardRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="yarn-svg">
            {renderConnections()}
          </svg>

          {boardItems.map((item) => (
            <div
              key={item.id}
              className={`polaroid ${item.type} ${selectedItem === item.id ? 'selected' : ''} ${connectFrom === item.id ? 'connecting' : ''}`}
              style={{ left: item.position.x, top: item.position.y }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onClick={() => handleItemClick(item.id)}
            >
              <div className="thumbtack" />
              <div className="photo">
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <div className="no-photo">{item.type === 'suspect' ? '👤' : '🔍'}</div>
                )}
              </div>
              <div className="caption">
                <p className="label">{item.description}</p>
                <p className="title">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
