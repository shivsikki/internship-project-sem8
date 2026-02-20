import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../Toast/ToastProvider';
import './Notifications.css';

const NotificationsPage = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header-row">
        <h2>Notifications</h2>
        {notifications.some((n) => !n.isRead) && (
          <button className="mark-all-read-btn" type="button" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="notification-empty">No notifications yet.</div>
      ) : (
        <div className="notifications-list-full">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notification-icon">🔔</div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatTime(notification.createdAt)}</div>
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={() => remove(notification._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

