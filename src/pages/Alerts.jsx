import React, { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { isBroadcastExpired } from "../utils/broadcastExpiry";
import { syncAlertsForSkills } from "../utils/alertsSync";
import ConfirmModal from "../components/ConfirmModal";

import "../styles/Alerts.css";
import "../styles/ConfirmModal.css";

export default function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("All My Skills");
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    loadUserSkills();
    const unsubscribe = listenForAlerts();

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  async function loadUserSkills() {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userSkillsList = snap.data().skills || [];
        setUserSkills(userSkillsList);

        await syncAlertsForSkills(auth.currentUser.uid, userSkillsList);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  }

  function listenForAlerts() {
    const alertQuery = query(
      collection(db, "alerts"),
      where("receiverId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      alertQuery,
      async (snapshot) => {
        const alertList = [];

        for (const item of snapshot.docs) {
          const alert = { id: item.id, ...item.data() };

          try {
            const broadcastSnap = await getDoc(doc(db, "broadcasts", alert.broadcastId));

            if (!broadcastSnap.exists()) continue;

            const broadcast = { id: broadcastSnap.id, ...broadcastSnap.data() };

            if (broadcast.status === "expired" || isBroadcastExpired(broadcast)) {
              continue;
            }

            const chatQuery = query(
              collection(db, "chats"),
              where("projectId", "==", broadcast.id),
              where("helperId", "==", auth.currentUser.uid)
            );

            const chatSnapshot = await getDocs(chatQuery);

            let currentStatus = "new_request";

            if (!chatSnapshot.empty) {
              currentStatus = "request_accepted";
            } else if (
              broadcast.interestedCandidates?.some(
                (person) => person.uid === auth.currentUser.uid
              )
            ) {
              currentStatus = "in_progress";
            }

            alertList.push({
              ...alert,
              title: broadcast.title,
              creatorName: broadcast.creatorName,
              skill: broadcast.targetSkills?.[0] || broadcast.skill || "General",
              group: broadcast.group || "General",
              chatId: !chatSnapshot.empty ? chatSnapshot.docs[0].id : null,
              status: currentStatus,
            });
          } catch (error) {
            console.error("Alert processing error:", error);
          }
        }

        setAlerts(alertList);
        setLoading(false);
      },
      (error) => {
        console.error("Alert listener error:", error);
        setLoading(false);
      }
    );
  }

  function acceptAlert(alert) {
    setConfirmModal({
      title: "Accept Alert?",
      message: "Do you want to accept this request and view the broadcast?",
      confirmText: "Accept",
      type: "confirm",
      action: async () => {
        try {
          setConfirmModal(null);
          navigate(`/broadcast/${alert.broadcastId}`);
        } catch (error) {
          console.error("Accept alert error:", error);
          setConfirmModal({
            title: "Action Failed",
            message: "Unable to proceed. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () => setConfirmModal(null),
          });
        }
      },
    });
  }

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

  const filteredAlerts =
    selectedSkill === "All My Skills"
      ? alerts
      : alerts.filter((alert) => alert.skill === selectedSkill);

  return (
    <div className="alertsPage">

      <button className="backButton" onClick={() => navigate(-1)}>←</button>

      <h1>Alerts</h1>

      <select
        className="skillFilter"
        value={selectedSkill}
        onChange={(e) => setSelectedSkill(e.target.value)}
      >
        <option>All My Skills</option>
        {userSkills.map((skill) => (
          <option key={skill} value={skill}>{skill}</option>
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
              <span>Skill: {alert.skill}</span>
            </div>

            <div className="subjectStatus">
              {alert.status === "new_request" && (
                <>
                  <h4>New Request</h4>
                  <p>Someone needs your help.</p>
                </>
              )}

              {alert.status === "in_progress" && (
                <>
                  <h4>In Progress</h4>
                  <p>Interest submitted.</p>
                </>
              )}

              {alert.status === "request_accepted" && (
                <>
                  <h4>Request Accepted</h4>
                  <p>Chat is available.</p>
                </>
              )}
            </div>

            <div className="alertButtons">
              {alert.status === "new_request" && (
                <button className="viewBtn" onClick={() => navigate(`/broadcast/${alert.broadcastId}`)}>
                  View
                </button>
              )}

              {alert.status === "new_request" && (
                <button className="acceptBtn" onClick={() => acceptAlert(alert)}>
                  Accept
                </button>
              )}

              {alert.status === "in_progress" && (
                <button className="viewBtn" onClick={() => navigate(`/broadcast/${alert.broadcastId}`)}>
                  View
                </button>
              )}

              {alert.status === "request_accepted" && (
                <button className="viewBtn" onClick={() => navigate(`/chat/${alert.chatId}`)}>
                  View Chat
                </button>
              )}

              <button className="rejectBtn" onClick={() => removeAlert(alert.id)}>
                Remove
              </button>
            </div>
          </div>
        ))
      )}

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