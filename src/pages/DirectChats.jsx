import React, { useEffect, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";

export default function DirectChats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Deletion States
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;

    const q1 = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    const q2 = query(
      collection(db, "chats"),
      where("members", "array-contains", userId)
    );

    let hasLoadedOnce = false;

    const processSnapshot = async (chatsMap) => {
      const directList = Array.from(chatsMap.values());

      directList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt || 0);
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt || 0);
        return timeB - timeA;
      });

      setChats(directList);
      if (!hasLoadedOnce) {
        hasLoadedOnce = true;
        setLoading(false);
      }
    };

    const chatMap = new Map();
    let pendingSnapshots = 2;

    const handleSnapshotData = async (snap) => {
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        
        if (data.isGroup === true) continue;

        const chatParticipants = data.participants || data.members || [];
        const otherUserId = chatParticipants.find((id) => id !== userId);
        
        let otherUserName = data.otherUserName || data.recipientName || "Chat";
        let otherUserPhoto = data.otherUserPhoto || data.recipientPhoto || null;
        let problemTitle = data.projectTitle || data.broadcastTitle || data.title || "";

        if (otherUserId) {
          try {
            const userDocSnap = await getDoc(doc(db, "users", otherUserId));
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              otherUserName = userData.name || userData.displayName || otherUserName;
              otherUserPhoto = userData.photoURL || userData.profileImage || otherUserPhoto;
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }
        }

        if (!problemTitle && data.broadcastId) {
          try {
            const broadcastSnap = await getDoc(doc(db, "broadcasts", data.broadcastId));
            if (broadcastSnap.exists()) {
              problemTitle = broadcastSnap.data().title || "";
            }
          } catch (err) {
            console.error("Error fetching broadcast title:", err);
          }
        }

        chatMap.set(docSnap.id, {
          id: docSnap.id,
          otherUserId,
          otherUserName,
          otherUserPhoto,
          problemTitle,
          ...data,
        });
      }

      await processSnapshot(chatMap);
    };

    const unsub1 = onSnapshot(q1, async (snap) => {
      await handleSnapshotData(snap);
    }, (error) => {
      console.error("Error listening to chats (participants):", error);
      pendingSnapshots--;
      if (pendingSnapshots <= 0) setLoading(false);
    });

    const unsub2 = onSnapshot(q2, async (snap) => {
      await handleSnapshotData(snap);
    }, (error) => {
      console.error("Error listening to chats (members):", error);
      pendingSnapshots--;
      if (pendingSnapshots <= 0) setLoading(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  function formatLiveTimestamp(timestamp) {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  async function handleDeleteChat() {
    if (!selectedChat) return;

    try {
      await deleteDoc(doc(db, "chats", selectedChat.id));
      setShowDeleteConfirm(false);
      setSelectedChat(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Unable to delete chat.");
    }
  }

  if (loading) {
    return <div className="loadingText">Loading chats...</div>;
  }

  return (
    <div className="directChatsContainer">
      {chats.length === 0 ? (
        <div className="emptyState">
          <h3>No Direct Chats Yet</h3>
          <p>Conversations with candidates or users will appear here.</p>
        </div>
      ) : (
        chats.map((chat) => {
          const hasUnread = chat.lastSenderId && chat.lastSenderId !== auth.currentUser?.uid && (!chat.readBy || !chat.readBy.includes(auth.currentUser?.uid));

          return (
            <div
              key={chat.id}
              className="chatCard"
              onClick={() => navigate(`/chat/${chat.id}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedChat(chat);
                setShowDeleteConfirm(true);
              }}
            >
              <div
                className="chatAvatar"
                onClick={(e) => {
                  e.stopPropagation();
                  if (chat.otherUserId) {
                    navigate(`/profile/${chat.otherUserId}`);
                  }
                }}
                title="View Profile"
              >
                {chat.otherUserPhoto ? (
                  <img 
                    src={chat.otherUserPhoto} 
                    alt={chat.otherUserName} 
                    className="chatProfileImage" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
                  />
                ) : (
                  chat.otherUserName?.charAt(0).toUpperCase() || "C"
                )}
                
                {hasUnread && <span className="unreadBadge" />}
              </div>

              <div className="chatInfo">
                <div className="chatHeaderRow">
                  <h3 className="chatUserName">{chat.otherUserName}</h3>
                  
                  <div className="chatMetaRow">
                    <span className="chatTimestamp">
                      {formatLiveTimestamp(chat.updatedAt || chat.createdAt)}
                    </span>

                    {chat.problemTitle && (
                      <span className="chatProblemBadge" title={chat.problemTitle}>
                        {chat.problemTitle}
                      </span>
                    )}
                  </div>
                </div>

                <p className={`chatLastMessage ${hasUnread ? "unread" : ""}`}>
                  {chat.lastMessage || "Tap to open chat"}
                </p>
              </div>
            </div>
          );
        })
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteChat}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedChat(null);
        }}
      />
    </div>
  );
}