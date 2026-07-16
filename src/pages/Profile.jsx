import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Profile() {
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));

    if (snap.exists()) {
      const data = snap.data();

      setBio(data.bio || "");
      setUniversity(data.university || "");
      setDepartment(data.department || "");
      setLevel(data.level || "");
      setCountry(data.country || "");
      setGithub(data.github || "");
      setLinkedin(data.linkedin || "");
      setPortfolio(data.portfolio || "");
    }

    setLoading(false);
  }

  async function saveProfile() {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      bio,
      university,
      department,
      level,
      country,
      github,
      linkedin,
      portfolio,
      profileCompleted: true,
    });

    alert("Profile updated successfully.");
  }

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>My Profile</h1>

        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={styles.textarea}
        />

        <input
          placeholder="University"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="GitHub"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="LinkedIn"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Portfolio Website"
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
          style={styles.input}
        />

        <button onClick={saveProfile} style={styles.button}>
          Save Profile
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1120",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#111827",
    padding: "30px",
    borderRadius: "15px",
    color: "white",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1E293B",
    color: "white",
  },

  textarea: {
    width: "100%",
    height: "100px",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1E293B",
    color: "white",
    resize: "none",
  },

  button: {
    width: "100%",
    padding: "15px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};