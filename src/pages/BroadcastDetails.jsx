import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { createNotification } from "../utils/notificationsService";

import "../styles/BroadcastDetails.css";

export default function BroadcastDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [alreadyInterested, setAlreadyInterested] = useState(false);
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    loadBroadcast();
  }, []);

  async function loadBroadcast() {
    try {
      const snap = await getDoc(doc(db, "broadcasts", id));

      if (snap.exists()) {
        const data = snap.data();

        setBroadcast({ id: snap.id, ...data });

        const interested = data.interestedCandidates || [];
        const exists = interested.some(
          (person) => person.uid === auth.currentUser.uid
        );

        setAlreadyInterested(exists);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  function showInfo(title, message) {
    setConfirmModal({
      title,
      message,
      confirmText: "OK",
      type: "info",
      action: () => setConfirmModal(null),
    });
  }

  function acceptProject() {
    setConfirmModal({
      title: "Express Interest?",
      message: "Do you want to express interest in this project?",
      confirmText: "Yes, Accept",
      type: "confirm",
      action: async () => {
        try {
          setConfirmModal(null);

          await updateDoc(doc(db, "broadcasts", broadcast.id), {
            status: "in_progress",
            interestedCandidates: arrayUnion({
              uid: auth.currentUser.uid,
              name: auth.currentUser.displayName || "INCOG User",
              acceptedAt: Date.now(),
              chatStarted: false,
            }),
          });

          await createNotification({
            recipientId: broadcast.creatorId,
            type: "broadcast_accepted",
            title: "New Interest in Your Broadcast",
            message: `${auth.currentUser.displayName || "Someone"} is interested in "${broadcast.title}"`,
            link: `/interested-candidates/${broadcast.id}`,
          });

          setAlreadyInterested(true);

          showInfo(
            "Interest Submitted",
            "Your interest was submitted successfully. Wait for the broadcast owner to start a chat."
          );
        } catch (error) {
          console.error(error);
          showInfo("Something Went Wrong", "Unable to submit interest. Please try again.");
        }
      },
    });
  }

  if (loading) {
    return <div className="detailsPage">Loading...</div>;
  }

  if (!broadcast) {
    return <div className="detailsPage">Broadcast not found.</div>;
  }

  return (
    <div className="detailsPage">

      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>{broadcast.title}</h1>

      <div className="detailsMeta">
        <span>{broadcast.creatorName}</span>
        <span>{broadcast.targetSkills?.[0]}</span>
      </div>

      <p className="detailsDescription">{broadcast.description}</p>

      {broadcast.media && (
        <>
          {broadcast.media.type?.startsWith("image") && (
            <img
              src={broadcast.media.url}
              alt="Broadcast"
              className="detailsMedia"
              onClick={() => setSelectedImage(broadcast.media.url)}
            />
          )}

          {broadcast.media.type?.startsWith("video") && (
            <video controls className="detailsMedia">
              <source src={broadcast.media.url} />
            </video>
          )}
        </>
      )}

      <div className="detailsButtons">
        <button
          className="acceptBtn"
          onClick={acceptProject}
          disabled={alreadyInterested}
        >
          {alreadyInterested ? "Already Interested" : "Accept"}
        </button>

        <button className="rejectBtn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {selectedImage && (
        <div className="imageViewer">
          <button className="imageBackButton" onClick={() => setSelectedImage(null)}>
            ←
          </button>
          <img src={selectedImage} alt="Full View" className="imageViewerImg" />
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type || "confirm"}
          onConfirm={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}

    </div>
  );
}