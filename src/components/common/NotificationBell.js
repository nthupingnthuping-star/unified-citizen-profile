import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../firebase/db';
import BellIcon from './BellIcon';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToNotifications(profile.uid, setNotifications);
    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(profile.uid);
  };

  const typeColor = (type) => {
    if (type === 'success') return '#006600';
    if (type === 'error') return '#cc0000';
    if (type === 'warning') return '#856404';
    return '#003366';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Notifications"
      >
        <BellIcon size={22} color="#ffffff" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              background: '#cc0000',
              color: 'white',
              borderRadius: '50%',
              minWidth: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            zIndex: 100,
            maxHeight: 480,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ color: '#003366', fontSize: 14 }}>
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#003366',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 13,
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: notif.is_read ? 'white' : '#f0f7ff',
                    borderLeft: `4px solid ${typeColor(notif.type)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: notif.is_read ? 'normal' : 'bold',
                          fontSize: 13,
                          color: '#003366',
                          marginBottom: 2,
                        }}
                      >
                        {notif.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        {notif.created_at?.toDate?.().toLocaleString() || ''}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#003366',
                          flexShrink: 0,
                          marginTop: 6,
                          marginLeft: 8,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: 13,
                color: '#003366',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderTop: '1px solid #eee',
                background: '#fafafa',
              }}
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;