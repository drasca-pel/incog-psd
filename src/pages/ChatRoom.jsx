import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import "../styles/ChatRoom.css";

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    loadChat();
    const unsubscribe = listenForMessages();
    return () => unsubscribe();
  }, []);

  async function loadChat() {
    try {
      const snap = await getDoc(doc(db, "chats", id));

      if (snap.exists()) {
        setChat({
          id: snap.id,
          ...snap.data(),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  function listenForMessages() {
    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
  }
async function sendMessage() {
    if (!text.trim()) return;

    try {
      await addDoc(
        collection(db, "chats", id, "messages"),
        {
          senderId: auth.currentUser.uid,
          senderName:
            auth.currentUser.displayName || "INCOG User",

          text: text,

          createdAt: serverTimestamp(),
        }
      );

      await updateDoc(doc(db, "chats", id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });

      setText("");
    } catch (error) {
      console.error(error);
      alert("Unable to send message.");
    }
  }

  if (!chat) {
    return (
      <div className="chatRoomPage">
        Loading...
      </div>
    );
  }

  return (
    <div className="chatRoomPage">

      <div className="chatHeader">

        <button
          className="backButton"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h2>{chat.title}</h2>

      </div>

      <div className="messagesContainer">

        {messages.map((message) => (

          <div
            key={message.id}
            className={
              message.senderId === auth.currentUser.uid
                ? "myMessage"
                : "otherMessage"
            }
          >

            <p>{message.text}</p>

          </div>

        ))}

      </div>

      <div className="chatInputArea">

        <input
          className="chatInput"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          className="sendButton"
          onClick={sendMessage}
        >
          Send
        </button>

      </div>

    </div>
  );
}