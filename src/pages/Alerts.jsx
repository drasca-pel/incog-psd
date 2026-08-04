import React, {
  useEffect,
  useState,
} from "react";

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

import {
  auth,
  db,
} from "../firebase/firebase";

import { useNavigate } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

import { syncAlertsForSkills } from "../utils/alertsSync";

import "../styles/Alerts.css";
import "../styles/ConfirmModal.css";

function isExpired(broadcast) {
  if (!broadcast?.expiresAt) {
    return false;
  }

  return (
    broadcast.expiresAt <= Date.now()
  );
}

export default function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [userSkills, setUserSkills] =
    useState([]);

  const [selectedSkill, setSelectedSkill] =
    useState("All My Skills");

  const [confirmModal, setConfirmModal] =
    useState(null);

  useEffect(() => {
    let unsubscribe = null;

    const unsubscribeAuth =
      auth.onAuthStateChanged(
        async (user) => {
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }

          if (!user) {
            setAlerts([]);
            setLoading(false);
            return;
          }

          await loadUserSkills(user.uid);

          unsubscribe =
            listenForAlerts(user.uid);
        }
      );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }

      unsubscribeAuth();
    };
  }, []);

  // =====================================================
  // LOAD USER SKILLS
  // =====================================================

  async function loadUserSkills(uid) {
    try {
      const userRef = doc(
        db,
        "users",
        uid
      );

      const snap =
        await getDoc(userRef);

      if (!snap.exists()) {
        setUserSkills([]);
        setLoading(false);
        return;
      }

      const skills =
        snap.data().skills || [];

      setUserSkills(skills);

      await syncAlertsForSkills(
        uid,
        skills
      );
    } catch (error) {
      console.error(
        "Error loading skills:",
        error
      );
    }
  }

  // =====================================================
  // LISTEN TO ALERTS
  // =====================================================

  function listenForAlerts(uid) {
    const alertQuery = query(
      collection(db, "alerts"),
      where(
        "receiverId",
        "==",
        uid
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    return onSnapshot(
      alertQuery,
      async (snapshot) => {
        const alertList = [];

        for (
          const alertDoc
          of snapshot.docs
        ) {
          const alert = {
            id: alertDoc.id,
            ...alertDoc.data(),
          };

          if (!alert.broadcastId) {
            continue;
          }

          try {
            const broadcastSnap =
              await getDoc(
                doc(
                  db,
                  "broadcasts",
                  alert.broadcastId
                )
              );

            // Broadcast has already been deleted.
            if (
              !broadcastSnap.exists()
            ) {
              try {
                await deleteDoc(
                  alertDoc.ref
                );
              } catch (error) {
                console.error(
                  "Unable to remove orphan alert:",
                  error
                );
              }

              continue;
            }

            const broadcast = {
              id: broadcastSnap.id,
              ...broadcastSnap.data(),
            };

            // =================================================
            // CLOSED BROADCAST
            // =================================================

            if (
              broadcast.status !==
              "active"
            ) {
              try {
                await deleteDoc(
                  alertDoc.ref
                );
              } catch (error) {
                console.error(
                  "Unable to remove closed alert:",
                  error
                );
              }

              continue;
            }

            // =================================================
            // EXPIRED BROADCAST
            // =================================================

            if (
              isExpired(broadcast)
            ) {
              try {
                await deleteDoc(
                  alertDoc.ref
                );
              } catch (error) {
                console.error(
                  "Unable to remove expired alert:",
                  error
                );
              }

              continue;
            }

            alertList.push({
              ...alert,

              title:
                broadcast.title,

              creatorName:
                broadcast.creatorName,

              skill:
                broadcast.targetSkills?.[0] ||
                "General",

              group:
                broadcast.targetSkills?.[0] ||
                "General",

              broadcastStatus:
                broadcast.status,
            });
          } catch (error) {
            console.error(
              "Alert processing error:",
              error
            );
          }
        }

        // ===================================================
        // SHUFFLE
        // ===================================================

        const shuffled =
          [...alertList];

        for (
          let i = shuffled.length - 1;
          i > 0;
          i--
        ) {
          const j =
            Math.floor(
              Math.random() *
                (i + 1)
            );

          [
            shuffled[i],
            shuffled[j],
          ] = [
            shuffled[j],
            shuffled[i],
          ];
        }

        setAlerts(shuffled);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Alert listener error:",
          error
        );

        setLoading(false);
      }
    );
  }

  // =====================================================
  // OPEN ALERT
  // =====================================================

  function acceptAlert(alert) {
    setConfirmModal({
      title: "Open Broadcast?",
      message:
        "Do you want to view this broadcast?",
      confirmText: "View",
      type: "confirm",

      action: async () => {
        try {
          setConfirmModal(null);

          navigate(
            `/broadcast/${alert.broadcastId}`
          );
        } catch (error) {
          console.error(
            "Open broadcast error:",
            error
          );
        }
      },
    });
  }

  // =====================================================
  // REMOVE ALERT
  // =====================================================

  function removeAlert(alertId) {
    setConfirmModal({
      title: "Remove Alert",
      message:
        "Are you sure you want to remove this alert?",
      confirmText: "Remove",
      type: "confirm",

      action: async () => {
        try {
          await deleteDoc(
            doc(
              db,
              "alerts",
              alertId
            )
          );

          setConfirmModal(null);
        } catch (error) {
          console.error(
            "Remove alert error:",
            error
          );

          setConfirmModal({
            title: "Removal Failed",
            message:
              "Unable to remove alert. Please try again.",
            confirmText: "OK",
            type: "info",
            action: () =>
              setConfirmModal(null),
          });
        }
      },
    });
  }

  const filteredAlerts =
    selectedSkill ===
    "All My Skills"
      ? alerts
      : alerts.filter(
          (alert) =>
            alert.skill ===
            selectedSkill
        );

  if (loading) {
    return (
      <div className="alertsPage">
        <button
          className="backButton"
          onClick={() =>
            navigate(-1)
          }
        >
          ←
        </button>

        <h1>Alerts</h1>

        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="alertsPage">

      <button
        className="backButton"
        onClick={() =>
          navigate(-1)
        }
      >
        ←
      </button>

      <h1>Alerts</h1>

      <select
        className="skillFilter"
        value={selectedSkill}
        onChange={(event) =>
          setSelectedSkill(
            event.target.value
          )
        }
      >
        <option>
          All My Skills
        </option>

        {userSkills.map(
          (skill) => (
            <option
              key={skill}
              value={skill}
            >
              {skill}
            </option>
          )
        )}
      </select>

      {filteredAlerts.length === 0 ? (
        <p>
          No alerts available.
        </p>
      ) : (
        filteredAlerts.map(
          (alert) => (
            <div
              key={alert.id}
              className="alertCard"
            >
              <h3>
                {alert.title}
              </h3>

              <div className="alertMeta">
                <span>
                  {alert.creatorName}
                </span>

                <span>
                  Skill: {alert.skill}
                </span>
              </div>

              <div className="subjectStatus">
                <h4>
                  New Request
                </h4>

                <p>
                  Someone needs your help.
                </p>
              </div>

              <div className="alertButtons">

                <button
                  className="viewBtn"
                  onClick={() =>
                    acceptAlert(alert)
                  }
                >
                  View
                </button>

                <button
                  className="rejectBtn"
                  onClick={() =>
                    removeAlert(
                      alert.id
                    )
                  }
                >
                  Remove
                </button>

              </div>
            </div>
          )
        )
      )}

      <ConfirmModal
        isOpen={Boolean(
          confirmModal
        )}
        title={
          confirmModal?.title
        }
        message={
          confirmModal?.message
        }
        confirmText={
          confirmModal?.confirmText
        }
        type={
          confirmModal?.type ||
          "confirm"
        }
        onConfirm={
          confirmModal?.action
        }
        onClose={() =>
          setConfirmModal(null)
        }
      />

    </div>
  );
}