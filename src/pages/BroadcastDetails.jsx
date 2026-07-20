import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/BroadcastDetails.css";

export default function BroadcastDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [alreadyInterested, setAlreadyInterested] = useState(false);
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroadcast();
  }, []);

  async function loadBroadcast() {
    try {
      const snap = await getDoc(
        doc(db, "broadcasts", id)
      );

      console.log("Broadcast ID:", id);
      console.log("Exists:", snap.exists());

      if (snap.exists()) {

  const data = snap.data();

  setBroadcast({
    id: snap.id,
    ...data,
  });

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

  async function acceptProject() {
    console.log("Accept button clicked");
  const confirmAccept = window.confirm(
    "Do you want to express interest in this project?"
  );

  if (!confirmAccept) return;

  try {
    const helper = {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName || "INCOG User",
      acceptedAt: Date.now(),
    };
  console.log(helper);
console.log(broadcast.id);
    await updateDoc(doc(db, "broadcasts", broadcast.id), {
      interestedCandidates: arrayUnion(helper),
    });

    alert(
      "Interest submitted successfully.\n\nWait for the broadcast owner to start a chat."
    );

    navigate(-1);
  } catch (error) {
    console.error(error);
    alert("Unable to submit interest.");
  }
}
   
       

  if (loading) {
    return (
      <div className="detailsPage">
        Loading...
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="detailsPage">
        Broadcast not found.
      </div>
    );
  } return (
    <div className="detailsPage">

      <button
        className="backButton"
        onClick={() => navigate(-1)}
      >
        ←
      </button>

      <h1>{broadcast.title}</h1>

      <div className="detailsMeta">
        <span>{broadcast.creatorname}</span>

        <span>
          {broadcast.targetskills?.[0]}
        </span>
      </div>

      <p className="detailsDescription">
        {broadcast.description}
      </p>

      {broadcast.media?.url && (
        <>
          {broadcast.media.type?.startsWith("image") ? (
            <img
              src={broadcast.media.url}
              alt="Broadcast"
              className="detailsMedia"
            />
          ) : broadcast.media.type?.startsWith("video") ? (
            <video
              controls
              className="detailsMedia"
            >
              <source
                src={broadcast.media.url}
              />
              Your browser does not support video.
            </video>
          ) : (
            <div className="attachmentCard">
              <p>Attachment Available</p>

              <a
                href={broadcast.media.url}
                target="_blank"
                rel="noreferrer"
              >
                Open Attachment
              </a>
            </div>
          )}
        </>
      )}

      <div className="detailsButtons">

        <button
          className="acceptBtn"
          onClick={acceptProject}
        >
          Accept
        </button>

        <button
          className="rejectBtn"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

      </div>

    </div>
  );
}