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
} from "firebase/firestore";

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

  // --------------------------------------------------
  // DELETE EVERYTHING BELONGING TO A BROADCAST
  // --------------------------------------------------

  async function deleteBroadcastCompletely(broadcastId) {
    // 1. Delete broadcast
    await deleteDoc(
      collection(db, "broadcasts")
    ).catch(() => {});

    // The above cannot delete a collection reference.
    // The actual broadcast deletion happens below.
  }

  async function completelyDeleteBroadcast(broadcastId) {
    // Delete broadcast document
    await deleteDoc(
      require("firebase/firestore").doc(
        db,
        "broadcasts",
        broadcastId
      )
    );

    // Delete all alerts belonging to it
    const alertsQuery = query(
      collection(db, "alerts"),
      where("broadcastId", "==", broadcastId)
    );

    const alertsSnapshot = await getDocs(alertsQuery);

    for (const alertDoc of alertsSnapshot.docs) {
      await deleteDoc(alertDoc.ref);
    }

    // Delete workspace(s)
    const workspaceQuery = query(
      collection(db, "workspaces"),
      where("broadcastId", "==", broadcastId)
    );

    const workspaceSnapshot = await getDocs(workspaceQuery);

    for (const workspaceDoc of workspaceSnapshot.docs) {
      await deleteDoc(workspaceDoc.ref);
    }
  }

  // --------------------------------------------------
  // LOAD + CLEAN EXPIRED BROADCASTS
  // --------------------------------------------------

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

        // ------------------------------------------------
        // DELETE EXPIRED BROADCAST
        // ------------------------------------------------

        if (
          broadcast.expiresAt &&
          broadcast.expiresAt <= now &&
          broadcast.status === "active"
        ) {
          try {
            await completelyDeleteBroadcast(
              broadcast.id
            );

            continue;
          } catch (error) {
            console.error(
              "Error deleting expired broadcast:",
              error
            );
          }
        }

        validBroadcasts.push(broadcast);
      }

      setBroadcasts(validBroadcasts);
    } catch (error) {
      console.error(error);

      setConfirmModal({
        title: "Something Went Wrong",
        message:
          "Unable to load your broadcasts. Please try again.",
        confirmText: "OK",
        type: "info",
        action: () => setConfirmModal(null),
      });
    }

    setLoading(false);
  }

  // --------------------------------------------------
  // MANUAL DELETE
  // --------------------------------------------------

  const handleDelete = async (id) => {
    setConfirmModal({
      title: "Delete Broadcast?",
      message:
        "Are you sure you want to delete this broadcast?",
      confirmText: "Delete",
      type: "confirm",

      action: async () => {
        try {
          await completelyDeleteBroadcast(id);

          setBroadcasts((prev) =>
            prev.filter(
              (broadcast) => broadcast.id !== id
            )
          );

          setConfirmModal(null);
        } catch (error) {
          console.error(error);

          setConfirmModal({
            title: "Delete Failed",
            message:
              error.message ||
              "Unable to delete broadcast.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  };

  // --------------------------------------------------
  // COMPLETE PROJECT
  // --------------------------------------------------

  async function completeProject(broadcast) {
    setConfirmModal({
      title: "Complete Project?",
      message:
        "This will mark the project as complete and close it.",
      confirmText: "Complete",
      type: "confirm",

      action: async () => {
        try {
          await updateDoc(
            require("firebase/firestore").doc(
              db,
              "broadcasts",
              broadcast.id
            ),
            {
              status: "completed",
              completedAt: serverTimestamp(),
            }
          );

          // Remove alerts because project is no longer active.
          const alertsQuery = query(
            collection(db, "alerts"),
            where(
              "broadcastId",
              "==",
              broadcast.id
            )
          );

          const alertsSnapshot =
            await getDocs(alertsQuery);

          for (const alertDoc of alertsSnapshot.docs) {
            await deleteDoc(alertDoc.ref);
          }

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
          console.error(error);

          setConfirmModal({
            title: "Completion Failed",
            message:
              "Unable to complete project. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="loadingText">
        Loading broadcasts...
      </div>
    );
  }

  const activeBroadcasts = broadcasts.filter(
    (broadcast) => broadcast.status === "active"
  );

  const progressBroadcasts = broadcasts.filter(
    (broadcast) =>
      broadcast.status === "in_progress"
  );

  const completedBroadcasts = broadcasts.filter(
    (broadcast) =>
      broadcast.status === "completed"
  );

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
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>

        <button
          className={`tabButton ${
            activeTab === "progress"
              ? "activeTab"
              : ""
          }`}
          onClick={() => setActiveTab("progress")}
        >
          In Progress
        </button>

        <button
          className={`tabButton ${
            activeTab === "completed"
              ? "activeTab"
              : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>

      </div>

      <div className="broadcastContent">

        {/* ACTIVE */}

        {activeTab === "active" && (
          <div>

            {activeBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>{broadcast.title}</h3>

                  <p className="broadcastGroup">
                    {broadcast.targetSkills?.[0]}
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
                          src={broadcast.media.url}
                          alt={broadcast.media.name}
                          className="broadcastImage"
                          onClick={() =>
                            setSelectedImage(
                              broadcast.media.url
                            )
                          }
                        />
                      )}

                      {broadcast.media.type?.startsWith(
                        "video"
                      ) && (
                        <video
                          src={broadcast.media.url}
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
                            href={broadcast.media.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Attachment:{" "}
                            {broadcast.media.name}
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
                        handleDelete(broadcast.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              )
            )}

            {activeBroadcasts.length === 0 && (
              <div className="emptyState">
                <h2>No Active Broadcasts</h2>
                <p>
                  Your active broadcasts will
                  appear here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* IN PROGRESS */}

        {activeTab === "progress" && (
          <div>

            {progressBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>{broadcast.title}</h3>

                  <p className="broadcastGroup">
                    {broadcast.targetSkills?.[0]}
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
                      View Interested Candidates
                    </button>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        completeProject(broadcast)
                      }
                    >
                      Complete Project
                    </button>

                  </div>

                </div>
              )
            )}

            {progressBroadcasts.length === 0 && (
              <div className="emptyState">
                <h2>
                  No Broadcasts In Progress
                </h2>
                <p>
                  Broadcasts being worked on
                  will appear here.
                </p>
              </div>
            )}

          </div>
        )}

        {/* COMPLETED */}

        {activeTab === "completed" && (
          <div>

            {completedBroadcasts.map(
              (broadcast) => (
                <div
                  key={broadcast.id}
                  className="broadcastCard"
                >

                  <h3>{broadcast.title}</h3>

                  <p className="broadcastGroup">
                    {broadcast.targetSkills?.[0]}
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

            {completedBroadcasts.length === 0 && (
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

        {/* CREATE */}

        <div
          className="createBroadcastCard"
          onClick={() =>
            navigate("/broadcast")
          }
        >
          <div className="plusIcon">+</div>
          <h3>
            Create a New Broadcast
          </h3>
        </div>

        {/* IMAGE VIEWER */}

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

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={
            confirmModal.type || "confirm"
          }
          onConfirm={confirmModal.action}
          onClose={() =>
            setConfirmModal(null)
          }
        />
      )}

    </div>
  );
}