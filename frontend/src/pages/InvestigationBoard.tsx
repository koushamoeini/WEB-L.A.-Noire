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
  const BACKEND_URL = 'http://localhost:8000';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('case');
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [connections, setConnections] = useState<BoardConnection[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteFrom, setDeleteFrom] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  // Lists for sidebar
  const [availableEvidence, setAvailableEvidence] = useState<any[]>([]);
  const [availableSuspects, setAvailableSuspects] = useState<any[]>([]);
  const [showItemSidebars, setShowItemSidebars] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (caseId) {
      fetchBoardData();
    }
  }, [caseId]);

  // Persist positions to localStorage
  useEffect(() => {
    if (boardItems.length > 0 && caseId) {
      const positions = boardItems.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.position
      }), {});
      localStorage.setItem(`board-pos-${caseId}`, JSON.stringify(positions));
    }
  }, [boardItems, caseId]);

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
      const [evidences, suspects, conns] = await Promise.all([
        evidenceAPI.listAllEvidence(parseInt(caseId)),
        investigationAPI.listSuspects(parseInt(caseId)),
        investigationAPI.listConnections(parseInt(caseId)),
      ]);

      setAvailableEvidence(evidences);
      setAvailableSuspects(suspects);

      setBoardItems(prev => {
        // Create a map of existing positions by ID
        const posMap = new Map(prev.map(i => [i.id, i.position]));
        
        // Load from localStorage as fallback
        const savedPos = JSON.parse(localStorage.getItem(`board-pos-${caseId}`) || '{}');

        const evidenceItems: BoardItem[] = evidences
          .filter((e) => e.is_on_board)
          .map((e, index) => {
            const itemId = `evidence-${e.id}`;
            const position = posMap.get(itemId) || savedPos[itemId] || { x: 50 + (index % 3) * 200, y: 50 + Math.floor(index / 3) * 220 };
            return {
              id: itemId,
              type: 'evidence',
              title: e.title,
              description: e.type_display,
              position,
              actualId: e.id,
              image: e.images?.[0]?.image,
            };
          });

        const suspectItems: BoardItem[] = suspects
          .filter((s) => s.is_on_board)
          .map((s, index) => {
            const itemId = `suspect-${s.id}`;
            const position = posMap.get(itemId) || savedPos[itemId] || { x: 700 + (index % 2) * 200, y: 50 + Math.floor(index / 2) * 250 };
            return {
              id: itemId,
              type: 'suspect',
              title: `${s.first_name} ${s.last_name}`,
              description: s.is_main_suspect ? 'عنصر کلیدی' : 'مظنون',
              position,
              actualId: s.id,
              image: s.image,
            };
          });

        return [...evidenceItems, ...suspectItems];
      });
      
      setConnections(conns);
    } catch (error) {
      console.error('Failed to fetch board data:', error);
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
    } else if (deleteMode) {
      if (!deleteFrom) {
        setDeleteFrom(itemId);
      } else {
        handleTwoItemsDelete(deleteFrom, itemId);
        setDeleteFrom(null);
        setDeleteMode(false);
      }
    } else {
      setSelectedItem(itemId === selectedItem ? null : itemId);
    }
  };

  const handleTwoItemsDelete = async (id1: string, id2: string) => {
    if (!caseId || id1 === id2) return;
    
    // Find connection between these two items
    const conn = connections.find(c => {
      const cFrom = c.from_evidence ? `evidence-${c.from_evidence}` : `suspect-${c.from_suspect}`;
      const cTo = c.to_evidence ? `evidence-${c.to_evidence}` : `suspect-${c.to_suspect}`;
      return (cFrom === id1 && cTo === id2) || (cFrom === id2 && cTo === id1);
    });

    if (conn) {
      try {
        await investigationAPI.deleteConnection(conn.id);
        fetchBoardData();
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    } else {
      alert('اتصالی میان این دو مورد یافت نشد.');
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
        scale: 2, // Better quality
      });
      const link = document.createElement('a');
      link.download = `detective-board-${caseId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const toggleSuspectOnBoard = async (id: number) => {
    try {
      await investigationAPI.toggleSuspectBoard(id);
      fetchBoardData();
    } catch (error) {
      console.error('Failed to toggle suspect:', error);
    }
  };

  const toggleEvidenceOnBoard = async (type: string, id: number) => {
    try {
      await evidenceAPI.toggleBoard(type, id);
      fetchBoardData();
    } catch (error) {
      console.error('Failed to toggle evidence:', error);
    }
  };

  const getImageUrl = (path: string | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    let fullUrl = `${BACKEND_URL}${path}`;
    if (!path.includes('/media/')) {
      fullUrl = `${BACKEND_URL}/media${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return fullUrl;
  };

  const renderConnections = () => {
    return connections.map((conn) => {
      const fromId = conn.from_evidence ? `evidence-${conn.from_evidence}` : `suspect-${conn.from_suspect}`;
      const toId = conn.to_evidence ? `evidence-${conn.to_evidence}` : `suspect-${conn.to_suspect}`;

      const fromItem = boardItems.find(i => i.id === fromId);
      const toItem = boardItems.find(i => i.id === toId);

      if (!fromItem || !toItem) return null;

      return (
        <g key={conn.id} className="connection-group">
          <line
            x1={fromItem.position.x + 75}
            y1={fromItem.position.y}
            x2={toItem.position.x + 75}
            y2={toItem.position.y}
            className="yarn-connection"
          />
        </g>
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
                <div
                  key={c.id}
                  className="lux-card case-select-card"
                  onClick={() => navigate(`/investigation?case=${c.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={`status-badge status-${c.status}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {c.status_label}
                    </span>
                    <span className="red-badge">#{c.id}</span>
                  </div>
                  <h3 className="gold-text case-select-title">{c.title}</h3>
                  <p className="case-select-description">
                    {c.description.substring(0, 100)}...
                  </p>
                  <button className="btn-gold-outline case-select-btn">
                    نمایش تخته پرونده
                  </button>
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
            <button className="btn-lux" onClick={() => setShowItemSidebars(!showItemSidebars)}>
              {showItemSidebars ? 'مخفی‌سازی لیست‌ها' : 'نمایش لیست مدارک'}
            </button>
            <button className={`btn-lux ${connectMode ? 'active' : ''}`} onClick={() => {
              setConnectMode(!connectMode);
              setDeleteMode(false);
              setConnectFrom(null);
            }}>
              {connectMode ? 'در حال اتصال...' : 'ایجاد اتصال'}
            </button>
            <button className={`btn-lux ${deleteMode ? 'active' : ''}`} onClick={() => {
              setDeleteMode(!deleteMode);
              setConnectMode(false);
              setDeleteFrom(null);
            }}>
              {deleteMode ? 'آماده حذف...' : 'حذف اتصال'}
            </button>
            <button className="btn-lux export" onClick={exportAsImage}>
              خروجی تصویر (گزارش)
            </button>
            <button className="btn-lux back" onClick={() => navigate('/cases/' + caseId)}>
              بازگشت به پرونده
            </button>
          </div>
        </div>

        <div className="investigation-layout">
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
                className={`polaroid ${item.type} ${selectedItem === item.id ? 'selected' : ''} ${connectFrom === item.id || deleteFrom === item.id ? 'connecting' : ''}`}
                style={{ left: item.position.x, top: item.position.y }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                onClick={() => handleItemClick(item.id)}
              >
                <div className="thumbtack" />
                <div className="photo">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.title} />
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

          {showItemSidebars && (
            <div className="board-item-sidebars">
              <div className="item-sidebar">
                <h3>مظنونین</h3>
                <div className="item-list">
                  {availableSuspects.map(s => (
                    <div key={s.id} className={`item-mini-card ${s.is_on_board ? 'active' : ''}`} onClick={() => toggleSuspectOnBoard(s.id)}>
                      <div className="item-avatar">
                        {s.image ? (
                          <img src={getImageUrl(s.image)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : '👤'}
                      </div>
                      <div className="item-info">
                        <span className="item-name">{s.first_name} {s.last_name}</span>
                        <span className="item-status">{s.is_on_board ? 'روی تخته' : 'افزودن'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="item-sidebar">
                <h3>شواهد</h3>
                <div className="item-list">
                  {availableEvidence.map(e => (
                    <div key={e.id} className={`item-mini-card ${e.is_on_board ? 'active' : ''}`} onClick={() => toggleEvidenceOnBoard('all', e.id)}>
                      <div className="item-avatar">
                        {e.images && e.images.length > 0 ? (
                          <img src={getImageUrl(e.images[0].image)} alt="" className="mini-thumb" />
                        ) : (
                          '🔍'
                        )}
                      </div>
                      <div className="item-info">
                        <span className="item-name">{e.title}</span>
                        <span className="item-status">{e.is_on_board ? 'روی تخته' : 'افزودن'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
