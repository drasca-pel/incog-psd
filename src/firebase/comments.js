import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function addComment(postId, text) {
  const user = auth.currentUser;

  return await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      text,
      authorId: user.uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL || "",
      createdAt: serverTimestamp(),
    }
  );
}