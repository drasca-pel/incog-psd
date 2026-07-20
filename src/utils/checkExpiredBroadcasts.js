import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export async function checkExpiredBroadcasts() {
  try {
    const snapshot = await getDocs(
      collection(db, "broadcasts")
    );

    const now = Date.now();

    for (const item of snapshot.docs) {
      const data = item.data();

      if (
        data.status === "active" &&
        data.expiresAt &&
        now >= data.expiresAt
      ) {
        await updateDoc(
          doc(db, "broadcasts", item.id),
          {
            status: "expired",
          }
        );

        console.log(
          "Expired:",
          item.id
        );
      }
    }
  } catch (error) {
    console.error(
      "Expiry checker error:",
      error
    );
  }
}