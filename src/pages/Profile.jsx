import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { uploadToCloudinary } from "../services/cloudinary";

export default function Profile() {
  const navigate = useNavigate();
  const { uid } = useParams();

  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isOwner = uid === auth.currentUser?.uid;

  useEffect(() => {
    loadProfile();
  }, [uid]);

  async function loadProfile() {
    try {
      const snap = await getDoc(
        doc(db, "users", uid)
      );

      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        setUserData({
          name: "Unknown User",
          email: "",
          bio: "",
          skills: [],
          github: "",
          linkedin: "",
          netlify: "",
          portfolio: "",
          photoURL: "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploading(true);

      const upload = await uploadToCloudinary(file);

      await updateDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          photoURL: upload.url,
        }
      );

      setUserData((prev) => ({
        ...prev,
        photoURL: upload.url,
      }));
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  }

  if (!userData) {
    return (
      <div style={styles.loading}>
        Loading Profile...
      </div>
    );
  } 
   return(
    <div style={styles.page}>

      {/* Back */}

      <button
        style={styles.back}
        onClick={() => navigate(-1)}
      >
        ←
      </button>

      <div style={styles.card}>

        {/* Profile Picture */}

        <div style={styles.avatar}>

          {userData.photoURL ? (

            <img
              src={userData.photoURL}
              alt="profile"
              style={styles.image}
            />

          ) : (

            userData.name?.charAt(0).toUpperCase()

          )}

        </div>

        {isOwner && (
          <>
            <label style={styles.uploadLabel}>
              {uploading ? "Uploading..." : "Change Profile Picture"}

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </>
        )}

        <h2 style={styles.name}>
          {userData.name}
        </h2>

        <p style={styles.email}>
          {userData.email}
        </p>

        {/* Bio */}

        <div style={styles.section}>
          <h3>Bio</h3>

          <p>
            {userData.bio || "No bio added yet."}
          </p>
        </div>

        {/* Skills */}

        <div style={styles.section}>
          <h3>Skills</h3>

          <p>
            {userData.skills?.length
              ? userData.skills.join(", ")
              : "No skills added."}
          </p>
        </div>

        {/* Links */}

        <div style={styles.section}>

          <h3>Links</h3>

          <p>
            <strong>GitHub</strong><br />
            {userData.github || "Not Added"}
          </p>

          <p>
            <strong>LinkedIn</strong><br />
            {userData.linkedin || "Not Added"}
          </p>

          <p>
            <strong>Netlify</strong><br />
            {userData.netlify || "Not Added"}
          </p>

          <p>
            <strong>Portfolio</strong><br />
            {userData.portfolio || "Not Added"}
          </p>

        </div>

        {isOwner && (

          <button
            style={styles.settingsButton}
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>

        )}

      </div>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },

  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: 80,
  },

  back: {
    background: "transparent",
    color: "#fff",
    border: "none",
    fontSize: 28,
    cursor: "pointer",
    marginBottom: 20,
  },

  card: {
    maxWidth: 550,
    margin: "0 auto",
    background: "#111",
    border: "1px solid #222",
    borderRadius: 18,
    padding: 25,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "#1976ff",
    margin: "0 auto",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 40,
    fontWeight: "bold",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  uploadLabel: {
    display: "block",
    marginTop: 15,
    color: "#4ea3ff",
    textAlign: "center",
    cursor: "pointer",
  },

  name: {
    textAlign: "center",
    marginTop: 20,
  },

  email: {
    textAlign: "center",
    color: "#999",
    marginBottom: 25,
  },

  section: {
    marginTop: 25,
    paddingTop: 15,
    borderTop: "1px solid #222",
  },

  settingsButton: {
    width: "100%",
    marginTop: 35,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "#1976ff",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },

};