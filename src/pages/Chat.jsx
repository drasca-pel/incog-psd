import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import "../styles/Chat.css";

export default function Chat() {
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

        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setChats(list);
        setLoading(false);

      },
      (error) => {

        console.error(
          "Chat Error:",
          error
        );

        setLoading(false);

      }
    );


    return () => unsubscribe();


  }, []);



  return (

    <div className="chatPage">

      <button
  className="backButton"
  onClick={() => navigate(-1)}
>
  ←
</button> 
      <h1>Chats</h1>
     

      {loading ? (

        <p>Loading chats...</p>

      ) : chats.length === 0 ? (

        <p>No chats yet.</p>

      ) : (

        chats.map(chat => (

          <div
  key={chat.id}
  className="chatCard"
  onClick={() => navigate(`/chat/${chat.id}`)}
>

            <h3>
              {chat.otherUserName || "INCOG User"}
            </h3>

            <p>
              {chat.lastMessage || "No messages yet"}
            </p>

          </div>

        ))

      )}

    </div>

  );

}