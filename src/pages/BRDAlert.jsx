import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";

export default function BRDAlert() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "broadcasts"),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBroadcasts(data);
    });

    return () => unsubscribe();
  }, []);

  async function respond(type) {
    if (!selected) return;

    const ref = doc(db, "broadcasts", selected.id);

    if (type === "accept") {
      await updateDoc(ref, {
        acceptedUsers: arrayUnion(auth.currentUser.uid),
      });
      alert("Broadcast accepted");
    }

    if (type === "reject") {
      await updateDoc(ref, {
        rejectedUsers: arrayUnion(auth.currentUser.uid),
      });
      alert("Broadcast rejected");
    }

    setSelected(null);
  }

  return (
    <div style={styles.page}>
      <TopBar title="BRD Alerts" />

      <div style={styles.container}>
        {broadcasts.length === 0 && (
          <p style={styles.empty}>No BRD alerts available</p>
        )}

        {broadcasts.map((item) => (
          <div key={item.id} style={styles.card}>
            <h3>📢 {item.title}</h3>
            <p>{item.description}</p>
            <p style={styles.skill}>
              Skill: {item.targetSkills?.join(", ")}
            </p>
            <p style={styles.time}>By {item.creatorName}</p>
            <button
              style={styles.button}
              onClick={() => {
                setSelected(item);
              }}
            >
              Open
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <h3>Confirm Action</h3>
            <p>Do you want to accept this broadcast?</p>
            <div style={styles.buttons}>
              <button style={styles.accept} onClick={() => respond("accept")}>
                Accept
              </button>
              <button style={styles.reject} onClick={() => respond("reject")}>
                Reject
              </button>
            </div>
            <button
              style={{ ...styles.button, background: "#475569", marginTop: "15px" }}
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1120",
    color: "white",
    paddingBottom: "90px",
  },
  container: {
    padding: "15px",
  },
  card: {
    background: "#111827",
    border: "1px solid #1F2937",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "15px",
  },
  skill: {
    color: "#38BDF8",
    fontSize: "14px",
    margin: "8px 0",
  },
  time: {
    color: "#94A3B8",
    fontSize: "12px",
    marginBottom: "15px",
  },
  button: {
    background: "#38BDF8",
    color: "#0B1120",
    border: "none",
    padding: "10px 25px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: "50px",
  },
  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    background: "#111827",
    padding: "25px",
    borderRadius: "15px",
    width: "80%",
    maxWidth: "300px",
    textAlign: "center",
    border: "1px solid #1F2937",
  },
  buttons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  accept: {
    background: "#22C55E",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
  reject: {
    background: "#EF4444",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
};