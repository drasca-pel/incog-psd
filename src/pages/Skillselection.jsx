import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import ConfirmModal from "../components/ConfirmModal";
import { syncAlertsForSkills } from "../utils/alertsSync";

// The master list of all skills available on INCOG PSD.
// Add, remove, or rename skills here — this is the single
// source of truth used across the app.
const skills = [
  "Software & web Development",
  "Artificial Intelligence",
  "Embedded Systems & IOT",
  "MATHEMATICS & PHYSICS",
  "Electronics",
  "Robotics",
  "UI/UX Design",
  "Graphic Design",
  "Data Science",
];

export default function SkillSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  function showInfo(title, message) {
    setConfirmModal({
      title,
      message,
      confirmText: "OK",
      type: "info",
      action: () => setConfirmModal(null),
    });
  }

  function toggleSkill(skill) {
    if (selected.includes(skill)) {
      setSelected(selected.filter((s) => s !== skill));
    } else {
      if (selected.length >= 5) {
        showInfo("Limit Reached", "You can only choose up to 5 skills.");
        return;
      }
      setSelected([...selected, skill]);
    }
  }

  async function saveSkills() {
    if (selected.length === 0) {
      showInfo("No Skills Selected", "Please choose at least one skill.");
      return;
    }

    setLoading(true);

    try {
      // setDoc with merge:true works whether or not the user's
      // Firestore profile document already exists — updateDoc would
      // fail if signup was interrupted and no document was created yet.
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          skills: selected,
          profileCompleted: true,
        },
        { merge: true }
      );

      navigate("/dashboard");
    } catch (err) {
      showInfo("Something Went Wrong", err.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Choose Your Skills</h1>

        <p style={styles.subtitle}>
          Select up to 5 skills you're interested in.
        </p>

        <div style={styles.grid}>
          {skills.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              style={{
                ...styles.skill,
                background: selected.includes(skill)
                  ? styles.colors.accent
                  : styles.colors.pillBg,
                borderColor: selected.includes(skill)
                  ? styles.colors.accent
                  : styles.colors.border,
              }}
            >
              {skill}
            </button>
          ))}
        </div>

        <p style={styles.counter}>
          {selected.length} / 5 Selected
        </p>

        <button
          onClick={saveSkills}
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type || "confirm"}
          onConfirm={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

// ============================================
// ALL STYLING LIVES HERE — edit colors, sizes,
// spacing, etc. directly in this object.
// ============================================
const styles = {
  // Central colors — change these and every element below updates
  colors: {
    pageBg: "#0a0a0a",
    cardBg: "#121212",
    pillBg: "#1a1a1a",
    border: "#212121",
    accent: "#3b82f6",
    accentHover: "#2563eb",
    textPrimary: "#f2f2f2",
    textMuted: "#8a8a8a",
  },

  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0a0a0a",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#121212",
    padding: "30px",
    borderRadius: "20px",
    color: "#f2f2f2",
    border: "1px solid #212121",
  },

  heading: {
    margin: "0 0 8px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#f2f2f2",
  },

  subtitle: {
    color: "#8a8a8a",
    marginBottom: "20px",
    fontSize: "14px",
  },

  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },

  skill: {
    border: "1px solid #262626",
    color: "#f2f2f2",
    padding: "12px 18px",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },

  counter: {
    color: "#a8a8a8",
    marginBottom: "20px",
    fontSize: "13px",
  },

  button: {
    width: "100%",
    padding: "15px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "bold",
  },
};