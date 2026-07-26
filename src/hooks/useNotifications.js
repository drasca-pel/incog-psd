import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const q1 = query(collection(db, "chats"), where("participants", "array-contains", userId));
    const q2 = query(collection(db, "chats"), where("members", "array-contains", userId));

    const chatMap = new Map();

    const buildList = async (snap) => {
      for (const docSnap of snap.docs) {
        const data = docSnap.data();

        const myUnread = data.unreadCount?.[userId] || 0;
        const hasUnread = myUnread > 0;

        if (!hasUnread) {
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
          id: docSnap.id,
          type: "message",
          title: senderName,
          preview: data.lastMessage || "New message",
          timestamp: data.updatedAt || data.createdAt || null,
          link: `/chat/${docSnap.id}`,
          unreadCount: myUnread,
        });
      }

      const list = Array.from(chatMap.values()).sort((a, b) => {
        const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp || 0);
        const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp || 0);
        return tb - ta;
      });
      setNotifications(list);
    };

    const unsub1 = onSnapshot(q1, buildList, (err) => console.error(err));
    const unsub2 = onSnapshot(q2, buildList, (err) => console.error(err));
    return () => { unsub1(); unsub2(); };
  }, []);

  const totalUnread = notifications.reduce((sum, n) => sum + (n.unreadCount || 1), 0);

  return { notifications, unreadCount: totalUnread };
}