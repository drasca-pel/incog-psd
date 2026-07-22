import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../services/cloudinary";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";

import MediaUpload from "../components/MediaUpload";

import "../styles/Broadcast.css";

export default function Broadcast() {
  
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [media, setMedia] = useState(null);

  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    const loadUserSkills = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserSkills(
            userSnap.data().skills || []
          );
        }
      } catch (error) {
        console.error("Error loading user skills:", error);
      }
    };

    loadUserSkills();
  }, []);
    
   

  async function createBroadcast(e) {
    e.preventDefault();

    if (!title || !description || !skill) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "broadcasts"),
        where("creatorId", "==", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const existing = await getDocs(q);

      if (existing.size >= 6) {
        alert(
          "You already have 2 active broadcasts. Complete one before creating another."
        );

        setLoading(false);
        return;
      } let uploadedMedia = null;

if (media) {
  uploadedMedia = await uploadToCloudinary(
    media.file
  );
}
         
     
  const broadcastRef = await addDoc(
  collection(db, "broadcasts"),
  {
    creatorId: auth.currentUser.uid,
    creatorName:
      auth.currentUser.displayName || "INCOG User",

    title,
    description,

    targetSkills: [skill],

    media: uploadedMedia,

    status: "active",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    
accepted: false,
acceptedBy: null,
interestedCandidate: [],

expiresIn: 7,

expiresAt: new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
).getTime(),

editExpiresAt: new Date(
  Date.now() + 60 * 60 * 1000
).getTime(),

lastReminderAt: serverTimestamp(),

    reminderCount: 0,
  }
);

const usersQuery = query(
  collection(db, "users"),
  where("skills", "array-contains", skill)
);

const usersSnapshot = await getDocs(usersQuery);

for (const userDoc of usersSnapshot.docs) {

  if (userDoc.id === auth.currentUser.uid) continue;

  await addDoc(collection(db, "alerts"), {

    receiverId: userDoc.id,

    creatorId: auth.currentUser.uid,

    creatorName:
      auth.currentUser.displayName || "INCOG User",

    broadcastId: broadcastRef.id,

    title: title,

    group: skill,

    status: "unread",

    createdAt: serverTimestamp(),

  });

}
  alert("Broadcast created successfully.");

      setTitle("");
      setDescription("");
      setSkill("");
      setMedia(null);
      navigate("/my-broadcasts");
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="broadcastPage">
      <div className="broadcastContainer">
        <div className="broadcastCard">
          <button
  className="backButton"
  onClick={() => navigate(-1)}
>
  ←
</button>
          <h1>Create Broadcast</h1>

          <p className="broadcastSubtitle">
            Publish an engineering problem and connect with professionals who can help.
          </p>

          <form onSubmit={createBroadcast}>
            <label className="inputLabel">
              Broadcast Title
            </label>

            <input
              className="broadcastInput"
              placeholder="Example: ESP32 Smart Irrigation System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="inputLabel">
              Problem Description
            </label>

            <textarea
              className="broadcastTextarea"
              placeholder="Explain the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="inputLabel">
              Broadcast Group
            </label>

            <select
              className="broadcastInput"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            >
              <option value="">
                Select Broadcast Group
              </option>

              {userSkills.length > 0 ? (
                userSkills.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              ) : (
                <option disabled>
                  No groups available
                </option>
              )}
            </select>

            <label className="inputLabel">
              Attachment (Optional)
            </label>

            <MediaUpload
              onUpload={(file) => setMedia(file)}
            />

           <button
  className="broadcastButton"
  disabled={loading}
  type="submit"
>
  {loading ? "Publishing..." : "Publish Broadcast"}
</button>

<button
  className="createVocalsButton"
  disabled={loading}
  type="submit"
>
  {loading ? "Creating..." : "Create New Vocals"}
</button>
          </form>
        </div>
      </div>
    </div>
  );
}