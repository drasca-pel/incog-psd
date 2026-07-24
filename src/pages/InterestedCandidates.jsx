import React, { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
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
  const [confirmModal, setConfirmModal] = useState(null);

  // helperId -> chatId
  const [existingChats, setExistingChats] = useState({});

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    await loadBroadcast();
    await loadChats();
    setLoading(false);
  }

  async function loadBroadcast() {

    try {

      const snap = await getDoc(
        doc(db, "broadcasts", id)
      );

      if (snap.exists()) {

        setBroadcast({
          id: snap.id,
          ...snap.data(),
        });

      }

    } catch (error) {
      console.error(error);
    }

  } 

  async function loadChats() {

    try {

      const q = query(
        collection(db, "chats"),
        where("projectId", "==", id)
      );

      const snap = await getDocs(q);

      const chatMap = {};

      snap.forEach((chat) => {

        const data = chat.data();

        chatMap[data.helperId] = chat.id;

      });

      setExistingChats(chatMap);

    } catch (error) {
      console.error(error);
    }

  }

  if (loading) {
    return <h2>Loading...</h2>;
  } 

  async function createChat(person) {

    try {

      // Chat already exists
      if (existingChats[person.uid]) {

        navigate(`/chat/${existingChats[person.uid]}`);
        return;

      }

      // Create new chat

      const chatRef = await addDoc(
        collection(db, "chats"),
        {

          projectId: broadcast.id,
          projectTitle: broadcast.title,
          projectSkill:
            broadcast.targetSkills?.[0] || "",

          ownerId: broadcast.creatorId,
          ownerName: broadcast.creatorName,

          helperId: person.uid,
          helperName: person.name,

          members: [
            broadcast.creatorId,
            person.uid,
          ],

          status: "active",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),

          lastMessage: "",
          lastMessageAt: serverTimestamp(),

        }
      );

      // Save locally

      setExistingChats((prev) => ({
        ...prev,
        [person.uid]: chatRef.id,
      }));

      navigate(`/chat/${chatRef.id}`);

    } catch (error) {

      console.error(error);
      alert("Unable to create chat.");

    }

  } 

  async function removeCandidate(person) {

 setConfirmModal({
  title: "Remove Candidate?",
  message: `Remove ${person.name} from this project?`,
  confirmText: "Remove",

  action: async () => {

    try {

      await updateDoc(
        doc(db, "broadcasts", broadcast.id),
        {
          interestedCandidates: arrayRemove(person),
        }
      );

      const alertQuery = query(
        collection(db, "alerts"),
        where("broadcastId", "==", broadcast.id),
        where("receiverId", "==", person.uid)
      );

      const alertSnap = await getDocs(alertQuery);

      for (const alert of alertSnap.docs) {
        await deleteDoc(doc(db, "alerts", alert.id));
      }

      const chatQuery = query(
        collection(db, "chats"),
        where("projectId", "==", broadcast.id),
        where("helperId", "==", person.uid)
      );

      const chatSnap = await getDocs(chatQuery);

      for (const chat of chatSnap.docs) {
        await deleteDoc(doc(db, "chats", chat.id));
      }

      setBroadcast((prev) => ({
        ...prev,
        interestedCandidates:
          prev.interestedCandidates.filter(
            (candidate) => candidate.uid !== person.uid
          ),
      }));

      setExistingChats((prev) => {
        const updated = { ...prev };
        delete updated[person.uid];
        return updated;
      });

      setConfirmModal(null);

    } catch (error) {
      console.error(error);
      alert("Unable to remove candidate.");
    }

  },
});

return;

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


            {existingChats[person.uid] ? (

              <button
                onClick={() =>
                  navigate(
                    `/chat/${existingChats[person.uid]}`
                  )
                }
              >
                View Chat
              </button>

            ) : (

              <button
                onClick={() => createChat(person)}
              >
                Create Chat
              </button>

            )}



            <button
              onClick={() =>
                removeCandidate(person)
              }
            >
              Remove
            </button>


          </div>

        ))

      )}
       {confirmModal && (
  <ConfirmModal
    title={confirmModal.title}
    message={confirmModal.message}
    confirmText={confirmModal.confirmText}
    onConfirm={confirmModal.action}
    onCancel={() => setConfirmModal(null)}
  />
)}
    </div>
  );
}