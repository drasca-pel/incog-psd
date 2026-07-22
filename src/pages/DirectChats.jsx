import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function DirectChats() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  if (!auth.currentUser) return;

  const q = query(
    collection(db, "chats"),
    where(
      "members",
      "array-contains",
      auth.currentUser.uid
    )
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChats(data);
      setLoading(false);

    },

    (error) => {

      console.error(
        "Chat list error:",
        error
      );

      setLoading(false);

    }

  );

  return () => unsubscribe();

}, []);

  if (loading) {
    return <p>Loading chats...</p>;
  }

  if (chats.length === 0) {
    return (
      <div className="emptyState">
        <h2>No Chats Yet</h2>
        <p>
          Chats you create or receive will appear here.
        </p>
      </div>
    );
  }

  return (
  <div>

    {loading ? (
      <p>Loading chats...</p>
    ) : chats.length === 0 ? (
      <p>No chats yet.</p>
    ) : (
      chats.map((chat) => (
        <div
          key={chat.id}
          className="chatCard"
          onClick={() => navigate(`/chat/${chat.id}`)}
        >
          <h3>{chat.projectTitle}</h3>

          <small>{chat.projectSkill}</small>

          <p>
            {auth.currentUser.uid === chat.ownerId
              ? chat.helperName
              : chat.ownerName}
          </p>

          <span>
            {chat.lastMessage || "Tap to start chatting"}
          </span>

        </div>
      ))
    )}

  </div>
);
}