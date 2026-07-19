import React, { useState, useEffect } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import MediaUpload from "../components/MediaUpload";

import { uploadToCloudinary } from "../services/cloudinary";

import "../styles/Broadcast.css";

export default function EditBroadcast() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [skill, setSkill] = useState("");

  const [media, setMedia] = useState(null);

  const [oldMedia, setOldMedia] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [expired, setExpired] =
    useState(false);

  const [userSkills, setUserSkills] =
    useState([]);
    useEffect(() => {
    async function loadData() {
      if (!auth.currentUser) return;

      try {
        // Load user's groups
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

        // Load broadcast
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

        const data = broadcastSnap.data();

        // Only owner can edit
        if (
          data.creatorId !==
          auth.currentUser.uid
        ) {
          alert(
            "You cannot edit this broadcast."
          );

          navigate("/my-broadcasts");

          return;
        }

        // Check 1-hour edit limit
        if (
          data.editExpiresAt &&
          Date.now() > data.editExpiresAt
        ) {
          setExpired(true);
        }

        setTitle(data.title || "");

        setDescription(
          data.description || ""
        );

        setSkill(
          data.targetSkills?.[0] || ""
        );

        setMedia(data.media || null);

        setOldMedia(data.media || null);

      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, [id, navigate]);
  async function saveChanges(e) {
  e.preventDefault();

  if (!title || !description || !skill) {
    alert("Please fill in all required fields.");
    return;
  }

  if (expired) {
    alert(
      "This broadcast can no longer be edited."
    );
    return;
  }

  setLoading(true);

  try {
    let mediaData = oldMedia;

    // Upload new media if selected
    if (media?.file) {
      mediaData = await uploadToCloudinary(
        media.file
      );

      // Delete old Cloudinary media later
      if (oldMedia?.publicId) {
        console.log(
          "Delete old Cloudinary file:",
          oldMedia.publicId
        );

        // We'll connect the Firebase Function here later
      }
    }

    // User removed media completely
    if (media === null && oldMedia) {
      console.log(
        "Delete Cloudinary file:",
        oldMedia.publicId
      );

      mediaData = null;

      // We'll connect the Firebase Function here later
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

    alert("Broadcast updated successfully.");

    navigate("/my-broadcasts");

  } catch (error) {

    console.error(error);

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
          Update your engineering problem before the edit time expires.
        </p>

        <form onSubmit={saveChanges}>

          <label className="inputLabel">
            Broadcast Title
          </label>

          <input
            className="broadcastInput"
            placeholder="Example: ESP32 Smart Irrigation System"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          <label className="inputLabel">
            Problem Description
          </label>

          <textarea
            className="broadcastTextarea"
            placeholder="Explain the problem in detail..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <label className="inputLabel">
            Broadcast Group
          </label>

          <select
            className="broadcastInput"
            value={skill}
            onChange={(e) =>
              setSkill(e.target.value)
            }
          >
            <option value="">
              Select Broadcast Group
            </option>

            {userSkills.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label className="inputLabel">
            Attachment (Optional)
          </label><MediaUpload
            media={media}
            onUpload={(file) => setMedia(file)}
            onRemove={() => setMedia(null)}
          />

          {expired ? (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#2b0000",
                color: "#ffb3b3",
                borderRadius: "8px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Editing period has expired.
            </div>
          ) : (
            <button
              className="broadcastButton"
              disabled={loading}
              type="submit"
            >
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          )}</form>

      </div>
    </div>
  </div>
);
}