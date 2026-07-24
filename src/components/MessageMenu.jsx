import React from "react";

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
    <div className="messageMenuOverlay">

      <div className="messageMenu">

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

        <button onClick={onClose}>
          Cancel
        </button>
         
      </div>

    </div>
  );
}