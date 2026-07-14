import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Firebase login will be added later
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>INCOG</h1>
        <h2>Welcome Back</h2>
        <p style={styles.subtitle}>
          Sign in to continue building and solving together.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button} type="submit">
            Login
          </button>
        </form>

        <button
          style={styles.guestButton}
          onClick={() => navigate("/dashboard")}
        >
          Continue as Guest
        </button>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0B1120",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  card: {
    background: "#1E293B",
    width: "380px",
    padding: "35px",
    borderRadius: "16px",
    color: "white",
    textAlign: "center",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)",
  },

  logo: {
    color: "#38BDF8",
    marginBottom: "10px",
    fontSize: "42px",
  },

  subtitle: {
    color: "#CBD5E1",
    marginBottom: "25px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#0EA5E9",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  guestButton: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    background: "transparent",
    color: "#38BDF8",
    border: "1px solid #38BDF8",
    borderRadius: "8px",
    cursor: "pointer",
  },

  footer: {
    marginTop: "20px",
    color: "#CBD5E1",
  },

  link: {
    color: "#38BDF8",
    textDecoration: "none",
    fontWeight: "bold",
  },
};