import React from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  markNotificationRead,
} from "../utils/notificationsService";

import "../styles/NotificationPanel.css";

function formatTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

  const seconds =
    Math.floor(
      (new Date() - date) /
        1000
    );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(
    hours / 24
  )}d ago`;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
}) {
  const navigate =
    useNavigate();

  if (!isOpen) {
    return null;
  }

  async function handleClick(
    notification
  ) {
    onClose();

    if (
      notification.category ===
      "activity"
    ) {
      try {
        await markNotificationRead(
          notification.id
        );
      } catch (error) {
        console.error(
          "Error marking notification read:",
          error
        );
      }
    }

    if (notification.link) {
      navigate(
        notification.link
      );
    }
  }

  return (
    <>
      <div
        className="notifOverlay"
        onClick={onClose}
      />

      <div className="notifPanel">

        <div className="notifPanelHeader">

          <h3>
            Notifications
          </h3>

          <button
            className="notifCloseBtn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <div className="notifList">

          {notifications.length ===
          0 ? (

            <div className="notifEmpty">
              You're all caught up.
            </div>

          ) : (

            notifications.map(
              (notification) => (

                <div
                  key={
                    notification.id
                  }
                  className="notifItem"
                  onClick={() =>
                    handleClick(
                      notification
                    )
                  }
                >

                  <div
                    className={`notifDot ${
                      notification.category ===
                      "activity"
                        ? "notifDotActivity"
                        : ""
                    }`}
                  />

                  <div className="notifContent">

                    <strong>
                      {
                        notification.title
                      }
                    </strong>

                    <p>
                      {
                        notification.preview
                      }
                    </p>

                  </div>

                  <span className="notifTime">
                    {formatTime(
                      notification.timestamp
                    )}
                  </span>

                </div>

              )
            )

          )}

        </div>

      </div>
    </>
  );
}