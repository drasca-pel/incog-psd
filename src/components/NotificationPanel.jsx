import react from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationPanel.css";

function formattime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function notificationpanel({ isOpen, onClose, notifications }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <>
      <div className="notifoverlay" onClick={onClose} />
      <div className="notifpanel">
        <div className="notifpanelheader">
          <h3>notifications</h3>
          <button className="notifclosebtn" onClick={onClose}>✕</button>
        </div>
        <div className="notiflist">
          {notifications.length === 0 ? (
            <div className="notifempty">you're all caught up.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notifitem" onClick={() => { onClose(); navigate(n.link); }}>
                <div className="notifdot" />
                <div className="notifcontent">
                  <strong>{n.title}</strong>
                  <p>{n.preview}</p>
                </div>
                <span className="notiftime">{formattime(n.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}