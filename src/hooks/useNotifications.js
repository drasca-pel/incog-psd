import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export default function useNotifications() {
  const [chatNotifications, setChatNotifications] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState([]);

  useEffect(() => {
    let unsubscribeParticipants = null;
    let unsubscribeMembers = null;
    let unsubscribeNotifications = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeParticipants) {
        unsubscribeParticipants();
        unsubscribeParticipants = null;
      }

      if (unsubscribeMembers) {
        unsubscribeMembers();
        unsubscribeMembers = null;
      }

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      setChatNotifications([]);
      setActivityNotifications([]);

      if (!user) return;

      const userId = user.uid;

      // =====================================================
      // CHAT NOTIFICATIONS
      // ONLY UNREAD CHAT MESSAGES COME FROM HERE
      // =====================================================

      const chatMap = new Map();

      async function processChats(snapshot) {
        for (const chatDoc of snapshot.docs) {
          const data = chatDoc.data();

          const unreadCount =
            data.unreadCount?.[userId] || 0;

          if (unreadCount <= 0) {
            chatMap.delete(chatDoc.id);
            continue;
          }

          let senderName =
            data.otherUserName ||
            data.recipientName ||
            data.helperName ||
            data.ownerName ||
            "Someone";

          if (data.lastSenderId) {
            try {
              const senderSnap = await getDoc(
                doc(db, "users", data.lastSenderId)
              );

              if (senderSnap.exists()) {
                const senderData = senderSnap.data();

                senderName =
                  senderData.name ||
                  senderData.displayName ||
                  senderName;
              }
            } catch (error) {
              console.error(
                "Error loading sender profile:",
                error
              );
            }
          }

          chatMap.set(chatDoc.id, {
            id: `chat-${chatDoc.id}`,
            category: "chat",
            title: senderName,
            preview:
              data.lastMessage ||
              "New message",
            timestamp:
              data.lastMessageAt ||
              data.updatedAt ||
              data.createdAt ||
              null,
            link: `/chat/${chatDoc.id}`,
            unreadCount,
          });
        }

        setChatNotifications(
          Array.from(chatMap.values())
        );
      }

      // Older chat structure
      const participantsQuery = query(
        collection(db, "chats"),
        where(
          "participants",
          "array-contains",
          userId
        )
      );

      // Current chat structure
      const membersQuery = query(
        collection(db, "chats"),
        where(
          "members",
          "array-contains",
          userId
        )
      );

      unsubscribeParticipants = onSnapshot(
        participantsQuery,
        processChats,
        (error) => {
          console.error(
            "Chat participants listener:",
            error
          );
        }
      );

      unsubscribeMembers = onSnapshot(
        membersQuery,
        processChats,
        (error) => {
          console.error(
            "Chat members listener:",
            error
          );
        }
      );

      // =====================================================
      // ACTIVITY NOTIFICATIONS
      // THIS IS SEPARATE FROM CHATS
      // =====================================================

      const notificationsQuery = query(
        collection(db, "notifications"),
        where(
          "recipientId",
          "==",
          userId
        ),
        where(
          "read",
          "==",
          false
        )
      );

      unsubscribeNotifications = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const list = snapshot.docs.map(
            (notificationDoc) => {
              const data =
                notificationDoc.data();

              return {
                id: notificationDoc.id,
                category: "activity",
                title:
                  data.title ||
                  "Notification",
                preview:
                  data.message || "",
                timestamp:
                  data.createdAt || null,
                link:
                  data.link ||
                  "/dashboard",
                unreadCount: 1,
              };
            }
          );

          setActivityNotifications(list);
        },
        (error) => {
          console.error(
            "Notification listener error:",
            error
          );

          setActivityNotifications([]);
        }
      );
    });

    return () => {
      if (unsubscribeParticipants) {
        unsubscribeParticipants();
      }

      if (unsubscribeMembers) {
        unsubscribeMembers();
      }

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }

      unsubscribeAuth();
    };
  }, []);

  const notifications = [
    ...chatNotifications,
    ...activityNotifications,
  ].sort((a, b) => {
    const timeA = a.timestamp?.toDate
      ? a.timestamp.toDate().getTime()
      : a.timestamp || 0;

    const timeB = b.timestamp?.toDate
      ? b.timestamp.toDate().getTime()
      : b.timestamp || 0;

    return timeB - timeA;
  });

  const unreadCount = notifications.reduce(
    (total, notification) =>
      total +
      (notification.unreadCount || 1),
    0
  );

  return {
    notifications,
    chatNotifications,
    activityNotifications,
    unreadCount,
  };
}