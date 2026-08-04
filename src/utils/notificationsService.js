import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export async function createNotification({
  recipientId,
  type,
  title,
  message,
  link,
}) {
  await addDoc(collection(db, "notifications"), {
    recipientId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(notificationId) {
  await updateDoc(
    doc(db, "notifications", notificationId),
    {
      read: true,
    }
  );
}

export async function deleteNotification(notificationId) {
  await deleteDoc(
    doc(db, "notifications", notificationId)
  );
}