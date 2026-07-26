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

export async function getuserlogs() {
  const q = query(
    collection(db, "logs"),
    where("ownerId", "==", auth.currentUser.uid),
    orderby("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createlog(name) {
  const ref = await addDoc(collection(db, "logs"), {
    ownerId: auth.currentUser.uid,
    name,
    itemCount: 0,
    createdAt: servertimestamp(),
    updatedAt: servertimestamp(),
  });
  return ref.id;
}

// saves a reference only — points back to the original chat/message,
// no media is re-uploaded or duplicated. clicking it later just
// navigates back to the original chat.
export async function addreferencetolog(logid, message, chatid) {
  await addDoc(collection(db, "logItems"), {
    logId: logid,
    ownerId: auth.currentUser.uid,
    chatId: chatid,
    messageId: message.id,
    type: message.mediaType || "text",
    text: message.text || "",
    mediaURL: message.mediaURL || null,
    senderName: message.senderName || "unknown",
    savedAt: servertimestamp(),
  });

  await updatedoc(doc(db, "logs", logid), {
    itemCount: increment(1),
    updatedAt: servertimestamp(),
  });
}

export async function getlogitems(logid) {
  const q = query(
    collection(db, "logItems"),
    where("logId", "==", logid),
    orderby("savedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deletelogitem(itemid, logid) {
  await deletedoc(doc(db, "logItems", itemid));
  await updatedoc(doc(db, "logs", logid), {
    itemCount: increment(-1),
    updatedAt: servertimestamp(),
  });
}

export async function deletelog(logid) {
  const q = query(collection(db, "logItems"), where("logId", "==", logid));
  const snap = await getDocs(q);
  for (const item of snap.docs) {
    await deletedoc(item.ref);
  }
  await deletedoc(doc(db, "logs", logid));
}