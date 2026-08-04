import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";

import { createNotification } from "../utils/notificationsService";

import "../styles/MyBroadcasts.css";

export default function MyBroadcasts() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("active");
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  // ============================================================
  // GET EXPIRATION TIME
  // ============================================================

  function getExpiresAtMillis(expiresAt) {
    if (!expiresAt) return null;

    // Firestore Timestamp
    if (typeof expiresAt.toMillis === "function") {
      return expiresAt.toMillis();
    }

    // Firestore Timestamp-like object
    if (
      typeof expiresAt.seconds === "number"
    ) {
      return expiresAt.seconds * 1000;
    }

    // JavaScript number
    if (typeof expiresAt === "number") {
      return expiresAt;
    }

    // Date/string fallback
    if (expiresAt instanceof Date) {
      return expiresAt.getTime();
    }

    const parsed = new Date(expiresAt).getTime();

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }

  // ============================================================
  // DELETE ALERTS FOR A BROADCAST
  // ============================================================

  async function deleteBroadcastAlerts(broadcastId) {
    const alertsQuery = query(
      collection(db, "alerts"),
      where("broadcastId", "==", broadcastId)
    );

    const alertsSnapshot =
      await getDocs(alertsQuery);

    for (const alertDoc of alertsSnapshot.docs) {
      await deleteDoc(alertDoc.ref);
    }
  }

  // ============================================================
  // COMPLETELY DELETE BROADCAST
  //
  // IMPORTANT:
  // This deletes:
  //   - alerts
  //   - broadcast
  //
  // It DOES NOT delete:
  //   - chats
  //   - workspaces
  // ============================================================

  async function completelyDeleteBroadcast(
    broadcastId
  ) {
    // Delete alerts belonging to this broadcast
    await deleteBroadcastAlerts(broadcastId);

    // Delete the broadcast itself
    await deleteDoc(
      doc(db, "broadcasts", broadcastId)
    );
  }

  // ============================================================
  // HANDLE EXPIRED BROADCAST
  // ============================================================

  async function handleExpiredBroadcast(
    broadcast
  ) {
    try {
      // --------------------------------------------------------
      // 1. Tell the broadcaster that it expired
      // --------------------------------------------------------

      await createNotification({
        recipientId: broadcast.creatorId,
        type: "broadcast_expired",
        title: "Broadcast Expired",
        message: `"${broadcast.title}" has expired after 7 days.`,
        link: "/my-broadcasts",
      });

      // --------------------------------------------------------
      // 2. Delete alerts + broadcast
      // --------------------------------------------------------

      await completelyDeleteBroadcast(
        broadcast.id
      );

      console.log(
        "Expired broadcast deleted:",
        broadcast.id
      );
    } catch (error) {
      console.error(
        "Error handling expired broadcast:",
        error
      );

      throw error;
    }
  }

  // ============================================================
  // LOAD BROADCASTS
  // ============================================================

  async function loadBroadcasts() {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "broadcasts"),
        where(
          "creatorId",
          "==",
          auth.currentUser.uid
        )
      );

      const snapshot = await getDocs(q);

      const now = Date.now();
      const validBroadcasts = [];

      for (const broadcastDoc of snapshot.docs) {
        const broadcast = {
          id: broadcastDoc.id,
          ...broadcastDoc.data(),
        };

        const expiresAtMillis =
          getExpiresAtMillis(
            broadcast.expiresAt
          );

        // ------------------------------------------------------
        // EXPIRED ACTIVE BROADCAST
        // ------------------------------------------------------

        if (
          broadcast.status === "active" &&
          expiresAtMillis &&
          now >= expiresAtMillis
        ) {
          try {
            await handleExpiredBroadcast(
              broadcast
            );
          } catch (error) {
            // If cleanup fails, don't silently remove it
            // from the UI. Keep it visible so the user can
            // still try again.
            validBroadcasts.push(broadcast);
          }

          continue;
        }

        // ------------------------------------------------------
        // NOT EXPIRED
        // ------------------------------------------------------

        validBroadcasts.push(broadcast);
      }

      setBroadcasts(validBroadcasts);
    } catch (error) {
      console.error(
        "Error loading broadcasts:",
        error
      );

      setConfirmModal({
        title: "Something Went Wrong",
        message:
          "Unable to load your broadcasts. Please try again.",
        confirmText: "OK",
        type: "info",
        action: () =>
          setConfirmModal(null),
      });
    }

    setLoading(false);
  }

  // ============================================================
  // MANUAL DELETE
  // ============================================================

  function handleDelete(id) {
    setConfirmModal({
      title: "Delete Broadcast?",
      message:
        "This will permanently delete the broadcast and its alerts. Existing chats will not be deleted.",
      confirmText: "Delete",
      type: "confirm",

      action: async () => {
        try {
          await completelyDeleteBroadcast(id);

          setBroadcasts((prev) =>
            prev.filter(
              (broadcast) =>
                broadcast.id !== id
            )
          );

          setConfirmModal(null);
        } catch (error) {
          console.error(
            "Delete broadcast error:",
            error
          );

          setConfirmModal({
            title: "Delete Failed",
            message:
              error.message ||
              "Unable to delete broadcast.",
            confirmText: "OK",
            type: "info",
            action: () =>
              setConfirmModal(null),
          });
        }
      },
    });
  }

  // ============================================================
  // COMPLETE PROJECT
  // ============================================================

  function completeProject(broadcast) {
    setConfirmModal({
      title: "Complete Project?",
      message:
        "This will mark the project as completed and remove its active alerts. Existing chats will remain available.",
      confirmText: "Complete",
      type: "confirm",

      action: async () => {
        try {
          // ----------------------------------------------------
          // Mark broadcast completed
          // ----------------------------------------------------

          await updateDoc(
            doc(
              db,
              "broadcasts",
              broadcast.id
            ),
            {
              status: "completed",
              completedAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            }
          );

          // ----------------------------------------------------
          // Remove alerts
          // ----------------------------------------------------

          await deleteBroadcastAlerts(
            broadcast.id
          );

          // ----------------------------------------------------
          // Update local UI
          // ----------------------------------------------------

          setBroadcasts((prev) =>
            prev.map((item) =>
              item.id === broadcast.id
                ? {
                    ...item,
                    status: "completed",
                  }
                : item
            )
          );

          setConfirmModal(null);
        } catch (error) {
          console.error(
            "Complete project error:",
            error
          );

          setConfirmModal({
            title: "Completion Failed",
            message:
              error.message ||
              "Unable to complete project. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () =>
              setConfirmModal(null),
          });
        }
      },
    });
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="loadingText">
        Loading broadcasts...
      </div>
    );
  }

  // ============================================================
  // FILTERS
  // ============================================================

  const activeBroadcasts =
    broadcasts.filter(
      (broadcast) =>
        broadcast.status === "active"
    );

  const progressBroadcasts =
    broadcasts.filter(
      (broadcast) =>
        broadcast.status === "in_progress"
    );

  const completedBroadcasts =
    broadcasts.filter(
      (broadcast) =>
        broadcast.status === "completed"
    );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="myBroadcastsPage">

      <h1 className="pageTitle">
        My Broadcasts
      </h1>

      <div className="tabsContainer">

        <button
          className={`tabButton ${
            activeTab === "active"
              ? "activeTab"
              : ""
          }`}
          onClick={() =>
            setActiveTab("active")
          }
        >
          Active
        </button>

        <button
          className={`tabButton ${
            activeTab === "progress"
              ? "activeTab"
              : ""
          }`}
          onClick={() =>
            setActiveTab("progress")
          }
        >
          In Progress
        </button>

        <button
          className={`tabButton ${
            activeTab === "completed"
              ? "activeTab"
              : ""
          }`}
          onClick={() =>
            setActiveTab("completed")
          }
        >
          Completed
        </button>

      </div>

      <div className="broadcastContent">

        {/* ================================================== */}
        {/* ACTIVE */}
        {/* ================================================== */}

        {activeTab === "active" && (
          <div>

            {activeBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>
                    {broadcast.title}
                  </h3>

                  <p className="broadcastGroup">
                    {
                      broadcast
                        .targetSkills?.[0]
                    }
                  </p>

                  <p>
                    {broadcast.description}
                  </p>

                  {broadcast.media && (
                    <>
                      {broadcast.media.type?.startsWith(
                        "image"
                      ) && (
                        <img
                          src={
                            broadcast.media
                              .url
                          }
                          alt={
                            broadcast.media
                              .name
                          }
                          className="broadcastImage"
                          onClick={() =>
                            setSelectedImage(
                              broadcast
                                .media
                                .url
                            )
                          }
                        />
                      )}

                      {broadcast.media.type?.startsWith(
                        "video"
                      ) && (
                        <video
                          src={
                            broadcast.media
                              .url
                          }
                          controls
                          className="broadcastVideo"
                        />
                      )}

                      {!broadcast.media.type?.startsWith(
                        "image"
                      ) &&
                        !broadcast.media.type?.startsWith(
                          "video"
                        ) && (
                          <a
                            href={
                              broadcast
                                .media
                                .url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Attachment:{" "}
                            {
                              broadcast
                                .media
                                .name
                            }
                          </a>
                        )}
                    </>
                  )}

                  <span className="statusBadge statusActive">
                    Active
                  </span>

                  <div className="broadcastActions">

                    <button
                      className="editButton"
                      onClick={() =>
                        navigate(
                          `/edit-broadcast/${broadcast.id}`
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        handleDelete(
                          broadcast.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              )
            )}

            {activeBroadcasts.length ===
              0 && (
              <div className="emptyState">
                <h2>
                  No Active Broadcasts
                </h2>

                <p>
                  Your active broadcasts
                  will appear here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* IN PROGRESS */}
        {/* ================================================== */}

        {activeTab === "progress" && (
          <div>

            {progressBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>
                    {broadcast.title}
                  </h3>

                  <p className="broadcastGroup">
                    {
                      broadcast
                        .targetSkills?.[0]
                    }
                  </p>

                  <p>
                    {broadcast.description}
                  </p>

                  <span className="statusBadge statusProgress">
                    In Progress
                  </span>

                  <div className="broadcastActions">

                    <button
                      className="editButton"
                      onClick={() =>
                        navigate(
                          `/interested-candidates/${broadcast.id}`
                        )
                      }
                    >
                      View Interested
                      Candidates
                    </button>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        completeProject(
                          broadcast
                        )
                      }
                    >
                      Complete Project
                    </button>

                  </div>

                </div>
              )
            )}

            {progressBroadcasts.length ===
              0 && (
              <div className="emptyState">
                <h2>
                  No Broadcasts In Progress
                </h2>

                <p>
                  Broadcasts being worked
                  on will appear here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* COMPLETED */}
        {/* ================================================== */}

        {activeTab === "completed" && (
          <div>

            {completedBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>
                    {broadcast.title}
                  </h3>

                  <p className="broadcastGroup">
                    {
                      broadcast
                        .targetSkills?.[0]
                    }
                  </p>

                  <p>
                    {broadcast.description}
                  </p>

                  <span className="statusBadge statusCompleted">
                    Completed
                  </span>

                </div>
              )
            )}

            {completedBroadcasts.length ===
              0 && (
              <div className="emptyState">
                <h2>
                  No Completed Broadcasts
                </h2>

                <p>
                  Your completed broadcasts
                  will appear here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* CREATE */}
        {/* ================================================== */}

        <div
          className="createBroadcastCard"
          onClick={() =>
            navigate("/broadcast")
          }
        >
          <div className="plusIcon">
            +
          </div>

          <h3>
            Create a New Broadcast
          </h3>
        </div>

        {/* ================================================== */}
        {/* IMAGE VIEWER */}
        {/* ================================================== */}

        {selectedImage && (
          <div className="imageViewer">

            <button
              className="imageBackButton"
              onClick={() =>
                setSelectedImage(null)
              }
            >
              ←
            </button>

            <img
              src={selectedImage}
              alt="Full View"
              className="imageViewerImg"
            />

          </div>
        )}

      </div>

      {/* ================================================== */}
      {/* CONFIRM MODAL */}
      {/* ================================================== */}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={
            confirmModal.confirmText
          }
          type={
            confirmModal.type ||
            "confirm"
          }
          onConfirm={
            confirmModal.action
          }
          onClose={() =>
            setConfirmModal(null)
          }
        />
      )}

    </div>
  );
}