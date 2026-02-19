import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { evidenceAPI } from '../services/evidenceApi';
import type { BiologicalEvidence } from '../types/evidence';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingBiological, setPendingBiological] = useState<BiologicalEvidence[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const userRoles = user?.roles?.map(r => r.code) || [];
  const isForensicDoctor = userRoles.includes('forensic_doctor');

  useEffect(() => {
    if (isForensicDoctor) {
      fetchForensicTasks();
    }
  }, [isForensicDoctor]);

  const fetchForensicTasks = async () => {
    try {
      setLoadingTasks(true);
      const allBio = await evidenceAPI.listBiologicalEvidence();
      // Filter only unverified ones
      const unverified = allBio.filter(e => !e.is_verified);
      setPendingBiological(unverified);
    } catch (err) {
      console.error('Failed to fetch forensic tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const modules = [
    {
      id: 'cases',
      title: 'مدیریت پرونده‌ها',
      icon: '📁',
      path: '/cases',
      description: 'مشاهده، ثبت و پیگیری پرونده‌های جنایی فعال و مختومه.',
      roles: ['trainee', 'police_officer', 'detective', 'sergeant', 'captain', 'police_chief', 'judge', 'complainant', 'base_user'],
    },
    {
      id: 'investigation',
      title: 'تخته تحقیقات کارآگاه',
      icon: '🎯',
      path: '/investigation',
      description: 'ابزار حرفه‌ای برای برقرای ارتباط میان شواهد و مظنونین.',
      roles: ['detective'],
    },
    {
      id: 'ranking',
      title: 'تحت پیگیری شدید',
      icon: '🔥',
      path: '/ranking',
      description: 'لیست سیاه خطرناک‌ترین مجرمان که تحت پیگرد قانونی ویژه هستند.',
      roles: ['trainee', 'police_officer', 'detective', 'sergeant', 'captain', 'police_chief', 'judge', 'complainant', 'base_user'],
    },
    {
      id: 'stats',
      title: 'گزارش‌گیری کلی',
      icon: '📊',
      path: '/stats',
      description: 'گزارش جامع پرونده‌ها برای بررسی قضایی و مدیریتی (۵.۷).',
      roles: ['judge', 'qazi', 'captain', 'police_chief'],
    },
    {
      id: 'evidence',
      title: 'ثبت و بررسی مدارک',
      icon: '🧾',
      path: '/evidence',
      description: 'مدیریت شواهد پرونده‌ها و تایید مدارک زیستی توسط پزشک قانونی (۵.۸).',
      roles: [
        'trainee',
        'police_officer',
        'detective',
        'sergeant',
        'captain',
        'police_chief',
        'forensic_doctor',
        'judge',
        'qazi',
      ],
    },
  ];

  const visibleModules = modules.filter(
    (m) => m.id === 'cases' || m.id === 'ranking' || m.roles.some((role) => userRoles.includes(role))
  );

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-content">
          <header className="dashboard-welcome">
            <div>
              <h1>خوش آمدید، {user?.username}</h1>
              <p>وضعیت جاری شما در سامانه: <strong>{user?.roles?.[0]?.name || 'بدون نقش'}</strong></p>
            </div>
          </header>

          <div className="modular-grid">
            {visibleModules.map(module => (
              <div key={module.id} className="module-card" onClick={() => navigate(module.path)}>
                <div className="module-icon">{module.icon}</div>
                <div className="module-info">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>
                <div className="module-footer">
                  <span>ورود به ماژول ←</span>
                </div>
              </div>
            ))}
          </div>

          {isForensicDoctor && (
            <div className="info-card forensic-tasks" style={{ marginTop: '24px', border: '1px solid rgba(255,200,120,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="gold-text" style={{ margin: 0 }}>🔬 وظایف پزشکی قانونی (شواهد در انتظار تایید)</h3>
                <span className="badge" style={{ background: '#d4af37', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {pendingBiological.length} مورد
                </span>
              </div>
              
              {loadingTasks ? (
                <p style={{ color: '#ccc' }}>در حال بارگذاری وظایف...</p>
              ) : pendingBiological.length === 0 ? (
                <p style={{ color: '#888' }}>در حال حاضر هیچ مدرک زیستی جدیدی برای بررسی وجود ندارد.</p>
              ) : (
                <div className="tasks-list" style={{ display: 'grid', gap: '12px' }}>
                  {pendingBiological.slice(0, 5).map(task => (
                    <div 
                      key={task.id} 
                      className="task-item" 
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => navigate(`/evidence/edit/biological/${task.id}?case=${task.case}`)}
                    >
                      <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>{task.title}</div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>پرونده شماره: {task.case} • ثبت شده توسط: {task.recorder_name}</div>
                      </div>
                      <button className="btn-gold-outline" style={{ padding: '4px 12px', fontSize: '12px' }}>
                        بررسی و تایید
                      </button>
                    </div>
                  ))}
                  {pendingBiological.length > 5 && (
                    <p 
                      style={{ textAlign: 'center', color: '#d4af37', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}
                      onClick={() => navigate('/evidence')}
                    >
                      مشاهده همه موارد...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="info-card">
            <h3>درباره سیستم</h3>
            <p>
              این سیستم برای مدیریت پرونده‌های جنایی، مدارک، تحقیقات و کاربران طراحی شده است.
            </p>
            <p className="note">
              از ماژول‌های بالا یا منوی سمت راست برای دسترسی به بخش‌های مختلف استفاده کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
