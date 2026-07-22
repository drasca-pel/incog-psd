import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

const skills = [
  "Software Development",
  "Web Development",
  "Mobile Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Embedded Systems & IOT",
  "MATHEMATICS & PHYSICS",
  "Electronics",
  "Robotics",
  "Cybersecurity",
  "Cloud Computing",
  "UI/UX Design",
  "Graphic Design",
  "Data Science",
  "Game Development",
  "Blockchain"
];

export default function SkillSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  function toggleSkill(skill) {
    if (selected.includes(skill)) {
      setSelected(selected.filter((s) => s !== skill));
    } else {
      if (selected.length >= 5) {
        alert("You can only choose up to 5 skills.");
        return;
      }
      setSelected([...selected, skill]);
    }
  }

  async function saveSkills() {
    if (selected.length === 0) {
      alert("Please choose at least one skill.");
      return;
    }

    setLoading(true);

    try {
     await updateDoc(doc(db, "users", auth.currentUser.uid), {
  skills: selected,
  profileCompleted: true,
});

      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Choose Your Skills</h1>

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
                  ? "#2563EB"
                  : "#1E293B",
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
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0B1120",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#111827",
    padding: "30px",
    borderRadius: "15px",
    color: "white",
    border: "1px solid #1F2937",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: "20px",
  },

  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },

  skill: {
    border: "none",
    color: "white",
    padding: "12px 18px",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "14px",
  },

  counter: {
    color: "#CBD5E1",
    marginBottom: "20px",
  },

  button: {
    width: "100%",
    padding: "15px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};