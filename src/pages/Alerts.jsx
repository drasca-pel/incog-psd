import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { isBroadcastExpired } from "../utils/broadcastExpiry";

import "../styles/Alerts.css";

export default function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("All My Skills");

  useEffect(() => {
    if (!auth.currentUser) return;

    loadUserSkills();
    const unsubscribe = listenForAlerts();

    return () => unsubscribe && unsubscribe();
  }, []);

  async function loadUserSkills() {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUserSkills(snap.data().skills || []);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  }

  function listenForAlerts() {
    const q = query(
      collection(db, "alerts"),
      where("receiverId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      async (snapshot) => {
       const list = [];

for (const item of snapshot.docs) {
  const alert = {
    id: item.id,
    ...item.data(),
  };

  try {
    const broadcastSnap = await getDoc(
      doc(db, "broadcasts", alert.broadcastId)
    );

    if (!broadcastSnap.exists()) continue;

    const broadcast = {
      id: broadcastSnap.id,
      ...broadcastSnap.data(),
    };

    if (
      broadcast.status === "expired" ||
      isBroadcastExpired(broadcast)
    ) {
      continue;
    }

    list.push(alert);

  } catch (error) {
    console.error(error);
  }
}

setAlerts(list);
        setLoading(false);
      },
      (error) => {
        console.error("Alerts listener error:", error);
        setLoading(false);
      }
    );
  }

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
    const confirmAccept = window.confirm("Do you want to accept this project?");

    if (!confirmAccept) return;

    // Chat connection comes next
    console.log("Accepted:", alert);
  }

  const filteredAlerts =
    selectedSkill === "All My Skills"
      ? alerts
      : alerts.filter((item) => item.group === selectedSkill);

  return (
    <div className="alertsPage">
      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>Alerts</h1>

      <select
        className="skillFilter"
        value={selectedSkill}
        onChange={(e) => setSelectedSkill(e.target.value)}
      >
        <option>All My Skills</option>
        {userSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Loading...</p>
      ) : filteredAlerts.length === 0 ? (
        <p>No alerts available.</p>
      ) : (
        filteredAlerts.map((alert) => (
          <div key={alert.id} className="alertCard">
            <h3>{alert.title}</h3>

            <div className="alertMeta">
              <span>{alert.creatorName}</span>
              <span>{alert.group}</span>
            </div>

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