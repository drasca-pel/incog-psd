import react, { useEffect, useState } from "react";
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
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/InterestedCandidates.css";

export default function InterestedCandidates() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [broadcast, setbroadcast] = useState(null);
  const [loading, setloading] = useState(true);
  const [confirmmodal, setconfirmmodal] = useState(null);

  const [existingchats, setexistingchats] = useState({});

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    await loadBroadcast();
    await loadChats();
    setloading(false);
  }

  async function loadBroadcast() {
    try {
      const snap = await getDoc(
        doc(db, "broadcasts", id)
      );

      if (snap.exists()) {
        setbroadcast({
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

      setexistingchats(chatMap);
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return <h2>Loading...</h2>;
  } 

  async function createChat(person) {
    try {
      if (existingchats[person.uid]) {
        navigate(`/chat/${existingchats[person.uid]}`);
        return;
      }

      let workspaceId = null;

      const workspaceQuery = query(
        collection(db, "workspaces"),
        where("broadcastId", "==", broadcast.id)
      );

      const workspaceSnapshot = await getDocs(workspaceQuery);

      if (workspaceSnapshot.empty) {
        const workspaceRef = await addDoc(
          collection(db, "workspaces"),
          {
            broadcastId: broadcast.id,
            title: broadcast.title,
            creatorId: auth.currentUser.uid,
            creatorName: auth.currentUser.displayName,
            participants: [
              {
                uid: person.uid,
                name: person.name,
                photoURL: person.photoURL || "",
              },
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        workspaceId = workspaceRef.id;
      } else {
        const workspace = workspaceSnapshot.docs[0];
        workspaceId = workspace.id;

        await updateDoc(
          doc(db, "workspaces", workspaceId),
          {
            participants: arrayUnion({
              uid: person.uid,
              name: person.name,
              photoURL: person.photoURL || "",
            }),
            updatedAt: serverTimestamp(),
          }
        );
      }

      const chatRef = await addDoc(
        collection(db, "chats"),
        {
          projectId: broadcast.id,
          workspaceId: workspaceId,
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

      setexistingchats((prev) => ({
        ...prev,
        [person.uid]: chatRef.id,
      }));

      navigate(`/chat/${chatRef.id}`);
    } catch (error) {
      console.error(error);
      setconfirmmodal({
        title: "Chat Creation Failed",
        message: "Unable to create chat. Please try again.",
        confirmText: "OK",
        type: "info",
        action: () => setconfirmmodal(null),
      });
    }
  } 

  async function removeCandidate(person) {
    setconfirmmodal({
      title: "Remove Candidate?",
      message: `Remove ${person.name} from this project?`,
      confirmText: "Remove",
      type: "confirm",

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

          setbroadcast((prev) => ({
            ...prev,
            interestedCandidates:
              prev.interestedCandidates.filter(
                (candidate) => candidate.uid !== person.uid
              ),
          }));

          setexistingchats((prev) => {
            const updated = { ...prev };
            delete updated[person.uid];
            return updated;
          });

          setconfirmmodal(null);
        } catch (error) {
          console.error(error);
          setconfirmmodal({
            title: "Removal Failed",
            message: "Unable to remove candidate. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setconfirmmodal(null),
          });
        }
      },
    });
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

            {existingchats[person.uid] ? (

              <button
                onClick={() =>
                  navigate(
                    `/chat/${existingchats[person.uid]}`
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

      {confirmmodal && (
        <ConfirmModal
          isOpen={!!confirmmodal}
          title={confirmmodal.title}
          message={confirmmodal.message}
          confirmText={confirmmodal.confirmText}
          type={confirmmodal.type || "confirm"}
          onConfirm={confirmmodal.action}
          onClose={() => setconfirmmodal(null)}
        />
      )}

    </div>
  );
}