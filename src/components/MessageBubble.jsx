import React, { useState } from "react";
import "../styles/MessageBubble.css";

export default function MessageBubble({
  message,
  isMine,
  isRead,
  onLongPress,
}) {

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);

  let pressTimer;

  const startPress = () => {
    pressTimer = setTimeout(() => {
      onLongPress(message);
    }, 500);
  };

  const cancelPress = () => {
    clearTimeout(pressTimer);
  };

  return (
    <>
      <div
        className={isMine ? "myMessage" : "theirMessage"}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
      >

        {message.replyTo && (
          <div className="replyPreview">
            <strong>↩ {message.replyName}</strong>
            <p>{message.replyText}</p>
          </div>
        )}

        <strong>{message.senderName}</strong>

        {message.mediaType === "image" ? (
          <div className="messageMedia">
            <img
              src={message.mediaURL}
              alt="media"
              className="messageImage"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
            />
            {message.text && <p>{message.text}</p>}
          </div>
        ) : message.mediaType === "video" ? (
          <div className="messageMedia messageMediaInline">
            <video
              src={message.mediaURL}
              controls
              className="messageVideo"
              onClick={(e) => {
                e.stopPropagation();
                setVideoFullscreen(true);
              }}
            />
            {message.text && <p>{message.text}</p>}
          </div>
        ) : message.mediaType === "audio" ? (
          <div className="messageAudio" style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "5px 0" }}>
            <span>🎤 Voice Note</span>
            <audio src={message.mediaURL} controls style={{ height: "32px", maxWidth: "220px" }} />
            {message.duration ? (
              <small style={{ fontSize: "10px", opacity: 0.8 }}>
                0:{message.duration < 10 ? `0${message.duration}` : message.duration}
              </small>
            ) : null}
          </div>
        ) : (
          <p>{message.text}</p>
        )}

        <div className="messageFooter">
          {message.edited && <small>Edited</small>}

          {isMine && (
            isRead ? (
              <small className="readTicks">✓✓</small>
            ) : (
              <small className="sentTick">✓</small>
            )
          )}
        </div>

      </div>

      {isFullscreen && (
        <div className="fullscreenOverlay" onClick={() => setIsFullscreen(false)}>
          <button className="fullscreenBackBtn" onClick={() => setIsFullscreen(false)}>
            ← Back
          </button>
          <img
            src={message.mediaURL}
            alt="fullscreen preview"
            className="fullscreenImage"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {videoFullscreen && (
        <div className="fullscreenOverlay" onClick={() => setVideoFullscreen(false)}>
          <button className="fullscreenBackBtn" onClick={() => setVideoFullscreen(false)}>
            ← Back
          </button>
          <video
            src={message.mediaURL}
            controls
            autoPlay
            className="fullscreenVideo"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}