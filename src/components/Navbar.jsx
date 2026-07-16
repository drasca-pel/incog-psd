import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Feed", path: "/feed" },
    { name: "Broadcast", path: "/broadcast" },
    { name: "Chat", path: "/chat" },
    { name: "Portfolio", path: "/portfolio" },
  ];

  return (
    <header style={styles.header}>
      <Link to="/dashboard" style={styles.logo}>
        INCOG
      </Link>

      <input
        type="text"
        placeholder="Search people, projects..."
        style={styles.search}
      />

      <nav style={styles.nav}>
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              ...styles.link,
              color:
                location.pathname === item.path
                  ? "#38BDF8"
                  : "#CBD5E1",
            }}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div style={styles.right}>
        <button style={styles.icon}>🔔</button>

        <Link to="/profile" style={styles.profile}>
          👤
        </Link>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "70px",
    background: "#111827",
    borderBottom: "1px solid #1F2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 25px",
    position: "sticky",
    top: 0,
    zIndex: 999,
  },

  logo: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#38BDF8",
    textDecoration: "none",
  },

  search: {
    width: "320px",
    padding: "10px 15px",
    background: "#1E293B",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "8px",
    outline: "none",
  },

  nav: {
    display: "flex",
    gap: "25px",
  },

  link: {
    textDecoration: "none",
    fontWeight: "600",
    transition: ".2s",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  icon: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
  },

  profile: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: "18px",
  },
};