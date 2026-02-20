import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import type { Notification } from '../types/auth';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await authAPI.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await authAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('آیا از پاک کردن تمامی اعلان‌ها اطمینان دارید؟')) return;
    try {
      await authAPI.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="notifications-container">
          <header className="notifications-header">
            <h1 className="gold-text">اعلان‌های سیستم</h1>
            <div className="header-actions">
              <button className="btn-gold-outline" onClick={markAllRead}>
                همه به عنوان خوانده شده
              </button>
              <button className="btn-gold-outline" onClick={clearAll} style={{ borderColor: 'rgba(255, 90, 90, 0.5)', color: '#ffbaba' }}>
                پاک کردن همه
              </button>
            </div>
          </header>

          {loading ? (
            <div className="loading">در حال بارگذاری...</div>
          ) : notifications.length === 0 ? (
            <div className="no-data">هیچ اعلانی یافت نشد.</div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => !notification.is_read && markRead(notification.id)}
                >
                  <div className="notification-content">
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <span className="notification-date">
                      {new Date(notification.created_at).toLocaleString('fa-IR')}
                    </span>
                  </div>
                  {notification.link && (
                    <a href={notification.link} className="notification-link">
                      مشاهده جزییات
                    </a>
                  )}
                  {!notification.is_read && <span className="unread-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
