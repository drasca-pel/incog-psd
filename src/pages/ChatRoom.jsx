import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import "../styles/ChatRoom.css";

export default function ChatRoom() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {

    if (!id) return;

    loadChat();

    const unsubscribe = listenMessages();

    return () => unsubscribe();

  }, [id]);

  async function loadChat() {

    try {

      const snap = await getDoc(
        doc(db, "chats", id)
      );

      if (snap.exists()) {

        setChat({
          id: snap.id,
          ...snap.data()
        });

      }

    } catch(error) {

      console.error(error);

    }

  }

  function listenMessages() {

    const q = query(

      collection(
        db,
        "chats",
        id,
        "messages"
      ),

      orderBy(
        "createdAt",
        "asc"
      )

    );

    return onSnapshot(
      q,
      (snapshot)=>{

        setMessages(

          snapshot.docs.map(
            (doc)=>({
              id:doc.id,
              ...doc.data()
            })
          )

        );

      }

    );

  }

  async function sendMessage(){

    if(!text.trim()) return;

    try{

      await addDoc(

        collection(
          db,
          "chats",
          id,
          "messages"
        ),

        {

          senderId:
          auth.currentUser.uid,

          senderName:
          auth.currentUser.displayName ||
          "INCOG User",

          text:text,

          createdAt:
          serverTimestamp()

        }

      );

      await updateDoc(

        doc(
          db,
          "chats",
          id
        ),

        {

          lastMessage:text,

          lastMessageAt:
          serverTimestamp()

        }

      );

      setText("");

    }catch(error){

      console.error(error);

      alert(
        "Message failed"
      );

    }

  }

  if(!chat){

    return (

      <div className="chatRoomPage">

        Loading chat...

      </div>

    );

  }

  return (

    <div className="chatRoomPage">

      <div className="chatHeader">

        <button

          className="backButton"

          onClick={()=>navigate(-1)}

        >

          ←

        </button>

        <div>

          <h2>
            {chat.projectTitle ||
            chat.title ||
            "Chat"}
          </h2>

          <small>

            {chat.projectSkill || ""}

          </small>

        </div>

      </div>

      <div className="messagesContainer">

        {messages.map((message)=>(

          <div

            key={message.id}

            className={

              message.senderId === auth.currentUser.uid

              ?

              "myMessage"

              :

              "otherMessage"

            }

          >

            <p>

              {message.text}

            </p>

          </div>

        ))}

      </div>

      <div className="chatInputArea">

        <input

          className="chatInput"

          placeholder="Type message..."

          value={text}

          onChange={
            (e)=>setText(e.target.value)
          }

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