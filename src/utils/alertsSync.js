import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Call this whenever a user's skills change (initial signup or later
// edits in Settings), or whenever Alerts.jsx loads. Catches them up
// on alerts for existing active broadcasts matching their skills, so
// they don't miss broadcasts that were posted before they had that
// skill selected or before they signed up.
export async function syncAlertsForSkills(uid, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return;

  try {
    // array-contains-any supports up to 10 values — fine since the
    // app caps skill selection at 5.
    const broadcastsQuery = query(
      collection(db, "broadcasts"),
      where("status", "==", "active"),
      where("targetSkills", "array-contains-any", selectedSkills)
    );

    const broadcastsSnap = await getDocs(broadcastsQuery);

    for (const broadcastDoc of broadcastsSnap.docs) {
      const broadcast = broadcastDoc.data();

      // Don't alert someone about their own broadcast
      if (broadcast.creatorId === uid) continue;

      // Skip if this user already has an alert for this broadcast
      const existingAlertQuery = query(
        collection(db, "alerts"),
        where("broadcastId", "==", broadcastDoc.id),
        where("receiverId", "==", uid)
      );

      const existingAlertSnap = await getDocs(existingAlertQuery);
      if (!existingAlertSnap.empty) continue;

      await addDoc(collection(db, "alerts"), {
        receiverId: uid,
        creatorId: broadcast.creatorId,
        creatorName: broadcast.creatorName,
        broadcastId: broadcastDoc.id,
        title: broadcast.title,
        group: broadcast.targetSkills?.[0] || "",
        status: "unread",
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Error syncing alerts for skills:", err);
  }
}