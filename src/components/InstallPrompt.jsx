import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      console.log("beforeinstallprompt fired");

      e.preventDefault();

      setDeferredPrompt(e);

      alert("Install prompt is ready!");
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    console.log(result.outcome);

    setDeferredPrompt(null);
  }

  if (!deferredPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        background: "#111",
        color: "#fff",
        padding: 20,
        borderRadius: 12,
        zIndex: 9999,
      }}
    >
      <h3>Install INCOG PSD</h3>

      <p>
        Install the app on your phone.
      </p>

      <button
        onClick={installApp}
        style={{
          padding: "10px 20px",
          background: "#0A84FF",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        Install
      </button>
    </div>
  );
}