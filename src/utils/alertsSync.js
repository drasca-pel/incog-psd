import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export async function syncAlertsForSkills(
  uid,
  selectedSkills
) {
  if (
    !selectedSkills ||
    selectedSkills.length === 0
  ) {
    return;
  }

  try {
    const broadcastsQuery = query(
      collection(db, "broadcasts"),
      where(
        "status",
        "==",
        "active"
      ),
      where(
        "targetSkills",
        "array-contains-any",
        selectedSkills
      )
    );

    const broadcastsSnap =
      await getDocs(
        broadcastsQuery
      );

    const now = Date.now();

    for (
      const broadcastDoc
      of broadcastsSnap.docs
    ) {
      const broadcast =
        broadcastDoc.data();

      // Never alert the creator.
      if (
        broadcast.creatorId === uid
      ) {
        continue;
      }

      // ===================================================
      // DO NOT RESURRECT EXPIRED BROADCASTS
      // ===================================================

      if (
        broadcast.expiresAt &&
        broadcast.expiresAt <= now
      ) {
        continue;
      }

      // ===================================================
      // DO NOT ALERT FOR CLOSED BROADCASTS
      // ===================================================

      if (
        broadcast.status !== "active"
      ) {
        continue;
      }

      // ===================================================
      // CHECK EXISTING ALERT
      // ===================================================

      const existingAlertQuery =
        query(
          collection(db, "alerts"),
          where(
            "broadcastId",
            "==",
            broadcastDoc.id
          ),
          where(
            "receiverId",
            "==",
            uid
          )
        );

      const existingAlertSnap =
        await getDocs(
          existingAlertQuery
        );

      if (
        !existingAlertSnap.empty
      ) {
        continue;
      }

      // ===================================================
      // CREATE ALERT
      // ===================================================

      await addDoc(
        collection(db, "alerts"),
        {
          receiverId: uid,

          creatorId:
            broadcast.creatorId,

          creatorName:
            broadcast.creatorName ||
            "INCOG User",

          broadcastId:
            broadcastDoc.id,

          title:
            broadcast.title,

          group:
            broadcast.targetSkills?.[0] ||
            "",

          status: "unread",

          createdAt:
            serverTimestamp(),
        }
      );
    }
  } catch (error) {
    console.error(
      "Error syncing alerts:",
      error
    );
  }
}