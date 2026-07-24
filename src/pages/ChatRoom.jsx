import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import useChat from "../hooks/useChat";

import MessageBubble from "../components/MessageBubble";
import MessageMenu from "../components/MessageMenu";
import ConfirmModal from "../components/ConfirmModal";

import "../styles/ChatRoom.css";

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [userData, setUserData] = useState(null);

  // Media Preview State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);

  // Voice Recording & Preview State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // File input ref for media upload
  const fileInputRef = useRef(null);

  const {
    chat,
    messages,
    loading,
    text,
    setText,
    sendMessage,
    sendMediaMessage,
    sendVoiceMessage,
    updateMessage,
    typingUsers,
    updateTyping,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editingText,
    setEditingText,
    deleteMessage,
    permanentlyDeleteMessage,
  } = useChat(id);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (auth.currentUser) {
          const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (snap.exists()) {
            setUserData(snap.data());
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    loadUser();
  }, []);

  const otherUsersTyping = Object.entries(typingUsers || {}).some(
    ([uid, value]) =>
      uid !== auth.currentUser?.uid && value === true
  );

  // Handle Media Selection and Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = null;
  };

  const cancelMediaPreview = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
  };

  const confirmSendMedia = async () => {
    if (!mediaFile) return;
    await sendMediaMessage(mediaFile);
    cancelMediaPreview();
  };

  // Voice Recording Functions with WhatsApp-style Preview
  const startRecording = async () => {
    if (audioPreviewUrl) return;
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelVoicePreview = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingDuration(0);
  };

  const confirmSendVoice = async () => {
    if (!audioBlob) return;
    await sendVoiceMessage(audioBlob, recordingDuration);
    cancelVoicePreview();
  };

  if (loading) {
    return (
      <div className="chatLoading">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="chatRoom">

      <div className="chatHeader">

        <button
          className="backButton"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div className="chatHeaderInfo">

          <h2>
            {chat?.projectTitle || "Chat"}
          </h2>

          <small>
            {otherUsersTyping ? "Typing..." : "Online"}
          </small>

        </div>

      </div>

      <div className="messageList">

        {messages.length === 0 ? (

          <div className="emptyMessages">
            No messages yet.
          </div>

        ) : (

          messages.map((message) => (

            <MessageBubble

              key={message.id}

              message={message}

              isMine={
                message.senderId === auth.currentUser.uid
              }

              onLongPress={(msg) => {

                setSelectedMessage(msg);

                setShowMenu(true);

              }}

            />

          ))

        )}

      </div>

      {replyingTo && (

        <div className="replyBar">

          <div>

            <strong>
              Replying to {replyingTo.senderName}
            </strong>

            <p>
              {replyingTo.text ||
               replyingTo.fileName ||
               "Media"}
            </p>

          </div>

          <button
            onClick={() => setReplyingTo(null)}
          >
            ✕
          </button>

        </div>

      )}

      {/* Media Preview Overlay */}
      {mediaPreviewUrl && (
        <div className="mediaPreviewContainer" style={{ padding: "10px", background: "#f0f0f0", display: "flex", alignItems: "center", gap: "10px" }}>
          {mediaFile?.type.startsWith("image/") ? (
            <img src={mediaPreviewUrl} alt="preview" className="previewImage" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
          ) : mediaFile?.type.startsWith("video/") ? (
            <video src={mediaPreviewUrl} controls className="previewVideo" style={{ width: "80px", height: "60px", borderRadius: "8px" }} />
          ) : (
            <div className="previewFile" style={{ width: "60px", height: "60px", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>📄 {mediaFile?.name}</div>
          )}
          <span style={{ flex: 1, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mediaFile?.name}</span>
          <button onClick={cancelMediaPreview} style={{ background: "red", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmSendMedia} style={{ background: "green", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Send</button>
        </div>
      )}

      {/* Voice Note Preview Overlay (WhatsApp Style) */}
      {audioPreviewUrl && (
        <div className="audioPreviewContainer" style={{ padding: "10px", background: "#f0f0f0", display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #ddd" }}>
          <span>🎤 Voice Note</span>
          <audio src={audioPreviewUrl} controls style={{ height: "35px", flex: 1 }} />
          <span style={{ fontSize: "12px", color: "#666" }}>0:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}</span>
          <button onClick={cancelVoicePreview} style={{ background: "red", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>❌ Cancel</button>
          <button onClick={confirmSendVoice} style={{ background: "green", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>✅ Send</button>
        </div>
      )}

      {/* Input Area */}
      <div className="chatInputArea" style={{ position: "relative" }}>

        {isRecording && (
          <div className="recordingIndicator" style={{ position: "absolute", top: "-30px", left: "15px", background: "#ff4d4d", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
            🔴 Recording... 0:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept="image/*,video/*"
        />

        <button
          className="mediaUploadButton"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Media"
        >
          📎
        </button>

        <input
          className="chatInput"
          placeholder={isRecording ? "Recording voice note..." : "Type a message..."}
          disabled={isRecording || audioPreviewUrl !== null}
          value={text}
          onChange={async (e) => {

            setText(e.target.value);
            if (editingMessage) {
              setEditingText(e.target.value);
            }

            await updateTyping(
              e.target.value.trim().length > 0
            );

          }}
        />

        <button
          className={`voiceButton ${isRecording ? "recording" : ""}`}
          type="button"
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerCancel={stopRecording}
          style={isRecording ? { backgroundColor: "red", color: "white" } : {}}
          title="Hold to record, release to preview"
        >
          {isRecording ? "🔴" : "🎤"}
        </button>

        <button
          className="sendButton"
          disabled={audioPreviewUrl !== null}
          onClick={
            editingMessage
              ? updateMessage
              : sendMessage
          }
        >
          {editingMessage ? "Update" : "Send"}
        </button>

      </div>

      {showMenu && selectedMessage && (

        <MessageMenu

          isMine={
            selectedMessage.senderId === auth.currentUser.uid
          }

          onReply={() => {

            setReplyingTo(selectedMessage);

            setShowMenu(false);

          }}

          onEdit={() => {

            setEditingMessage(selectedMessage);

            setEditingText(selectedMessage.text);

            setText(selectedMessage.text);

            setShowMenu(false);

          }}

          onDelete={() => {

            setShowMenu(false);

            setSelectedMessage(selectedMessage);

            setShowDeleteConfirm(true);

          }}

          onSave={() => {

            setShowMenu(false);

          }}

          onAddToLog={() => {

            setShowMenu(false);

          }}

          onClose={() => {

            setShowMenu(false);

          }}

        />

      )}

      <ConfirmModal

        isOpen={showDeleteConfirm}

        title="Delete Message"

        message="Delete this message permanently?"

        confirmText="Delete"

        onConfirm={async () => {

          await deleteMessage(selectedMessage);

          setShowDeleteConfirm(false);

          setSelectedMessage(null);

        }}

        onClose={() => {

          setShowDeleteConfirm(false);

          setSelectedMessage(null);

        }}

      />

      <ConfirmModal

        isOpen={showPermanentDeleteConfirm}

        title="Delete Permanently"

        message="This will remove this message completely."

        confirmText="Delete"

        onConfirm={async () => {

          await permanentlyDeleteMessage(
            selectedMessage.id
          );

          setShowPermanentDeleteConfirm(false);

          setSelectedMessage(null);

        }}

        onClose={() => {
          setShowPermanentDeleteConfirm(false);
          setSelectedMessage(null);
        }}

      />

    </div>
  );
}