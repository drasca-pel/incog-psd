import React, { useState } from "react";

export default function MessageBubble({

  message,

  isMine,

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

        className={
          isMine
            ? "myMessage"
            : "theirMessage"
        }

        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}

      >

        {message.replyTo && (

          <div className="replyPreview">

            <strong>

              ↩ {message.replyName}

            </strong>

            <p>

              {message.replyText}

            </p>

          </div>

        )}

        <strong>

          {message.senderName}

        </strong>

        {message.mediaType === "image" ? (

          <div className="messageMedia">
            <img
              src={message.mediaURL}
              alt="media"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
              style={{ maxWidth: "200px", borderRadius: "8px", display: "block", margin: "5px 0", cursor: "pointer" }}
            />
            {message.text && <p>{message.text}</p>}
          </div>

        ) : message.mediaType === "video" ? (

          <div 
            className="messageMedia"
            style={{ display: "inline-block" }}
          >
            <video
              src={message.mediaURL}
              controls
              onClick={(e) => {
                e.stopPropagation();
                setVideoFullscreen(true);
              }}
              style={{ maxWidth: "220px", borderRadius: "8px", display: "block", margin: "5px 0", cursor: "pointer" }}
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

          {message.edited && (

            <small>

              Edited

            </small>

          )}

          <small>

            ✓

          </small>

        </div>

      </div>

      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ← Back
          </button>
          <img
            src={message.mediaURL}
            alt="fullscreen preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "85%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </div>
      )}

      {videoFullscreen && (
        <div
          onClick={() => setVideoFullscreen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <button
            onClick={() => setVideoFullscreen(false)}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ← Back
          </button>
          <video
            src={message.mediaURL}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95%",
              maxHeight: "90%",
              borderRadius: "8px"
            }}
          />
        </div>
      )}
    </>
  );

}