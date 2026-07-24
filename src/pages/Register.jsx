import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,

        name,
        username,
        email,

        bio: "",
        photoURL: "",

        university: "",
        department: "",
        level: "",
        country: "",

        github: "",
        linkedin: "",
        portfolio: "",

        skills: [],
        lastSkillUpdate: new Date(),

        profileCompleted: false,

        createdAt: new Date(),
      });

      navigate("/skillSelection");

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.logo}>Create Account</h1>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div style={{ height: 15 }} />

          <Input
            label="Username"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div style={{ height: 15 }} />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={{ height: 15 }} />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ height: 15 }} />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div style={{ marginTop: 20 }}>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

        </form>

        <p style={styles.bottom}>
          Already have an account?

          <Link to="/login" style={styles.link}>
            Login
          </Link>

        </p>

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
    maxWidth: "450px",
    background: "#111827",
    padding: "35px",
    borderRadius: "15px",
    border: "1px solid #1F2937",
  },

  logo: {
    textAlign: "center",
    color: "#38BDF8",
    marginBottom: "25px",
  },

  error: {
    background: "#7F1D1D",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#FECACA",
  },

  bottom: {
    textAlign: "center",
    marginTop: "25px",
    color: "#CBD5E1",
  },

  link: {
    marginLeft: "8px",
    textDecoration: "none",
    color: "#38BDF8",
  },
};