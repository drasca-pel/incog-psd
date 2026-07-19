import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

import "../styles/Alerts.css";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "alerts"),
      where("receiverId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setAlerts(list);
        setLoading(false);
      },
      (error) => {
        console.error("Alerts Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function rejectAlert(alertId) {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this alert?"
    );

    if (!confirmReject) return;

    try {
      await deleteDoc(doc(db, "alerts", alertId));
    } catch (error) {
      console.error("Error rejecting alert:", error);
    }
  }

  function acceptAlert(alert) {
    const confirmAccept = window.confirm(
      "Do you want to accept this project?"
    );

    if (!confirmAccept) return;

    // Chat creation will be connected here
    console.log("Accepted alert:", alert);
  }

  return (
    <div className="alertsPage">
      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>Alerts</h1>

      {loading ? (
        <p>Loading...</p>
      ) : alerts.length === 0 ? (
        <p>No alerts available.</p>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="alertCard">
            <h3>{alert.title}</h3>

            <p>By: {alert.creatorName}</p>

            <p>Group: {alert.group}</p>

            <div className="alertButtons">
              <button
                className="viewBtn"
                onClick={() => navigate(`/broadcast/${alert.broadcastId}`)}
              >
                View
              </button>

              <button className="acceptBtn" onClick={() => acceptAlert(alert)}>
                Accept
              </button>

              <button
                className="rejectBtn"
                onClick={() => rejectAlert(alert.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}