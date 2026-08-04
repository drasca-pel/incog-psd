import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../services/cloudinary";
import ConfirmModal from "../components/ConfirmModal";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import MediaUpload from "../components/MediaUpload";
import "../styles/Broadcast.css";

const MAX_ACTIVE_BROADCASTS = 2;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const BROADCAST_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export default function Broadcast() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [media, setMedia] = useState(null);

  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    const loadUserSkills = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserSkills(userSnap.data().skills || []);
        }
      } catch (error) {
        console.error("Error loading user skills:", error);
      }
    };

    loadUserSkills();
  }, []);

  function showInfo(modalTitle, message) {
    setConfirmModal({
      title: modalTitle,
      message,
      confirmText: "OK",
      type: "info",
      action: () => setConfirmModal(null),
    });
  }

  async function createBroadcast(e) {
    e.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      showInfo("Not Signed In", "Please sign in before creating a broadcast.");
      return;
    }

    if (!title.trim() || !description.trim() || !skill) {
      showInfo("Missing Fields", "Please fill in all required fields.");
      return;
    }

    if (media?.file && media.file.size > MAX_UPLOAD_BYTES) {
      showInfo(
        "File Too Large",
        "Attachments must be 25MB or smaller. Please choose a smaller file."
      );
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // CHECK ACTIVE BROADCAST LIMIT
      // --------------------------------------------------
      const activeQuery = query(
        collection(db, "broadcasts"),
        where("creatorId", "==", currentUser.uid),
        where("status", "==", "active")
      );

      const existing = await getDocs(activeQuery);
      const now = Date.now();

      const validActiveBroadcasts = existing.docs.filter((item) => {
        const data = item.data();
        return data.status === "active" && data.expiresAt && data.expiresAt > now;
      });

      if (validActiveBroadcasts.length >= MAX_ACTIVE_BROADCASTS) {
        showInfo(
          "Limit Reached",
          `You already have ${MAX_ACTIVE_BROADCASTS} active broadcasts. Complete one before creating another.`
        );
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // UPLOAD MEDIA
      // --------------------------------------------------
      let uploadedMedia = null;
      if (media?.file) {
        uploadedMedia = await uploadToCloudinary(media.file);
      }

      // --------------------------------------------------
      // CALCULATE EXPIRATION
      // --------------------------------------------------
      const createdTime = Date.now();
      const expiresAt = createdTime + BROADCAST_LIFETIME_MS;
      const creatorDisplayName = currentUser.displayName || "INCOG User";

      // --------------------------------------------------
      // CREATE BROADCAST
      // --------------------------------------------------
      const broadcastRef = await addDoc(collection(db, "broadcasts"), {
        creatorId: currentUser.uid,
        creatorName: creatorDisplayName,
        title: title.trim(),
        description: description.trim(),
        targetSkills: [skill],
        skill: skill,
        media: uploadedMedia,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        accepted: false,
        acceptedBy: null,
        interestedCandidates: [],
        expiresIn: 7,
        expiresAt: expiresAt,
        editExpiresAt: createdTime + 60 * 60 * 1000,
        lastReminderAt: serverTimestamp(),
        reminderCount: 0,
      });

      // --------------------------------------------------
      // CREATE WORKSPACE
      // --------------------------------------------------
      await addDoc(collection(db, "workspaces"), {
        broadcastId: broadcastRef.id,
        creatorId: currentUser.uid,
        creatorName: creatorDisplayName,
        title: title.trim(),
        group: skill,
        participants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: expiresAt,
      });

      // --------------------------------------------------
      // BATCH CREATE ALERTS FOR MATCHING USERS
      // --------------------------------------------------
      const usersQuery = query(
        collection(db, "users"),
        where("skills", "array-contains", skill)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        const batch = writeBatch(db);
        let alertCount = 0;

        usersSnapshot.docs.forEach((userDoc) => {
          if (userDoc.id !== currentUser.uid) {
            const alertRef = doc(collection(db, "alerts"));
            batch.set(alertRef, {
              receiverId: userDoc.id,
              creatorId: currentUser.uid,
              creatorName: creatorDisplayName,
              broadcastId: broadcastRef.id,
              title: title.trim(),
              group: skill,
              skill: skill,
              status: "unread",
              createdAt: serverTimestamp(),
              expiresAt: expiresAt,
            });
            alertCount++;
          }
        });

        if (alertCount > 0) {
          await batch.commit();
        }
      }

      // --------------------------------------------------
      // RESET
      // --------------------------------------------------
      setTitle("");
      setDescription("");
      setSkill("");
      setMedia(null);

      navigate("/my-broadcasts");
    } catch (error) {
      console.error("Create broadcast error:", error);
      showInfo(
        "Something Went Wrong",
        error.message || "Unable to create broadcast."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="broadcastPage">
      <div className="broadcastContainer">
        <div className="broadcastCard">
          <button
            className="backButton"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            ←
          </button>

          <h1>Create Broadcast</h1>

          <p className="broadcastSubtitle">
            Publish an engineering problem and connect with professionals who
            can help.
          </p>

          <form onSubmit={createBroadcast}>
            <label className="inputLabel">Broadcast Title</label>

            <input
              className="broadcastInput"
              placeholder="Example: ESP32 Smart Irrigation System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />

            <label className="inputLabel">Problem Description</label>

            <textarea
              className="broadcastTextarea"
              placeholder="Explain the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <label className="inputLabel">Broadcast Group</label>

            <select
              className="broadcastInput"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Broadcast Group</option>

              {userSkills.length > 0 ? (
                userSkills.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              ) : (
                <option disabled value="">
                  No groups available (Add skills to your profile)
                </option>
              )}
            </select>

            <label className="inputLabel">
              Attachment (Optional, max 25MB)
            </label>

            <MediaUpload onUpload={(file) => setMedia(file)} />

            <button
              className="broadcastButton"
              disabled={loading}
              type="submit"
            >
              {loading ? "Publishing..." : "Publish Broadcast"}
            </button>
          </form>
        </div>
      </div>

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type || "confirm"}
          onConfirm={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}