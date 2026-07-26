import React, { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User installed the app");
    } else {
      console.log("User dismissed the install");
    }

    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "15px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#111827",
        color: "#fff",
        padding: "14px 20px",
        borderRadius: "14px",
        border: "1px solid #374151",
        boxShadow: "0 10px 30px rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        zIndex: 9999,
      }}
    >
      <span>Install INCOG PSD for a better experience.</span>

      <button
        onClick={handleInstall}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        Install
      </button>
    </div>
  );
}