import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function useNotifications() {
  const [chatNotifications, setChatNotifications] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const q1 = query(collection(db, "chats"), where("participants", "array-contains", userId));
    const q2 = query(collection(db, "chats"), where("members", "array-contains", userId));

    const chatMap = new Map();

    const buildChatList = async (snap) => {
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const myUnread = data.unreadCount?.[userId] || 0;

        if (myUnread <= 0) {
          chatMap.delete(docSnap.id);
          continue;
        }

        let senderName = data.otherUserName || data.recipientName || "Someone";
        if (data.lastSenderId) {
          try {
            const senderSnap = await getDoc(doc(db, "users", data.lastSenderId));
            if (senderSnap.exists()) {
              senderName = senderSnap.data().name || senderSnap.data().displayName || senderName;
            }
          } catch (err) {
            console.error("Error fetching sender profile:", err);
          }
        }

        chatMap.set(docSnap.id, {
          id: `chat-${docSnap.id}`,
          category: "chat",
          title: senderName,
          preview: data.lastMessage || "New message",
          timestamp: data.updatedAt || data.createdAt || null,
          link: `/chat/${docSnap.id}`,
          unreadCount: myUnread,
        });
      }

      setChatNotifications(Array.from(chatMap.values()));
    };

    const unsub1 = onSnapshot(q1, buildChatList, (err) => console.error(err));
    const unsub2 = onSnapshot(q2, buildChatList, (err) => console.error(err));

    const notifQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );

    const unsub3 = onSnapshot(
      notifQuery,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            category: "activity",
            title: data.title || "Notification",
            preview: data.message || "",
            timestamp: data.createdAt || null,
            link: data.link || "/dashboard",
            unreadCount: 1,
          };
        });
        setActivityNotifications(list);
      },
      (err) => console.error("Notification listener error:", err)
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const notifications = [...chatNotifications, ...activityNotifications].sort((a, b) => {
    const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp || 0);
    const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp || 0);
    return tb - ta;
  });

  const totalUnread = notifications.reduce((sum, n) => sum + (n.unreadCount || 1), 0);

  return { notifications, unreadCount: totalUnread };
}