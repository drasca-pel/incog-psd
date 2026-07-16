import React from "react";

export default function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  style = {},
}) {
  const variants = {
    primary: {
      background: "#2563EB",
      color: "#fff",
    },
    secondary: {
      background: "#1E293B",
      color: "#fff",
    },
    danger: {
      background: "#DC2626",
      color: "#fff",
    },
    success: {
      background: "#16A34A",
      color: "#fff",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "0.3s",
  },
};