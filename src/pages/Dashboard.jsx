import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { collection, getDocs, where, query, orderBy, limit, doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import NotificationPanel from "../components/NotificationPanel";
import useNotifications from "../hooks/useNotifications";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [recentChats, setRecentChats] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    const loadBroadcasts = async () => {
      try {
        if (!auth.currentUser) return;

        const q = query(
          collection(db, "broadcasts"),
          where("creatorId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBroadcasts(data);
      } catch (err) {
        console.error("Error loading broadcasts:", err);
      }
    };

    const loadUser = async () => {
      try {
        if (!auth.currentUser) return;
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (snap.exists()) {
          setUserData(snap.data());
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    loadBroadcasts();
    loadUser();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;

    const q1 = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      limit(3)
    );

    const q2 = query(
      collection(db, "chats"),
      where("members", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      limit(3)
    );

    const chatMap = new Map();

    const processSnapshot = async () => {
      const chatList = Array.from(chatMap.values()).filter((c) => !c.archived);

      chatList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt || 0);
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt || 0);
        return timeB - timeA;
      });

      setRecentChats(chatList.slice(0, 3));
    };

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

      await processSnapshot();
    };

    const unsub1 = onSnapshot(q1, async (snap) => {
      await handleSnapshotData(snap);
    }, (err) => console.error("Recent chats error (participants):", err));

    const unsub2 = onSnapshot(q2, async (snap) => {
      await handleSnapshotData(snap);
    }, (err) => console.error("Recent chats error (members):", err));

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <div className="dashboard">

      <header className="topbar">

        <div className="logoSection">
          <div className="logoBox">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#logoGradient)" />
              <circle cx="9" cy="9" r="1.6" fill="#fff" fillOpacity="0.95" />
              <circle cx="15" cy="9" r="1.6" fill="#fff" fillOpacity="0.95" />
              <circle cx="9" cy="15" r="1.6" fill="#fff" fillOpacity="0.7" />
              <circle cx="15" cy="15" r="1.6" fill="#fff" fillOpacity="0.7" />
              <path d="M9 9L15 9M9 9L9 15M15 9L15 15M9 15L15 15" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <h2>INCOG PSD</h2>
            <p>Professional Skills & Development</p>
          </div>
        </div>

        <div className="topActions">

          <button
            className="iconButton notificationButton"
            onClick={() => setNotifOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>

            {unreadCount > 0 && <span className="notificationBadge">{unreadCount}</span>}
          </button>

          <div
            className="profileAvatar"
            onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)}
            style={{ cursor: "pointer", overflow: "hidden" }}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              auth.currentUser?.displayName?.charAt(0).toUpperCase() || "A"
            )}
          </div>

        </div>

      </header>

      <main className="dashboardContent">

        <section className="welcomeCard">
          <span className="welcomeLabel">Welcome Back</span>
          <h1>{auth.currentUser?.displayName || "INCOG User"}</h1>
          <p>
            Solve engineering problems, collaborate with professionals,
            and grow your technical portfolio with INCOG PSD.
          </p>
          <button className="primaryButton" onClick={() => navigate("/logs")}>
            My Logs
          </button>
        </section>

        <section className="broadcastSection">
          <div className="sectionHeader">
            <h2>My Recent Broadcasts</h2>
            <button className="viewButton" onClick={() => navigate("/my-broadcasts")}>
              See All
            </button>
          </div>

          <div className="broadcastList">
            {broadcasts.length === 0 ? (
              <div className="emptyState">No broadcasts available.</div>
            ) : (
              broadcasts.slice(0, 2).map((broadcast) => (
                <div className="broadcastCard" key={broadcast.id}>
                  <div className="broadcastHeader">
                    <div className="broadcastAvatar">
                      {(broadcast.creatorName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="broadcastInfo">
                      <h3>{broadcast.title}</h3>
                      <span>{broadcast.targetSkills?.join(", ") || "General"}</span>
                    </div>
                  </div>
                  <p className="broadcastDescription">{broadcast.description}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="chatSection">
          <div className="sectionHeader">
            <h2>Recent Chats</h2>
            <button className="seeAllButton" onClick={() => navigate("/chat")}>
              Open Chat
            </button>
          </div>

          {recentChats.length === 0 ? (
            <div className="emptyState">No recent chats.</div>
          ) : (
            <div className="recentChatsList">
              {recentChats.map((chat) => {
                const myUnread = chat.unreadCount?.[auth.currentUser?.uid] || 0;
                const hasUnread = myUnread > 0;

                return (
                  <div
                    key={chat.id}
                    className="recentChatCard"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <div className="recentChatAvatar">
                      {chat.otherUserPhoto ? (
                        <img src={chat.otherUserPhoto} alt={chat.otherUserName} />
                      ) : (
                        chat.otherUserName?.charAt(0).toUpperCase() || "C"
                      )}
                    </div>

                    <div className="recentChatBody">
                      <div className="recentChatTop">
                        <span className="recentChatName">{chat.otherUserName || "Chat"}</span>
                        {hasUnread && (
                          <span className="recentChatUnread">{myUnread > 9 ? "9+" : myUnread}</span>
                        )}
                      </div>
                      <span className={`recentChatPreview ${hasUnread ? "unread" : ""}`}>
                        {chat.lastMessage || "Tap to open"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
      />

      <ConfirmModal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />

    </div>
  );
}