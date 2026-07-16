import { db, auth } from "./firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

export async function likePost(postId) {
  const user = auth.currentUser;

  await updateDoc(doc(db, "posts", postId), {
    likes: arrayUnion(user.uid),
  });
}

export async function unlikePost(postId) {
  const user = auth.currentUser;

  await updateDoc(doc(db, "posts", postId), {
    likes: arrayRemove(user.uid),
  });
}