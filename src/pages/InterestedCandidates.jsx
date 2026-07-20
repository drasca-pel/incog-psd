import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/InterestedCandidates.css";

export default function InterestedCandidates() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroadcast();
  }, []);

  async function loadBroadcast() {
    try {
      const snap = await getDoc(doc(db, "broadcasts", id));

      if (snap.exists()) {
        setBroadcast({
          id: snap.id,
          ...snap.data(),
        });
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  if (loading) return <h2>Loading...</h2>;

  async function openChat(person) {
  try {
    const q = query(
      collection(db, "chats"),
      where("broadcastid", "==", broadcast.id),
      where("helperid", "==", person.uid)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      navigate(`/chat/${snapshot.docs[0].id}`);
      return;
    }

    const chatRef = await addDoc(collection(db, "chats"), {
      broadcastid: broadcast.id,
      creatorid: broadcast.creatorId,
      helperid: person.uid,
      creatorname: broadcast.creatorName,
      helpername: person.name,
      title: broadcast.title,
      status: "active",
      createdat: serverTimestamp(),
    });

    navigate(`/chat/${chatRef.id}`);

  } catch (error) {
    console.error(error);
    alert("Unable to open chat.");
  }
}
    async function removeCandidate(person) {
  const confirmRemove = window.confirm(
    `Remove ${person.name} from interested candidates?`
  );

  if (!confirmRemove) return;

  try {
    await updateDoc(doc(db, "broadcasts", broadcast.id), {
      interestedCandidates: arrayRemove(person),
    });

    setBroadcast((prev) => ({
      ...prev,
      interestedCandidates: prev.interestedCandidates.filter(
        (candidate) => candidate.uid !== person.uid
      ),
    }));

  } catch (error) {
    console.error(error);
    alert("Unable to remove candidate.");
  }
}

  return (
    <div className="interestedPage">
        <button
  className="backButton"
  onClick={() => navigate(-1)}
>
  ←
</button>

      <h1>Interested Candidates</h1>

      {!broadcast?.interestedCandidates ||
      broadcast.interestedCandidates.length === 0 ? (

        <p>No one has shown interest yet.</p>

      ) : (

        broadcast.interestedCandidates.map((person) => (

          <div
            key={person.uid}
            className="candidateCard"
          >
            <h3>{person.name}</h3>

           <button onClick={() => openChat(person)}>
  Open Chat
</button>
            <button onClick={() => removeCandidate(person)}>
  Remove
</button>

          </div>

        ))

      )}

    </div>
  );
}