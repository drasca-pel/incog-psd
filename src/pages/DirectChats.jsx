import React, { useEffect, useState, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import { requestNotificationPermission, sendBrowserNotification } from "../utils/notifications";

export default function DirectChats({ searchTerm = "" }) {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [selectedChat, setSelectedChat] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const lastSeenRef = useRef(new Map());
  const hasMountedRef = useRef(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
      const directList = Array.from(chatsMap.values()).filter((c) => !c.archived);

      directList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt || 0);
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt || 0);
        return timeB - timeA;
      });

      for (const chat of directList) {
        const updatedTime = chat.updatedAt?.toDate
          ? chat.updatedAt.toDate().getTime()
          : (chat.updatedAt || 0);

        const previousTime = lastSeenRef.current.get(chat.id);
        const isFromOther = chat.lastSenderId && chat.lastSenderId !== userId;

        if (
          hasMountedRef.current &&
          isFromOther &&
          previousTime !== undefined &&
          updatedTime > previousTime
        ) {
          sendBrowserNotification(chat.otherUserName || "New message", {
            body: chat.lastMessage || "Sent you a message",
            tag: `chat-${chat.id}`,
            onClick: () => navigate(`/chat/${chat.id}`),
          });
        }

        lastSeenRef.current.set(chat.id, updatedTime);
      }

      hasMountedRef.current = true;

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

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      chat.otherUserName?.toLowerCase().includes(term) ||
      chat.projectSkill?.toLowerCase().includes(term) ||
      chat.problemTitle?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="loadingText">Loading chats...</div>;
  }

  return (
    <div className="directChatsContainer">
      {filteredChats.length === 0 ? (
        <div className="emptyState">
          <h3>{searchTerm ? "No Matches Found" : "No Direct Chats Yet"}</h3>
          <p>
            {searchTerm
              ? "Try a different name or skill."
              : "Conversations with candidates or users will appear here."}
          </p>
        </div>
      ) : (
        filteredChats.map((chat) => {
          const myUnread = chat.unreadCount?.[auth.currentUser?.uid] || 0;
          const hasUnread = myUnread > 0;

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
              </div>

              <div className="chatInfo">
                <div className="chatHeaderRow">
                  <h3 className="chatUserName">{chat.otherUserName}</h3>

                  <div className="chatMetaRow">
                    {chat.problemTitle && (
                      <span className="chatProblemBadge" title={chat.problemTitle}>
                        {chat.problemTitle}
                      </span>
                    )}

                    {chat.projectSkill && (
                      <span className="chatSkillBadge" title={chat.projectSkill}>
                        {chat.projectSkill}
                      </span>
                    )}
                  </div>
                </div>

                <p className={`chatLastMessage ${hasUnread ? "unread" : ""}`}>
                  {chat.lastMessage || "Tap to open chat"}
                </p>
              </div>

              <div className="chatRightCol">
                <span className="chatTimestamp">
                  {formatLiveTimestamp(chat.updatedAt || chat.createdAt)}
                </span>

                {hasUnread && (
                  <span className="unreadCountBadge">{myUnread > 9 ? "9+" : myUnread}</span>
                )}
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