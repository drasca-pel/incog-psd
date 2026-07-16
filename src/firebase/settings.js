import { db, auth } from "./firebase";
import {
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

const DAYS = 30;

export async function updateSkills(newSkills) {
  const userRef = doc(db, "users", auth.currentUser.uid);

  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("User not found.");
  }

  const data = snap.data();

  const last = data.lastSkillUpdate;

  if (last) {
    const lastDate = last.toDate();

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + DAYS);

    if (new Date() < nextDate) {
      const remaining = Math.ceil(
        (nextDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      throw new Error(
        `You can change your skills again in ${remaining} day(s).`
      );
    }
  }

  await updateDoc(userRef, {
    skills: newSkills,
    lastSkillUpdate: Timestamp.now(),
  });
}