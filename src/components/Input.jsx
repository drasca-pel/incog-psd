import React from "react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
}) {
  return (
    <div style={styles.container}>
      {label && <label style={styles.label}>{label}</label>}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={onChange}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },

  label: {
    color: "#CBD5E1",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#F8FAFC",
    fontSize: "15px",
    outline: "none",
  },
};