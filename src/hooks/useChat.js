import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { uploadToCloudinary } from "../services/cloudinary";

export default function useChat(chatId) {

  const [chat, setChat] = useState(null);

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");

  const [typingUsers, setTypingUsers] =
    useState({});

  const [replyingTo, setReplyingTo] =
    useState(null);

  const [editingMessage, setEditingMessage] =
    useState(null);
    
  const [editingText, setEditingText] =
  useState("");

  const [onlineStatus, setOnlineStatus] =
    useState({});

  const typingTimeout = useRef(null);

  const typingState = useRef(false);

  useEffect(() => {

    if (!chatId) return;

    initializeChat();

    return () => {

      clearTimeout(
        typingTimeout.current
      );

      goOffline();

    };

  }, [chatId]);

  async function initializeChat() {

    await loadChat();

    listenMessages();

    listenTyping();

    listenOnlineUsers();

    await goOnline();

  }

  async function loadChat() {

    try {

      const snap = await getDoc(
        doc(db, "chats", chatId)
      );

      if (snap.exists()) {

        setChat({

          id: snap.id,

          ...snap.data(),

        });

      }

      setLoading(false);

    } catch (error) {

      console.error(error);

      setLoading(false);

    }

  }

  function listenMessages() {

    const q = query(

      collection(
        db,
        "chats",
        chatId,
        "messages"
      ),

      orderBy(
        "createdAt",
        "asc"
      )

    );

    return onSnapshot(
      q,
      (snapshot) => {

        const list = snapshot.docs.map(
          (item) => ({

            id: item.id,

            ...item.data(),

          })
        );

        setMessages(list);

      }
    );

  }

  function listenTyping() {

    return onSnapshot(

      doc(
        db,
        "chats",
        chatId
      ),

      (snapshot) => {

        if (!snapshot.exists()) return;

        setTypingUsers(
          snapshot.data().typingUsers || {}
        );

      }

    );

  }

  function listenOnlineUsers() {

    return onSnapshot(

      collection(
        db,
        "onlineUsers"
      ),

      (snapshot) => {

        const users = {};

        snapshot.forEach((docItem) => {

          users[docItem.id] =
            docItem.data();

        });

        setOnlineStatus(users);

      }

    );

  }

  async function goOnline() {

    if (!auth.currentUser) return;

    await setDoc(

      doc(
        db,
        "onlineUsers",
        auth.currentUser.uid
      ),

      {

        online: true,

        lastSeen:
          serverTimestamp(),

      },

      {

        merge: true,

      }

    );

  }

  async function goOffline() {

    if (!auth.currentUser) return;

    await updateDoc(

      doc(
        db,
        "onlineUsers",
        auth.currentUser.uid
      ),

      {

        online: false,

        lastSeen:
          serverTimestamp(),

      }

    );

  }

  async function updateTyping(value) {

    if (!auth.currentUser) return;

    if (value) {

      if (!typingState.current) {

        typingState.current = true;

        await updateDoc(
          doc(db, "chats", chatId),
          {
            [`typingUsers.${auth.currentUser.uid}`]: true,
          }
        );

      }

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(
        async () => {

          typingState.current = false;

          await updateDoc(
            doc(db, "chats", chatId),
            {
              [`typingUsers.${auth.currentUser.uid}`]: false,
            }
          );

        },
        1500
      );

    } else {

      clearTimeout(typingTimeout.current);

      typingState.current = false;

      await updateDoc(
        doc(db, "chats", chatId),
        {
          [`typingUsers.${auth.currentUser.uid}`]: false,
        }
      );

    }

  }

  async function deleteMessage(message) {

    if (!message) return;

    if (
      message.senderId !== auth.currentUser.uid
    ) {
      return;
    }

    await deleteDoc(
      doc(
        db,
        "chats",
        chatId,
        "messages",
        message.id
      )
    );

  } 

  async function permanentlyDeleteMessage(messageId) {

    await deleteDoc(
      doc(
        db,
        "chats",
        chatId,
        "messages",
        messageId
      )
    );

  }

  async function hideMessageForMe(messageId) {

    if (!auth.currentUser) return;

    await updateDoc(

      doc(
        db,
        "chats",
        chatId,
        "messages",
        messageId
      ),

      {

        hiddenFor: arrayUnion(
          auth.currentUser.uid
        )

      }

    );

  }

  async function sendMessage() {

    if (!text.trim()) return;

    const message = {

      senderId: auth.currentUser.uid,

      senderName:
        auth.currentUser.displayName ||
        "INCOG User",

      text,

      type: "text",
                    
      replyTo: replyingTo
        ? replyingTo.id
        : null,

      replyName: replyingTo
        ? replyingTo.senderName
        : null,

      replyText: replyingTo
        ? replyingTo.text ||
          replyingTo.fileName ||
          replyingTo.type
        : null,

      edited: false,

      deleted: false,

      createdAt: serverTimestamp(),

      readBy: [auth.currentUser.uid],

    };

    await addDoc(
      collection(
        db,
        "chats",
        chatId,
        "messages"
      ),
      message
    );

    await updateDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      }
    );

    setText("");

    setReplyingTo(null);

    await updateTyping(false);

  }

  async function sendMediaMessage(file) {
    if (!file) return;

    try {

      const upload = await uploadToCloudinary(file);

      const message = {

        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || "INCOG User",

        text: "",

        mediaURL: upload.url,

        mediaType: upload.resourceType === "image"
          ? "image"
          : upload.resourceType === "video"
          ? "video"
          : "file",

        fileName: upload.name,

        publicId: upload.publicId,

        type: "media",

        replyTo: replyingTo ? replyingTo.id : null,
        replyName: replyingTo ? replyingTo.senderName : null,
        replyText: replyingTo
          ? replyingTo.text ||
            replyingTo.fileName ||
            replyingTo.type
          : null,

        edited: false,
        deleted: false,

        createdAt: serverTimestamp(),

        readBy: [auth.currentUser.uid],

      };

      await addDoc(
        collection(db, "chats", chatId, "messages"),
        message
      );

      await updateDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: "[Media]",
          lastMessageAt: serverTimestamp(),
        }
      );

      setReplyingTo(null);

    } catch (err) {

      console.error(err);

    }

  }

  async function sendVoiceMessage(audioBlob) {

    if (!audioBlob) return;

    try {

      const file = new File(
        [audioBlob],
        `voice-${Date.now()}.webm`,
        {
          type: "audio/webm",
        }
      );

      const upload =
        await uploadToCloudinary(file);

      const message = {

        senderId: auth.currentUser.uid,
        senderName:
          auth.currentUser.displayName ||
          "INCOG User",

        text: "",

        mediaURL: upload.url,

        mediaType: "audio",

        fileName: "Voice Note",

        publicId: upload.publicId,

        type: "voice",

        replyTo: replyingTo
          ? replyingTo.id
          : null,

        replyName: replyingTo
          ? replyingTo.senderName
          : null,

        replyText: replyingTo
          ? replyingTo.text ||
            replyingTo.fileName ||
            replyingTo.type
          : null,

        edited: false,
        deleted: false,

        createdAt: serverTimestamp(),

        readBy: [auth.currentUser.uid],

      };

      await addDoc(
        collection(db, "chats", chatId, "messages"),
        message
      );

      await updateDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: "[Voice Note]",
          lastMessageAt: serverTimestamp(),
        }
      );

      setReplyingTo(null);

    } catch (err) {

      console.error(err);

    }

  }

  async function updateMessage() {

    if (!editingMessage) return;

    if (!editingText.trim()) return;

    await updateDoc(

      doc(
        db,
        "chats",
        chatId,
        "messages",
        editingMessage.id
      ),

      {

        text: editingText,

        edited: true,

        editedAt: serverTimestamp(),

      }

    );

    setEditingMessage(null);

    setEditingText("");

    setText("");

  }

  async function markMessageRead(messageId) {

    await updateDoc(

      doc(
        db,
        "chats",
        chatId,
        "messages",
        messageId
      ),

      {

        readBy: arrayUnion(
          auth.currentUser.uid
        ),

      }

    );

  }

  return {

    chat,

    messages,

    loading,

    text,

    setText,

    sendMessage,

    sendMediaMessage,

    sendVoiceMessage,

    updateMessage,

    updateTyping,

    typingUsers,

    onlineStatus,

    replyingTo,

    setReplyingTo,

    editingMessage,

    setEditingMessage,

    editingText,

    setEditingText,

    deleteMessage,

    hideMessageForMe,

    markMessageRead,

    permanentlyDeleteMessage,

  };

}