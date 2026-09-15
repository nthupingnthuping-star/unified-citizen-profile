import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';

const NotificationsPage = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');

  const loadNotifications = async () => {
    if (!profile) return;
    try {
      const notifs = await getMyNotifications(profile.uid);
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(profile.uid);
    setMessage('All notifications marked as read');
    loadNotifications();
  };

  const typeColor = (type) => {
    if (type === 'success') return '#006600';
    if (type === 'error') return '#cc0000';
    if (type === 'warning') return '#856404';
    return '#003366';
  };

  const filtered =
    filter === 'all'
      ? notifications
      : filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications.filter((n) => n.is_read);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Layout title="Notifications">
      <Alert type="info">
        You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}.
        You'll be notified when your applications change status or when appointments are confirmed.
      </Alert>

      {message && (
        <Alert type="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
          size="small"
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'secondary'}
          onClick={() => setFilter('unread')}
          size="small"
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'primary' : 'secondary'}
          onClick={() => setFilter('read')}
          size="small"
        >
          Read ({notifications.length - unreadCount})
        </Button>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            size="small"
            style={{ marginLeft: 'auto' }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <p>Loading notifications...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>
            {filter === 'unread'
              ? 'No unread notifications.'
              : filter === 'read'
              ? 'No read notifications yet.'
              : 'You have no notifications.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((notif) => (
            <Card
              key={notif.id}
              style={{
                borderLeft: `4px solid ${typeColor(notif.type)}`,
                background: notif.is_read ? 'white' : '#f0f7ff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 15,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: notif.is_read ? 'normal' : 'bold',
                      fontSize: 15,
                      color: '#003366',
                      marginBottom: 5,
                    }}
                  >
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 14, color: '#444', lineHeight: 1.5 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    {notif.created_at?.toDate?.().toLocaleString() || ''}
                  </div>
                </div>
                {!notif.is_read && (
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default NotificationsPage;