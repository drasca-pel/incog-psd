const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

setGlobalOptions({
  maxInstances: 1,
});

const db = getFirestore();

/*
|--------------------------------------------------------------------------
| Delete all alerts belonging to a broadcast
|--------------------------------------------------------------------------
*/

async function deleteBroadcastAlerts(broadcastId) {
  const alertsSnapshot = await db
    .collection("alerts")
    .where("broadcastId", "==", broadcastId)
    .get();

  if (alertsSnapshot.empty) {
    return;
  }

  const batch = db.batch();

  alertsSnapshot.docs.forEach((alertDoc) => {
    batch.delete(alertDoc.ref);
  });

  await batch.commit();
}

/*
|--------------------------------------------------------------------------
| Create notification for broadcaster
|--------------------------------------------------------------------------
*/

async function notifyBroadcastExpired(broadcast) {
  if (!broadcast.creatorId) {
    return;
  }

  await db.collection("notifications").add({
    recipientId: broadcast.creatorId,

    title: "Broadcast Expired",

    message: `"${broadcast.title}" expired after 7 days without being accepted.`,

    link: "/my-broadcasts",

    category: "activity",

    read: false,

    broadcastId: broadcast.id,

    createdAt: Timestamp.now(),
  });
}

/*
|--------------------------------------------------------------------------
| Seven-day broadcast cleanup
|--------------------------------------------------------------------------
|
| Runs automatically every hour.
|
| IMPORTANT:
| We only remove ACTIVE broadcasts.
|
| Therefore:
|
| active       -> can expire
| in_progress  -> untouched
| completed    -> untouched
| expired      -> ignored
|
|--------------------------------------------------------------------------
*/

exports.cleanupExpiredBroadcasts = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Africa/Lagos",
  },
  async () => {
    console.log("Starting broadcast cleanup...");

    const now = Date.now();

    const snapshot = await db
      .collection("broadcasts")
      .where("status", "==", "active")
      .get();

    if (snapshot.empty) {
      console.log("No active broadcasts found.");
      return;
    }

    let deletedCount = 0;

    for (const broadcastDoc of snapshot.docs) {
      const data = broadcastDoc.data();

      if (!data.expiresAt) {
        continue;
      }

      /*
       * expiresAt was created as a JavaScript timestamp number
       * by your Broadcast.jsx:
       *
       * Date.now() + 7 days
       */

      const expiresAt =
        typeof data.expiresAt === "number"
          ? data.expiresAt
          : data.expiresAt?.toMillis
            ? data.expiresAt.toMillis()
            : null;

      if (!expiresAt) {
        continue;
      }

      if (now < expiresAt) {
        continue;
      }

      /*
       * Double-check that it is STILL active.
       *
       * This prevents us from touching a broadcast that was
       * accepted/completed while this cleanup was running.
       */

      const latestSnap = await broadcastDoc.ref.get();

      if (!latestSnap.exists) {
        continue;
      }

      const latestData = latestSnap.data();

      if (latestData.status !== "active") {
        console.log(
          `Skipping ${broadcastDoc.id} because status is ${latestData.status}`
        );

        continue;
      }

      /*
       * IMPORTANT:
       *
       * We do NOT delete chats.
       * We do NOT delete workspaces.
       *
       * The seven-day cleanup only applies to an unaccepted
       * active broadcast and its alerts.
       */

      try {
        const broadcast = {
          id: broadcastDoc.id,
          ...latestData,
        };

        /*
         * Tell the broadcaster first.
         */

        await notifyBroadcastExpired(broadcast);

        /*
         * Remove all alerts belonging to this broadcast.
         */

        await deleteBroadcastAlerts(broadcastDoc.id);

        /*
         * Finally remove the broadcast itself.
         */

        await broadcastDoc.ref.delete();

        deletedCount++;

        console.log(
          `Expired broadcast deleted: ${broadcastDoc.id}`
        );
      } catch (error) {
        console.error(
          `Failed to clean broadcast ${broadcastDoc.id}:`,
          error
        );
      }
    }

    console.log(
      `Broadcast cleanup finished. Deleted: ${deletedCount}`
    );
  }
);