import React from "react";
import "../styles/ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  onConfirm,
  onClose,
  type = "confirm",
}) {

  if (!isOpen) return null;

  return (
    <div className="confirmOverlay">

      <div className="confirmBox">

        <h3>{title}</h3>

        <p style={{ whiteSpace: "pre-line" }}>{message}</p>

        <div className="confirmActions">

          {type === "confirm" ? (
            <>
              <button
                className="confirmDelete"
                onClick={onConfirm}
              >
                {confirmText}
              </button>

              <button
                className="confirmCancel"
                onClick={onClose}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="confirmDelete"
              onClick={onClose}
            >
              OK
            </button>
          )}

        </div>

      </div>

    </div>
  );
}