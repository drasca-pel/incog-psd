import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";

import {
  collection,
  query,
  where,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import "../styles/MyBroadcasts.css";

export default function MyBroadcasts() {
  const navigate = useNavigate();

 const [activeTab, setActiveTab] = useState("active");
const [broadcasts, setBroadcasts] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedImage, setSelectedImage] = useState(null);
const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
  loadBroadcasts();
}, []);

async function loadBroadcasts() {
  try {
    const q = query(
      collection(db, "broadcasts"),
      where("creatorId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBroadcasts(data);
  } catch (error) {
  console.error(error);
  alert("Something went wrong. Please try again.");
  }

  setLoading(false);
}
  
    const handleDelete = async (id) => {
  setConfirmModal({
  title: "Delete Broadcast?",
  message: "Are you sure you want to delete this broadcast?",
  confirmText: "Delete",
  action: async () => {
    try {
      await deleteDoc(doc(db, "broadcasts", id));

      const alertsQuery = query(
        collection(db, "alerts"),
        where("broadcastId", "==", id)
      );

      const alertsSnapshot = await getDocs(alertsQuery);

      for (const alertDoc of alertsSnapshot.docs) {
        await deleteDoc(alertDoc.ref);
      }

      setBroadcasts((prev) =>
        prev.filter((broadcast) => broadcast.id !== id)
      );

      setConfirmModal(null);

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  },
});

return;
  try {
    await deleteDoc(doc(db, "broadcasts", id));
    const alertsQuery = query(
  collection(db, "alerts"),
  where("broadcastId", "==", id)
);

const alertsSnapshot = await getDocs(alertsQuery);

for (const alertDoc of alertsSnapshot.docs) {
  await deleteDoc(alertDoc.ref);
}
   
    setBroadcasts((prev) =>
      prev.filter((broadcast) => broadcast.id !== id)
    );

    alert("Broadcast deleted successfully.");
  } catch (error) {
   console.error(error);
alert(error.message);
  }
};

      async function completeProject(broadcast) {
    setConfirmModal({
  title: "Complete Project?",
  message: "This will archive the chats and close this project.",
  confirmText: "Complete",
  action: async () => {

    try {

      await updateDoc(
        doc(db, "broadcasts", broadcast.id),
        {
          status: "completed",
          archived: true,
          completedAt: serverTimestamp(),
        }
      );

      setBroadcasts((prev) =>
        prev.map((item) =>
          item.id === broadcast.id
            ? {
                ...item,
                status: "completed",
                archived: true,
              }
            : item
        )
      );

      setConfirmModal(null);

    } catch (error) {
      console.error(error);
      alert("Unable to complete project.");
    }

  },
});

return;

    try {
      // We'll add the Firestore updates here in the next step.
     await updateDoc(
    doc(db, "broadcasts", broadcast.id),
    {
      status: "completed",
      archived: true,
      completedAt: serverTimestamp(),
    }
  ); 
    // todo: Archive Workspace
// This will later move:
// 1. Direct Chats
// 2. Project Group
// into the Portfolio Workspace.

console.log(
  "Archiving Workspace for:",
  broadcast.id,
  broadcast.title
);
  const alertsQuery = query(
    collection(db, "alerts"),
    where("broadcastId", "==", broadcast.id)
  );

  const alertsSnapshot = await getDocs(alertsQuery);

  for (const alertDoc of alertsSnapshot.docs) {
    await deleteDoc(alertDoc.ref);
  }

  await addDoc(collection(db, "portfolio"), {
    projectId: broadcast.id,
    title: broadcast.title,
    description: broadcast.description,
    group: broadcast.targetSkills?.[0] || "",
    ownerId: auth.currentUser.uid,

    directChats: [],
    groupChat: null,

    createdAt: serverTimestamp(),
  });

  setBroadcasts((prev) =>
    prev.map((item) =>
      item.id === broadcast.id
        ? {
            ...item,
            status: "completed",
          }
        : item
    )
  );

  alert("project completed successfully.");
    }catch (error) {
    console.error(error);
    alert("unable to complete project.");
  }
  }
  return (
    <div className="myBroadcastsPage">

      <h1 className="pageTitle">My Broadcasts</h1>

      <div className="tabsContainer">

        <button
          className={`tabButton ${activeTab === "active" ? "activeTab" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>

        <button
          className={`tabButton ${activeTab === "progress" ? "activeTab" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          In Progress
        </button>

        <button
          className={`tabButton ${activeTab === "completed" ? "activeTab" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>

      </div>

      <div className="broadcastContent">

       {activeTab === "active" && (
  <div>
    {broadcasts
      .filter((broadcast) => broadcast.status === "active")
      .map((broadcast) => (
       <div key={broadcast.id} className="broadcastCard">
  <h3>{broadcast.title}</h3>

<p className="broadcastGroup">
  {broadcast.targetSkills?.[0]}
</p>

<p>{broadcast.description}</p>

       {broadcast.media && (
  <>
    {broadcast.media.type?.startsWith("image") && (
      <img
  src={broadcast.media.url}
  alt={broadcast.media.name}
  className="broadcastImage"
  onClick={() => setSelectedImage(broadcast.media.url)}
/>
    )}

    {broadcast.media.type?.startsWith("video") && (
      <video
        src={broadcast.media.url}
        controls
        className="broadcastVideo"
      />
    )}

    {!broadcast.media.type?.startsWith("image") &&
      !broadcast.media.type?.startsWith("video") && (
        <a
          href={broadcast.media.url}
          target="_blank"
          rel="noreferrer"
        >
          📎 {broadcast.media.name}
        </a>
      )}
  </>
)}

  <span className="statusBadge">Active</span>

  <div className="broadcastActions">
    <button
      className="editButton"
      onClick={() => navigate(`/edit-broadcast/${broadcast.id}`)}
    >
      Edit
    </button>

    <button
      className="deleteButton"
      onClick={() => handleDelete(broadcast.id)}
    >
      Delete
    </button>
  </div>
</div>
      ))}

    {broadcasts.filter((broadcast) => broadcast.status === "active").length === 0 && (
      <div className="emptyState">
        <h2>No Active Broadcasts</h2>
        <p>Your active broadcasts will appear here.</p>
      </div>
    )}
  </div>
)}

       {activeTab === "progress" && (
  <div>
    {broadcasts
      .filter((broadcast) => broadcast.status === "in_progress")
      .map((broadcast) => (
        <div key={broadcast.id} className="broadcastCard">
  <h3>{broadcast.title}</h3>

<p className="broadcastGroup">
  {broadcast.targetSkills?.[0]}
</p>

<p>{broadcast.description}</p>

  <span className="statusBadge">
    In Progress
  </span>

  <div className="broadcastActions">

    <button
      className="editButton"
      onClick={() =>
        navigate(`/interested-candidates/${broadcast.id}`)
      }
    >
      View Interested Candidates
    </button>

   <button
    className="deleteButton"
    onClick={() => completeProject(broadcast)}
  >
    Complete Project
  </button>

  </div>

</div>
      ))}

    {broadcasts.filter((broadcast) => broadcast.status === "in_progress").length === 0 && (
      <div className="emptyState">
        <h2>No Broadcasts In Progress</h2>
        <p>Broadcasts being worked on will appear here.</p>
      </div>
    )}
  </div>
)}

       {activeTab === "completed" && (
    <div>

      {broadcasts
        .filter((broadcast) => broadcast.status === "completed")
        .map((broadcast) => (

          <div key={broadcast.id} className="broadcastCard">

            <h3>{broadcast.title}</h3>

            <p className="broadcastGroup">
              {broadcast.targetSkills?.[0]}
            </p>

            <p>{broadcast.description}</p>

            <span className="statusBadge">
              Completed
            </span>

            <div className="broadcastActions">

              <button
                className="editButton"
                onClick={() =>
                  navigate(`/portfolio/${broadcast.id}`)
                }
              >
                View Portfolio
              </button>

            </div>

          </div>

        ))}

      {broadcasts.filter(
        (broadcast) => broadcast.status === "completed"
      ).length === 0 && (

        <div className="emptyState">
          <h2>No Completed Broadcasts</h2>
          <p>Your completed broadcasts will appear here.</p>
        </div>

      )}

    </div>
  )}

        {/* Create Broadcast Card */}
        <div className="createBroadcastCard" onClick={() => navigate("/broadcast")}>
            <div className="plusIcon">+</div>
            <h3>Create a New Broadcast</h3>
        </div>
        {selectedImage && (
  <div className="imageViewer">
    <button
      className="imageBackButton"
      onClick={() => setSelectedImage(null)}
    >
      ←
    </button>

    <img
      src={selectedImage}
      alt="Full View"
      className="imageViewerImg"
    />
  </div>
)}

      </div>
           {confirmModal && (
  <ConfirmModal
    title={confirmModal.title}
    message={confirmModal.message}
    confirmText={confirmModal.confirmText}
    onConfirm={confirmModal.action}
    onCancel={() => setConfirmModal(null)}
  />
)}

    </div>
  );
}