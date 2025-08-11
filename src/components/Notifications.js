import React from 'react';

function Notifications({ notifications }) {
  if (notifications.length === 0) {
    return (
      <div className="notifications">
        <h2>Real-time Notifications</h2>
        <div className="empty-state">
          <p>No notifications yet. They will appear here when BRTs are created, updated, or deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications">
      <h2>Real-time Notifications</h2>
      <div className="notification-list">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-item">
            <div className="notification-header">
              <h4>{notification.title}</h4>
              <span className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;