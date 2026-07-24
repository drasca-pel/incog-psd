import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

export default function Settings() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  const [profile, setProfile] = useState({

    name: "",
    bio: "",

    github: "",
    linkedin: "",
    netlify: "",
    portfolio: "",

  });

  useEffect(() => {

    loadProfile();

  }, []);

  async function loadProfile() {

    try {

      const snap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      if (snap.exists()) {

        setProfile({

          name: snap.data().name || "",
          bio: snap.data().bio || "",

          github: snap.data().github || "",
          linkedin: snap.data().linkedin || "",
          netlify: snap.data().netlify || "",
          portfolio: snap.data().portfolio || "",

        });

      }

    } catch (err) {

      console.log(err);

    }

    setLoading(false);

  }

  async function saveProfile() {

    try {

      setSaving(true);

      await updateDoc(

        doc(db, "users", auth.currentUser.uid),

        {

          name: profile.name,
          bio: profile.bio,

          github: profile.github,
          linkedin: profile.linkedin,
          netlify: profile.netlify,
          portfolio: profile.portfolio,

        }

      );

      setModalTitle("Success");
      setModalMessage("Profile updated successfully.");
      setModalType("success");
      setModalOpen(true);

    } catch (err) {

      console.log(err);

      setModalTitle("Error");
      setModalMessage("Failed to save profile.");
      setModalType("error");
      setModalOpen(true);

    }

    setSaving(false);

  }

  if (loading) {

    return <h2>Loading...</h2>;

  } 

  return (
    <div style={styles.page}>

      <button
        style={styles.back}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1 style={styles.title}>
        Settings
      </h1>

      <div style={styles.card}>

        <label>Name</label>

        <input
          style={styles.input}
          value={profile.name}
          onChange={(e)=>
            setProfile({
              ...profile,
              name:e.target.value
            })
          }
        />

        <label>Bio</label>

        <textarea
          style={styles.textarea}
          rows={4}
          value={profile.bio}
          onChange={(e)=>
            setProfile({
              ...profile,
              bio:e.target.value
            })
          }
        />

        <label>GitHub</label>

        <input
          style={styles.input}
          placeholder="https://github.com/..."
          value={profile.github}
          onChange={(e)=>
            setProfile({
              ...profile,
              github:e.target.value
            })
          }
        />

        <label>LinkedIn</label>

        <input
          style={styles.input}
          placeholder="https://linkedin.com/in/..."
          value={profile.linkedin}
          onChange={(e)=>
            setProfile({
              ...profile,
              linkedin:e.target.value
            })
          }
        />

        <label>Netlify</label>

        <input
          style={styles.input}
          placeholder="https://yourapp.netlify.app"
          value={profile.netlify}
          onChange={(e)=>
            setProfile({
              ...profile,
              netlify:e.target.value
            })
          }
        />

        <label>Portfolio Website</label>

        <input
          style={styles.input}
          placeholder="https://..."
          value={profile.portfolio}
          onChange={(e)=>
            setProfile({
              ...profile,
              portfolio:e.target.value
            })
          }
        />

        <button
          style={styles.saveButton}
          onClick={() => {
            if (!saving) saveProfile();
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <hr style={styles.line} />

        <button
          style={styles.secondaryButton}
          onClick={() => {
            setModalTitle("Change Password");
            setModalMessage("This feature is coming soon.");
            setModalType("info");
            setModalOpen(true);
          }}
        >
          Change Password
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => {
            setModalTitle("Theme");
            setModalMessage("Dark theme is already enabled.");
            setModalType("info");
            setModalOpen(true);
          }}
        >
          Theme
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => {
            setModalTitle("Notifications");
            setModalMessage("Notification settings are coming soon.");
            setModalType("info");
            setModalOpen(true);
          }}
        >
          Notifications
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => {
            setModalTitle("About INCOG PSD");
            setModalMessage("INCOG PSD\nVersion 1.0");
            setModalType("info");
            setModalOpen(true);
          }}
        >
          About INCOG PSD
        </button>

        <button
          style={styles.logoutButton}
          onClick={() => {
            setModalTitle("Logout");
            setModalMessage("Are you sure you want to logout?");
            setModalType("confirm");
            setModalOpen(true);
          }}
        >
          Logout
        </button>

      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async () => {
          if (modalType === "confirm") {
            setModalOpen(false);
            await auth.signOut();
            navigate("/login");
          } else {
            setModalOpen(false);
          }
        }}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
      />

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  back: {
    background: "transparent",
    color: "#fff",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    marginBottom: "20px",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "15px",
    padding: "25px",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    marginBottom: "18px",
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "10px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    marginBottom: "18px",
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "10px",
    resize: "vertical",
    outline: "none",
  },

  saveButton: {
    width: "100%",
    padding: "14px",
    background: "#1976ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "10px",
    fontWeight: "bold",
  },

  line: {
    margin: "30px 0",
    borderColor: "#222",
  },

  secondaryButton: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    background: "#1c1c1c",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "10px",
    cursor: "pointer",
  },

  logoutButton: {
    width: "100%",
    padding: "14px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "15px",
    fontWeight: "bold",
  },

};