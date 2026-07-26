import React from "react";
import "../styles/MessageMenu.css";

export default function MessageMenu({
  isMine,
  onReply,
  onEdit,
  onDelete,
  onSave,
  onAddToLog,
  onClose,
}) {
  return (
    <div className="messageMenuOverlay" onClick={onClose}>
      <div className="messageMenu" onClick={(e) => e.stopPropagation()}>
        <button onClick={onReply}>
          Reply
        </button>
        {isMine && (
          <button onClick={onEdit}>
            Edit
          </button>
        )}
        {isMine && (
          <button
            className="dangerButton"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
        <button onClick={onSave}>
          Save to Device
        </button>
        <button onClick={onAddToLog}>
          Add to Log
        </button>
        <button className="cancelButton" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}