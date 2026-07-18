import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";
import { uploadToCloudinary } from "../services/cloudinary";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import MediaUpload from "../components/MediaUpload";

import "../styles/Broadcast.css";

export default function EditBroadcast() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");

  const [media, setMedia] = useState(null);
  const [oldMedia, setOldMedia] = useState(null);

  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    loadUserSkills();
    loadBroadcast();
  }, []);

  async function loadUserSkills() {
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
      console.error(error);
    }
  }

  async function loadBroadcast() {

    try {

      const broadcastRef = doc(
        db,
        "broadcasts",
        id
      );

      const broadcastSnap =
        await getDoc(broadcastRef);

      if (!broadcastSnap.exists()) {
        alert("Broadcast not found.");
        navigate("/my-broadcasts");
        return;
      }

      const data =
        broadcastSnap.data();

      setTitle(data.title || "");
      setDescription(data.description || "");
      setSkill(data.targetSkills?.[0] || "");

      setOldMedia(data.media || null);
      setMedia(data.media || null);

    } catch (error) {
      console.error(error);
    }

  }

  async function saveChanges(e) {

    e.preventDefault();

    if (!title || !description || !skill) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {

      let mediaData = oldMedia;

      if (media?.file) {
        mediaData =
          await uploadToCloudinary(
            media.file
          );
      }

      if (media?.removed) {
        mediaData = null;
      }

      await updateDoc(
        doc(db, "broadcasts", id),
        {
          title,
          description,
          targetSkills: [skill],
          media: mediaData,
          updatedAt: serverTimestamp(),
        }
      );

      alert(
        "Broadcast updated successfully."
      );

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

          <h1>Edit Broadcast</h1>

          <p className="broadcastSubtitle">
            Update your engineering problem.
          </p>
          <form onSubmit={saveChanges}>

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

        <option
          key={item}
          value={item}
        >
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
    Attachment
  </label>

  <MediaUpload
    existingMedia={oldMedia}
    onUpload={setMedia}
  />

  <button
    className="broadcastButton"
    disabled={loading}
    type="submit"
  >
    {loading ? "Saving..." : "Save Changes"}
  </button>

  <button
    type="button"
    className="createVocalsButton"
    onClick={() => navigate("/my-broadcasts")}
  >
    Cancel
  </button>

</form>

        </div>
      </div>
    </div>
  );
}