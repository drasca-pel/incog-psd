import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { syncAlertsForSkills } from "../utils/alertsSync";

import "../styles/Alerts.css";
import "../styles/ConfirmModal.css";

function isExpired(broadcast) {
  if (!broadcast?.expiresAt) {
    return false;
  }

  const expiresAt =
    typeof broadcast.expiresAt === "number"
      ? broadcast.expiresAt
      : broadcast.expiresAt?.toMillis
      ? broadcast.expiresAt.toMillis()
      : null;

  if (!expiresAt) {
    return false;
  }

  return Date.now() >= expiresAt;
}

// =====================================================
// MINI SHUFFLE
// =====================================================
function miniShuffle(alertList) {
  const result = [...alertList];

  if (result.length <= 1) {
    return result;
  }

  const swaps = Math.min(2, Math.floor(result.length / 2));

  for (let i = 0; i < swaps; i++) {
    const firstIndex = Math.floor(Math.random() * result.length);
    const range = 2;
    const minIndex = Math.max(0, firstIndex - range);
    const maxIndex = Math.min(result.length - 1, firstIndex + range);

    const secondIndex =
      minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));

    if (firstIndex !== secondIndex) {
      [result[firstIndex], result[secondIndex]] = [
        result[secondIndex],
        result[firstIndex],
      ];
    }
  }

  return result;
}

export default function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("All My Skills");
  const [confirmModal, setConfirmModal] = useState(null);

  // =====================================================
  // LOAD USER SKILLS
  // =====================================================
  const loadUserSkills = useCallback(async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setUserSkills([]);
        return;
      }

      const skills = snap.data().skills || [];
      setUserSkills(skills);
      await syncAlertsForSkills(uid, skills);
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  }, []);

  // =====================================================
  // AUTH + ALERT LISTENER
  // =====================================================
  useEffect(() => {
    let unsubscribeAlerts = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubscribeAlerts) {
        unsubscribeAlerts();
        unsubscribeAlerts = null;
      }

      if (!user) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      await loadUserSkills(user.uid);

      const alertQuery = query(
        collection(db, "alerts"),
        where("receiverId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      unsubscribeAlerts = onSnapshot(
        alertQuery,
        (snapshot) => {
          // Process asynchronous broadcast lookups safely
          const processAlerts = async () => {
            const validAlerts = [];
            const expiredOrInvalidDocRefs = [];

            // Fetch all broadcast checks in parallel instead of sequentially
            const alertPromises = snapshot.docs.map(async (alertDoc) => {
              const alertData = { id: alertDoc.id, ...alertDoc.data() };
              if (!alertData.broadcastId) return null;

              try {
                const broadcastSnap = await getDoc(
                  doc(db, "broadcasts", alertData.broadcastId)
                );

                if (
                  !broadcastSnap.exists() ||
                  broadcastSnap.data().status !== "active" ||
                  isExpired(broadcastSnap.data())
                ) {
                  expiredOrInvalidDocRefs.push(alertDoc.ref);
                  return null;
                }

                const broadcast = broadcastSnap.data();
                return {
                  ...alertData,
                  title: broadcast.title,
                  creatorName: broadcast.creatorName,
                  skill: broadcast.targetSkills?.[0] || "General",
                  group: broadcast.targetSkills?.[0] || "General",
                  broadcastStatus: broadcast.status,
                };
              } catch (err) {
                console.error("Error evaluating alert target:", err);
                return null;
              }
            });

            const results = await Promise.all(alertPromises);
            results.forEach((item) => {
              if (item) validAlerts.push(item);
            });

            // Cleanup invalid or expired alerts asynchronously in background
            expiredOrInvalidDocRefs.forEach((docRef) => {
              deleteDoc(docRef).catch((err) =>
                console.error("Unable to remove stale alert:", err)
              );
            });

            setAlerts(miniShuffle(validAlerts));
            setLoading(false);
          };

          processAlerts();
        },
        (error) => {
          console.error("Alert listener error:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribeAlerts) unsubscribeAlerts();
      unsubscribeAuth();
    };
  }, [loadUserSkills]);

  // =====================================================
  // OPEN ALERT
  // =====================================================
  function acceptAlert(alert) {
    setConfirmModal({
      title: "Open Broadcast?",
      message: "Do you want to view this broadcast?",
      confirmText: "View",
      type: "confirm",
      action: () => {
        setConfirmModal(null);
        navigate(`/broadcast/${alert.broadcastId}`);
      },
    });
  }

  // =====================================================
  // REMOVE ALERT
  // =====================================================
  function removeAlert(alertId) {
    setConfirmModal({
      title: "Remove Alert",
      message: "Are you sure you want to remove this alert?",
      confirmText: "Remove",
      type: "confirm",
      action: async () => {
        try {
          await deleteDoc(doc(db, "alerts", alertId));
          setConfirmModal(null);
        } catch (error) {
          console.error("Remove alert error:", error);
          setConfirmModal({
            title: "Removal Failed",
            message: "Unable to remove alert. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  }

  // =====================================================
  // FILTER ALERTS
  // =====================================================
  const filteredAlerts =
    selectedSkill === "All My Skills"
      ? alerts
      : alerts.filter((alert) => alert.skill === selectedSkill);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="alertsPage">
        <button className="backButton" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>Alerts</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="alertsPage">
      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>Alerts</h1>

      {/* SKILL FILTER */}
      <select
        className="skillFilter"
        value={selectedSkill}
        onChange={(event) => setSelectedSkill(event.target.value)}
      >
        <option>All My Skills</option>
        {userSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {/* ALERT LIST */}
      {filteredAlerts.length === 0 ? (
        <p>No alerts available.</p>
      ) : (
        filteredAlerts.map((alert) => (
          <div key={alert.id} className="alertCard">
            <h3>{alert.title}</h3>

            <div className="alertMeta">
              <span>{alert.creatorName}</span>
              <span>Skill: {alert.skill}</span>
            </div>

            <div className="subjectStatus">
              <h4>New Request</h4>
              <p>Someone needs your help.</p>
            </div>

            <div className="alertButtons">
              <button className="viewBtn" onClick={() => acceptAlert(alert)}>
                View
              </button>

              <button className="rejectBtn" onClick={() => removeAlert(alert.id)}>
                Remove
              </button>
            </div>
          </div>
        ))
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.confirmText}
        type={confirmModal?.type || "confirm"}
        onConfirm={confirmModal?.action}
        onClose={() => setConfirmModal(null)}
      />
    </div>
  );
}