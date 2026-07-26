import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Auth account exists but Firestore profile was never created
        // (e.g. network dropped mid-signup). Create a minimal profile
        // now so SkillSelection has something to update.
        await setDoc(userRef, {
          uid: result.user.uid,
          name: result.user.displayName || "",
          username: "",
          email: result.user.email || email,
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

        navigate("/SkillSelection");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (!userData.profileCompleted) {
        navigate("/SkillSelection");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("Account not found.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;

        default:
          setError(err.message);
      }
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.logo}>INCOG</h1>

        <p style={styles.subtitle}>
          Collaborate. Build. Innovate.
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={{height:15}}/>

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={styles.options}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                onChange={() => setShowPassword(!showPassword)}
                style={styles.checkbox}
              />
              Show Password
            </label>

            <Link to="/forgot-password" style={styles.link}>
              Forgot?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>

        </form>

        <div style={styles.divider}>
          OR
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate("/register")}
        >
          Create Account
        </Button>

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
    background: "#000000",
    padding: "20px"
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#0B0B0B",
    padding: "35px",
    borderRadius: "18px",
    border: "1px solid #1A1A1A",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9)"
  },

  logo: {
    textAlign: "center",
    fontSize: "40px",
    color: "#38BDF8",
    marginBottom: "10px",
    fontWeight: "800",
    letterSpacing: "1px"
  },

  subtitle: {
    textAlign: "center",
    color: "#888888",
    marginBottom: "25px",
    fontSize: "14px"
  },

  options: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "15px 0 20px",
    fontSize: "14px"
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#AAAAAA",
    cursor: "pointer"
  },

  checkbox: {
    accentColor: "#38BDF8",
    cursor: "pointer"
  },

  divider: {
    textAlign: "center",
    margin: "20px 0",
    color: "#555555",
    fontSize: "13px",
    letterSpacing: "1px"
  },

  link: {
    color: "#38BDF8",
    textDecoration: "none"
  },

  error: {
    background: "rgba(127, 29, 29, 0.4)",
    border: "1px solid #7F1D1D",
    padding: "12px",
    borderRadius: "10px",
    color: "#FECACA",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "center"
  }
};