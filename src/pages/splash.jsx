import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.logoBox}>
        <h1 style={styles.logo}>INCOG</h1>
        <p style={styles.tagline}>Build • Collaborate • Solve</p>
      </div>

      <div style={styles.loader}>
        <span style={styles.dot}></span>
        <span style={styles.dot}></span>
        <span style={styles.dot}></span>
      </div>

      <p style={styles.version}>Version 1.0</p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundColor: "#0B1120",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  logoBox: {
    textAlign: "center",
  },

  logo: {
    fontSize: "58px",
    color: "#38BDF8",
    letterSpacing: "4px",
    margin: 0,
    fontWeight: "bold",
  },

  tagline: {
    marginTop: "12px",
    color: "#CBD5E1",
    fontSize: "18px",
  },

  loader: {
    display: "flex",
    gap: "10px",
    marginTop: "40px",
  },

  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#38BDF8",
  },

  version: {
    position: "absolute",
    bottom: "30px",
    color: "#64748B",
    fontSize: "14px",
  },
};