import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

      // Only show items that are marked as "on board"
      const evidenceItems: BoardItem[] = evidences
        .filter((e) => e.is_on_board)
        .map((e, index) => ({
          id: `evidence-${e.id}`,
          type: 'evidence',
          title: e.title,
          description: e.type_display,
          position: { x: 100 + (index % 4) * 220, y: 80 + Math.floor(index / 4) * 180 },
          actualId: e.id,
        }));

      const suspectItems: BoardItem[] = suspects
        .filter((s) => s.is_on_board)
        .map((s, index) => ({
          id: `suspect-${s.id}`,
          type: 'suspect',
          title: s.name,
          description: s.is_main_suspect ? 'متهم اصلی' : 'مظنون',
          position: { x: 600 + (index % 3) * 220, y: 100 + Math.floor(index / 3) * 200 },
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

    const fromItem = boardItems.find((item) => item.id === fromId);
    const toItem = boardItems.find((item) => item.id === toId);

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

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromId = conn.from_evidence
        ? `evidence-${conn.from_evidence}`
        : conn.from_suspect
        ? `suspect-${conn.from_suspect}`
        : null;
      const toId = conn.to_evidence
        ? `evidence-${conn.to_evidence}`
        : conn.to_suspect
        ? `suspect-${conn.to_suspect}`
        : null;

      if (!fromId || !toId) return null;

      const fromItem = boardItems.find((item) => item.id === fromId);
      const toItem = boardItems.find((item) => item.id === toId);

      if (!fromItem || !toItem) return null;

      return (
        <line
          key={index}
          x1={fromItem.position.x + 60}
          y1={fromItem.position.y + 60}
          x2={toItem.position.x + 60}
          y2={toItem.position.y + 60}
          className="board-connection-line"
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
              <h1>تخته تحقیقات جنایی</h1>
              <div className="evidence-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/cases/create-scene')}
                >
                  ثبت پرونده جدید
                </button>
              </div>
            </div>

            <div className="evidence-grid">
              {cases.map((c) => (
                <div 
                  key={c.id} 
                  className="evidence-card"
                  onClick={() => navigate(`/investigation?case=${c.id}`)}
                >
                  <div className="evidence-card-header">
                    <span className="evidence-type-badge">پرونده #{c.id}</span>
                  </div>
                  <h3>{c.title}</h3>
                  <p className="evidence-description">
                    {c.description.substring(0, 150)}...
                  </p>
                  <div className="evidence-meta">
                    <div>
                      <small>ثبت‌کننده:</small>
                      <span>{c.creator_name}</span>
                    </div>
                    <div>
                      <small>تاریخ:</small>
                      <span>{new Date(c.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '10px' }}
                  >
                    مشاهده جزئیات و تخته
                  </button>
                </div>
              ))}
            </div>
            {cases.length === 0 && (
              <div className="no-data">
                <p>هیچ پرونده‌ای برای نمایش وجود ندارد.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="board-header">
          <h1>تخته کارآگاه - پرونده {caseId}</h1>
          <div className="board-controls">
            <button
              className={`btn ${connectMode ? 'btn-active' : 'btn-secondary'}`}
              onClick={() => {
                setConnectMode(!connectMode);
                setConnectFrom(null);
              }}
            >
              {connectMode ? 'لغو اتصال' : 'ایجاد اتصال'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">در حال بارگذاری...</div>
        ) : (
          <div className="investigation-board" ref={boardRef}>
            <svg className="board-connections">
              {renderConnections()}
            </svg>

            {boardItems.map((item) => (
              <div
                key={item.id}
                className={`board-item ${item.type} ${
                  selectedItem === item.id ? 'selected' : ''
                } ${connectFrom === item.id ? 'connecting' : ''}`}
                style={{
                  left: item.position.x,
                  top: item.position.y,
                }}
                onClick={() => handleItemClick(item.id)}
              >
                <div className="pin" />
                <div className="item-content">
                  <div className="item-type-badge">{item.description}</div>
                  <h4>{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
