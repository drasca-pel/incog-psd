import react, { useEffect, useState, useRef, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import useChat from "../hooks/useChat";

import MessageBubble from "../components/MessageBubble";
import MessageMenu from "../components/MessageMenu";
import ConfirmModal from "../components/ConfirmModal";
import LogPicker from "../components/LogPicker";

import "../styles/ChatRoom.css";

// works out who "the other person" is, regardless of whether this
// chat was created via helperId/ownerId or members/participants
function getOtherUserId(chat, currentUid) {
  if (!chat) return null;
  if (chat.helperId && chat.ownerId) {
    return chat.helperId === currentUid ? chat.ownerId : chat.helperId;
  }
  const list = chat.members || chat.participants || [];
  return list.find((uid) => uid !== currentUid) || null;
}

function formatLastSeen(timestamp) {
  if (!timestamp) return "offline";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "last seen just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `last seen ${hours}h ago`;
  return "last seen a while ago";
}

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [showLogPicker, setShowLogPicker] = useState(false);
  const [userData, setUserData] = useState(null);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const fileInputRef = useRef(null);

  // keeps "last seen Xm ago" ticking upward without a full reload
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

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
    onlineStatus,
    updateTyping,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editingText,
    setEditingText,
    deleteMessage,
    markMessageRead,
    permanentlyDeleteMessage,
    markChatRead,
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
        console.error("error loading user profile:", err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    markChatRead();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate(), 30000);
    return () => clearInterval(timer);
  }, []);

  // mark any incoming message as read as soon as it's on screen
  useEffect(() => {
    if (!auth.currentUser || !messages.length) return;

    messages.forEach((message) => {
      const isFromOther = message.senderId !== auth.currentUser.uid;
      const alreadyRead = message.readBy?.includes(auth.currentUser.uid);

      if (isFromOther && !alreadyRead) {
        markMessageRead(message.id);
      }
    });
  }, [messages]);

  const otherUserId = getOtherUserId(chat, auth.currentUser?.uid);
  const otherIsOnline = onlineStatus?.[otherUserId]?.online === true;
  const otherLastSeen = onlineStatus?.[otherUserId]?.lastSeen;

  const otherUsersTyping = Object.entries(typingUsers || {}).some(
    ([uid, value]) => uid !== auth.currentUser?.uid && value === true
  );

  let statusText;
  if (otherUsersTyping) {
    statusText = "typing...";
  } else if (otherIsOnline) {
    statusText = "online";
  } else {
    statusText = formatLastSeen(otherLastSeen);
  }

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
      console.error("error accessing microphone:", err);
      alert("could not access microphone. please check browser permissions.");
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
    return <div className="chatloading">loading chat...</div>;
  }

  return (
    <div className="chatroom">

      <div className="chatheader">
        <button className="backbutton" onClick={() => navigate(-1)}>←</button>

        <div className="chatheaderinfo">
          <h2>
            {chat?.projectTitle || "chat"}
            <span className={`onlinedot ${otherIsOnline ? "onlinedotactive" : ""}`} />
          </h2>
          <small className={otherIsOnline ? "statusonline" : "statusoffline"}>
            {statusText}
          </small>
        </div>
      </div>

      <div className="messagelist">
        {messages.length === 0 ? (
          <div className="emptymessages">no messages yet.</div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === auth.currentUser.uid;
            const isRead = otherUserId
              ? message.readBy?.includes(otherUserId)
              : false;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={isMine}
                isRead={isRead}
                onLongPress={(msg) => {
                  setSelectedMessage(msg);
                  setShowMenu(true);
                }}
              />
            );
          })
        )}
      </div>

      {replyingTo && (
        <div className="replybar">
          <div>
            <strong>replying to {replyingTo.senderName}</strong>
            <p>{replyingTo.text || replyingTo.fileName || "media"}</p>
          </div>
          <button onClick={() => setReplyingTo(null)}>✕</button>
        </div>
      )}

      {mediaPreviewUrl && (
        <div className="mediapreviewcontainer">
          {mediaFile?.type.startsWith("image/") ? (
            <img src={mediaPreviewUrl} alt="preview" className="previewimage" />
          ) : mediaFile?.type.startsWith("video/") ? (
            <video src={mediaPreviewUrl} controls className="previewvideo" />
          ) : (
            <div className="previewfile">📄 {mediaFile?.name}</div>
          )}
          <span className="previewfilename">{mediaFile?.name}</span>
          <button className="previewcancelbtn" onClick={cancelMediaPreview}>cancel</button>
          <button className="previewsendbtn" onClick={confirmSendMedia}>send</button>
        </div>
      )}

      {audioPreviewUrl && (
        <div className="audiopreviewcontainer">
          <span>🎤 voice note</span>
          <audio src={audioPreviewUrl} controls className="audiopreviewplayer" />
          <span className="audiopreviewduration">
            0:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
          </span>
          <button className="previewcancelbtn" onClick={cancelVoicePreview}>❌ cancel</button>
          <button className="previewsendbtn" onClick={confirmSendVoice}>✅ send</button>
        </div>
      )}

      <div className="chatinputarea">
        {isRecording && (
          <div className="recordingindicator">
            🔴 recording... 0:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
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
          className="mediauploadbutton"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="upload media"
        >
          📎
        </button>

        <input
          className="chatinput"
          placeholder={isRecording ? "recording voice note..." : "type a message..."}
          disabled={isRecording || audioPreviewUrl !== null}
          value={text}
          onChange={async (e) => {
            setText(e.target.value);
            if (editingMessage) {
              setEditingText(e.target.value);
            }
            await updateTyping(e.target.value.trim().length > 0);
          }}
        />

        <button
          className={`voicebutton ${isRecording ? "recording" : ""}`}
          type="button"
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerCancel={stopRecording}
          title="hold to record, release to preview"
        >
          {isRecording ? "🔴" : "🎤"}
        </button>

        <button
          className="sendbutton"
          disabled={audioPreviewUrl !== null}
          onClick={editingMessage ? updateMessage : sendMessage}
        >
          {editingMessage ? "update" : "send"}
        </button>
      </div>

      {showMenu && selectedMessage && (
        <MessageMenu
          isMine={selectedMessage.senderId === auth.currentUser.uid}
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
            setShowLogPicker(true);
          }}
          onClose={() => {
            setShowMenu(false);
          }}
        />
      )}

      {showLogPicker && selectedMessage && (
        <LogPicker
          message={selectedMessage}
          chatId={id}
          onClose={() => {
            setShowLogPicker(false);
            setSelectedMessage(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="delete message"
        message="delete this message permanently?"
        confirmText="delete"
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
        title="delete permanently"
        message="this will remove this message completely."
        confirmText="delete"
        onConfirm={async () => {
          await permanentlyDeleteMessage(selectedMessage.id);
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