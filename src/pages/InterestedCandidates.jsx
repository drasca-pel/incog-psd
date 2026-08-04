import React, {
  useEffect,
  useState,
} from "react";

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

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "../styles/InterestedCandidates.css";

export default function InterestedCandidates() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [broadcast, setBroadcast] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [confirmModal, setConfirmModal] =
    useState(null);

  const [existingChats, setExistingChats] =
    useState({});

  useEffect(() => {
    initializePage();
  }, [id]);

  async function initializePage() {
    await loadBroadcast();
    await loadChats();

    setLoading(false);
  }

  async function loadBroadcast() {
    try {
      const snapshot =
        await getDoc(
          doc(
            db,
            "broadcasts",
            id
          )
        );

      if (snapshot.exists()) {
        setBroadcast({
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    } catch (error) {
      console.error(
        "Load broadcast error:",
        error
      );
    }
  }

  async function loadChats() {
    try {
      const chatsQuery =
        query(
          collection(db, "chats"),
          where(
            "projectId",
            "==",
            id
          )
        );

      const snapshot =
        await getDocs(
          chatsQuery
        );

      const chatMap = {};

      snapshot.forEach(
        (chatDoc) => {
          const data =
            chatDoc.data();

          if (data.helperId) {
            chatMap[
              data.helperId
            ] = chatDoc.id;
          }
        }
      );

      setExistingChats(
        chatMap
      );
    } catch (error) {
      console.error(
        "Load chats error:",
        error
      );
    }
  }

  if (loading) {
    return (
      <h2>Loading...</h2>
    );
  }

  if (!broadcast) {
    return (
      <div className="interestedPage">

        <button
          className="backButton"
          onClick={() =>
            navigate(-1)
          }
        >
          ←
        </button>

        <h1>
          Broadcast Not Found
        </h1>

      </div>
    );
  }

  // =====================================================
  // CREATE CHAT
  // =====================================================

  async function createChat(person) {
    try {
      if (
        existingChats[
          person.uid
        ]
      ) {
        navigate(
          `/chat/${existingChats[person.uid]}`
        );

        return;
      }

      // =================================================
      // FIND OR CREATE WORKSPACE
      // =================================================

      let workspaceId = null;

      const workspaceQuery =
        query(
          collection(
            db,
            "workspaces"
          ),
          where(
            "broadcastId",
            "==",
            broadcast.id
          )
        );

      const workspaceSnapshot =
        await getDocs(
          workspaceQuery
        );

      if (
        workspaceSnapshot.empty
      ) {
        const workspaceRef =
          await addDoc(
            collection(
              db,
              "workspaces"
            ),
            {
              broadcastId:
                broadcast.id,

              title:
                broadcast.title,

              creatorId:
                auth.currentUser.uid,

              creatorName:
                auth.currentUser
                  .displayName ||
                broadcast.creatorName ||
                "INCOG User",

              participants: [
                {
                  uid: person.uid,
                  name:
                    person.name,
                  photoURL:
                    person.photoURL ||
                    "",
                },
              ],

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );

        workspaceId =
          workspaceRef.id;
      } else {
        const workspaceDoc =
          workspaceSnapshot
            .docs[0];

        workspaceId =
          workspaceDoc.id;

        await updateDoc(
          doc(
            db,
            "workspaces",
            workspaceId
          ),
          {
            participants:
              arrayUnion({
                uid: person.uid,
                name:
                  person.name,
                photoURL:
                  person.photoURL ||
                  "",
              }),

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      // =================================================
      // CREATE CHAT
      // =================================================

      const chatRef =
        await addDoc(
          collection(
            db,
            "chats"
          ),
          {
            projectId:
              broadcast.id,

            workspaceId:
              workspaceId,

            projectTitle:
              broadcast.title,

            projectSkill:
              broadcast
                .targetSkills?.[0] ||
              "",

            ownerId:
              broadcast.creatorId,

            ownerName:
              broadcast.creatorName,

            helperId:
              person.uid,

            helperName:
              person.name,

            members: [
              broadcast.creatorId,
              person.uid,
            ],

            status: "active",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            lastMessage: "",

            lastMessageAt:
              serverTimestamp(),

            unreadCount: {
              [broadcast.creatorId]: 0,
              [person.uid]: 0,
            },
          }
        );

      setExistingChats(
        (previous) => ({
          ...previous,

          [person.uid]:
            chatRef.id,
        })
      );

      // =================================================
      // REMOVE THIS PERSON'S ALERT
      //
      // They have now been accepted.
      // Their alert should disappear.
      // =================================================

      const alertQuery =
        query(
          collection(
            db,
            "alerts"
          ),
          where(
            "broadcastId",
            "==",
            broadcast.id
          ),
          where(
            "receiverId",
            "==",
            person.uid
          )
        );

      const alertSnapshot =
        await getDocs(
          alertQuery
        );

      for (
        const alertDoc
        of alertSnapshot.docs
      ) {
        await deleteDoc(
          alertDoc.ref
        );
      }

      navigate(
        `/chat/${chatRef.id}`
      );
    } catch (error) {
      console.error(
        "Chat creation error:",
        error
      );

      setConfirmModal({
        title:
          "Chat Creation Failed",

        message:
          error.message ||
          "Unable to create chat. Please try again.",

        confirmText:
          "OK",

        type:
          "info",

        action:
          () =>
            setConfirmModal(
              null
            ),
      });
    }
  }

  // =====================================================
  // REMOVE CANDIDATE
  // =====================================================

  function removeCandidate(
    person
  ) {
    setConfirmModal({
      title:
        "Remove Candidate?",

      message:
        `Remove ${person.name} from this project?`,

      confirmText:
        "Remove",

      type:
        "confirm",

      action:
        async () => {
          try {
            await updateDoc(
              doc(
                db,
                "broadcasts",
                broadcast.id
              ),
              {
                interestedCandidates:
                  arrayRemove(
                    person
                  ),
              }
            );

            // Remove their alert
            const alertQuery =
              query(
                collection(
                  db,
                  "alerts"
                ),
                where(
                  "broadcastId",
                  "==",
                  broadcast.id
                ),
                where(
                  "receiverId",
                  "==",
                  person.uid
                )
              );

            const alertSnapshot =
              await getDocs(
                alertQuery
              );

            for (
              const alertDoc
              of alertSnapshot.docs
            ) {
              await deleteDoc(
                alertDoc.ref
              );
            }

            // Remove existing chat for
            // this candidate ONLY when
            // broadcaster explicitly removes
            // that candidate.
            const chatQuery =
              query(
                collection(
                  db,
                  "chats"
                ),
                where(
                  "projectId",
                  "==",
                  broadcast.id
                ),
                where(
                  "helperId",
                  "==",
                  person.uid
                )
              );

            const chatSnapshot =
              await getDocs(
                chatQuery
              );

            for (
              const chatDoc
              of chatSnapshot.docs
            ) {
              await deleteDoc(
                chatDoc.ref
              );
            }

            setBroadcast(
              (previous) => ({
                ...previous,

                interestedCandidates:
                  (
                    previous.interestedCandidates ||
                    []
                  ).filter(
                    (candidate) =>
                      candidate.uid !==
                      person.uid
                  ),
              })
            );

            setExistingChats(
              (previous) => {
                const updated =
                  {
                    ...previous,
                  };

                delete updated[
                  person.uid
                ];

                return updated;
              }
            );

            setConfirmModal(
              null
            );
          } catch (error) {
            console.error(
              "Remove candidate error:",
              error
            );

            setConfirmModal({
              title:
                "Removal Failed",

              message:
                "Unable to remove candidate. Please try again.",

              confirmText:
                "OK",

              type:
                "info",

              action:
                () =>
                  setConfirmModal(
                    null
                  ),
            });
          }
        },
    });
  }

  return (
    <div className="interestedPage">

      <button
        className="backButton"
        onClick={() =>
          navigate(-1)
        }
      >
        ←
      </button>

      <h1>
        Interested Candidates
      </h1>

      {!broadcast.interestedCandidates ||
      broadcast
        .interestedCandidates
        .length === 0 ? (

        <p>
          No one has shown
          interest yet.
        </p>

      ) : (

        broadcast
          .interestedCandidates
          .map((person) => (

            <div
              key={person.uid}
              className="candidateCard"
            >

              <h3>
                {person.name}
              </h3>

              {existingChats[
                person.uid
              ] ? (

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
                  onClick={() =>
                    createChat(
                      person
                    )
                  }
                >
                  Create Chat
                </button>

              )}

              <button
                onClick={() =>
                  removeCandidate(
                    person
                  )
                }
              >
                Remove
              </button>

            </div>

          ))
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={
            confirmModal.title
          }
          message={
            confirmModal.message
          }
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
            setConfirmModal(
              null
            )
          }
        />
      )}

    </div>
  );
}