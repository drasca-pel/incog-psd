import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function createPost(post) {
  const user = auth.currentUser;

  return await addDoc(collection(db, "posts"), {
    text: post.text,
    mediaUrl: post.mediaUrl || "",
    mediaType: post.mediaType || "",

    authorId: user.uid,
    authorName: user.displayName,
    authorPhoto: user.photoURL || "",

    likes: [],
    comments: 0,

    createdAt: serverTimestamp(),
  });
}