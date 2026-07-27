import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLogItems, deleteLogItem } from "../utils/logsService";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Logs.css";

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, [id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadItems() {
    try {
      const data = await getLogItems(id);
      setItems(data);
    } catch (err) {
      console.error("Error loading log items:", err);
    }
    setLoading(false);
  }

  function handleDeleteItem(item) {
    setOpenMenuId(null);
    setConfirmModal({
      title: "Remove Item?",
      message: "Remove this item from the log?",
      confirmText: "Remove",
      type: "confirm",
      action: async () => {
        try {
          await deleteLogItem(item.id, id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setConfirmModal(null);
        } catch (err) {
          console.error("Error deleting log item:", err);
          setConfirmModal({
            title: "Removal Failed",
            message: "Unable to remove this item. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  }

  return (
    <div className="logDetailPage">
      <button className="backButton" onClick={() => navigate(-1)}>←</button>
      <h1>Log Items</h1>

      {loading ? (
        <p className="logsLoading">Loading...</p>
      ) : items.length === 0 ? (
        <div className="emptyState">
          <h3>Nothing Saved Yet</h3>
        </div>
      ) : (
        <div className="logItemsList">
          {items.map((item) => (
            <div key={item.id} className="logItemCard">
              <div className="logItemHeader">
                <strong>{item.senderName}</strong>

                <div className="logItemMenuWrapper" style={{ position: "relative" }}>
                  <button
                    className="logItemMenuBtn"
                    style={{ background: "none", border: "none", color: "#a1a1aa", fontSize: "16px", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === item.id ? null : item.id);
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === item.id && (
                    <div className="folderMenuDropdown" ref={menuRef}>
                      <button onClick={() => handleDeleteItem(item)}>
                        🗑 Delete Item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {item.type === "image" && item.mediaURL && (
                <img
                  src={item.mediaURL}
                  alt="saved"
                  className="logItemImage"
                  onClick={() => navigate(`/chat/${item.chatId}`)}
                />
              )}

              {item.type === "video" && item.mediaURL && (
                <video src={item.mediaURL} controls className="logItemVideo" />
              )}

              {item.text && <p className="logItemText">{item.text}</p>}

              <button
                className="logItemJumpBtn"
                onClick={() => navigate(`/chat/${item.chatId}`)}
              >
                Go to Chat →
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={!!confirmModal}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type || "confirm"}
          onConfirm={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
