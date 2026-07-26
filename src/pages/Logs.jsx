import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserLogs, createLog, deleteLog } from "../utils/logsService";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Logs.css";

export default function Logs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newLogName, setNewLogName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadLogs() {
    try {
      const data = await getUserLogs();
      setLogs(data);
    } catch (err) {
      console.error("Error loading logs:", err);
    }
    setLoading(false);
  }

  async function handleCreateLog() {
    if (!newLogName.trim()) return;
    setCreating(true);
    try {
      await createLog(newLogName.trim());
      setNewLogName("");
      setShowCreateBox(false);
      await loadLogs();
    } catch (err) {
      console.error("Error creating log:", err);
      setConfirmModal({
        title: "Creation Failed",
        message: "Unable to create this log. Please try again.",
        confirmText: "OK",
        type: "info",
        action: () => setConfirmModal(null),
      });
    }
    setCreating(false);
  }

  function handleDeleteLog(log) {
    setOpenMenuId(null);
    setConfirmModal({
      title: "Delete Folder?",
      message: `Delete "${log.name}" and everything saved inside it?`,
      confirmText: "Delete",
      type: "confirm",
      action: async () => {
        try {
          await deleteLog(log.id);
          setLogs((prev) => prev.filter((l) => l.id !== log.id));
          setConfirmModal(null);
        } catch (err) {
          console.error("Error deleting log:", err);
          setConfirmModal({
            title: "Delete Failed",
            message: "Unable to delete this log. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  }

  return (
    <div className="logsPage">
      <button className="backButton" onClick={() => navigate(-1)}>←</button>

      <div className="logsPageHeader">
        <h1>My Logs</h1>
        <button
          className="newLogBtn"
          onClick={() => setShowCreateBox((prev) => !prev)}
        >
          + New Log
        </button>
      </div>

      {showCreateBox && (
        <div className="newLogRow">
          <input
            type="text"
            placeholder="Log name..."
            value={newLogName}
            onChange={(e) => setNewLogName(e.target.value)}
            autoFocus
          />
          <button
            className="newLogConfirmBtn"
            disabled={creating || !newLogName.trim()}
            onClick={handleCreateLog}
          >
            Create
          </button>
        </div>
      )}

      {loading ? (
        <p className="logsLoading">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="emptyState">
          <h3>No Logs Yet</h3>
          <p>Create one above, or long-press any message in chat to save it here.</p>
        </div>
      ) : (
        <div className="logsGrid">
          {logs.map((log) => (
            <div key={log.id} className="folderCard">
              <div className="folderTab" />
              <div
                className="folderBody"
                onClick={() => navigate(`/logs/${log.id}`)}
              >
                <div style={{ position: "relative" }}>
                  <button
                    className="folderMenuBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === log.id ? null : log.id);
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === log.id && (
                    <div
                      className="folderMenuDropdown"
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => handleDeleteLog(log)}>
                        🗑 Delete Folder
                      </button>
                    </div>
                  )}
                </div>

                <div className="folderIcon">📁</div>
                <div className="folderInfo">
                  <h3>{log.name}</h3>
                  <span>{log.itemCount || 0} items</span>
                </div>
              </div>
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