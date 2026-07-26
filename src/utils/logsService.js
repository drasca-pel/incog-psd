import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export async function getUserLogs() {
  const q = query(
    collection(db, "logs"),
    where("ownerId", "==", auth.currentUser.uid),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createLog(name) {
  const ref = await addDoc(collection(db, "logs"), {
    ownerId: auth.currentUser.uid,
    name,
    itemCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Saves a reference only — points back to the original chat/message,
// no media is re-uploaded or duplicated. Clicking it later just
// navigates back to the original chat.
export async function addReferenceToLog(logId, message, chatId) {
  await addDoc(collection(db, "logItems"), {
    logId,
    ownerId: auth.currentUser.uid,
    chatId,
    messageId: message.id,
    type: message.mediaType || "text",
    text: message.text || "",
    mediaURL: message.mediaURL || null,
    senderName: message.senderName || "Unknown",
    savedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "logs", logId), {
    itemCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function getLogItems(logId) {
  const q = query(
    collection(db, "logItems"),
    where("logId", "==", logId),
    orderBy("savedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteLogItem(itemId, logId) {
  await deleteDoc(doc(db, "logItems", itemId));
  await updateDoc(doc(db, "logs", logId), {
    itemCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLog(logId) {
  const q = query(collection(db, "logItems"), where("logId", "==", logId));
  const snap = await getDocs(q);
  for (const item of snap.docs) {
    await deleteDoc(item.ref);
  }
  await deleteDoc(doc(db, "logs", logId));
}