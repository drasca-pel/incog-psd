import React, { useEffect, useState } from "react";
import { getUserLogs, createLog, addReferenceToLog } from "../utils/logsService";
import ConfirmModal from "./ConfirmModal";
import "../styles/LogPicker.css";

export default function LogPicker({ message, chatId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLogName, setNewLogName] = useState("");
  const [creating, setCreating] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  useEffect(() => {
    loadLogs();
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

  async function handleSaveToLog(logId) {
    try {
      await addReferenceToLog(logId, message, chatId);
      setSuccessModal(true);
    } catch (err) {
      console.error("Error saving to log:", err);
    }
  }

  async function handleCreateAndSave() {
    if (!newLogName.trim()) return;
    setCreating(true);
    try {
      const logId = await createLog(newLogName.trim());
      await addReferenceToLog(logId, message, chatId);
      setSuccessModal(true);
    } catch (err) {
      console.error("Error creating log:", err);
    }
    setCreating(false);
  }

  return (
    <>
      <div className="logPickerOverlay" onClick={onClose}>
        <div className="logPickerBox" onClick={(e) => e.stopPropagation()}>
          <h3>Add to Log</h3>

          <div className="logCreateRow">
            <input
              type="text"
              placeholder="New log name"
              value={newLogName}
              onChange={(e) => setNewLogName(e.target.value)}
            />
            <button
              className="logCreateBtn"
              disabled={creating || !newLogName.trim()}
              onClick={handleCreateAndSave}
            >
              Create & Save
            </button>
          </div>

          <div className="logDivider">or add to existing</div>

          <div className="logList">
            {loading ? (
              <p className="logEmptyText">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="logEmptyText">No logs yet — create one above.</p>
            ) : (
              logs.map((log) => (
                <button
                  key={log.id}
                  className="logListItem"
                  onClick={() => handleSaveToLog(log.id)}
                >
                  <span>{log.name}</span>
                  <span className="logItemCount">{log.itemCount || 0}</span>
                </button>
              ))
            )}
          </div>

          <button className="logCancelBtn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <ConfirmModal
        isOpen={successModal}
        title="Saved"
        message="This item has been added to your log."
        confirmText="OK"
        type="info"
        onClose={() => {
          setSuccessModal(false);
          onClose();
        }}
        onConfirm={() => {
          setSuccessModal(false);
          onClose();
        }}
      />
    </>
  );
}