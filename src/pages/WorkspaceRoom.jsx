import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  updateDoc,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/WorkspaceRoom.css";

export default function WorkspaceRoom() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  // Group Creation Selection States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedCandidateUids, setSelectedCandidateUids] = useState({});

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    try {
      const snap = await getDoc(doc(db, "workspaces", id));
      if (snap.exists()) {
        const data = snap.data();
        setWorkspace(data);
        setParticipants(data.participants || []);
        
        // Default select all candidates initially when opening modal
        const initialSelection = {};
        (data.participants || []).forEach(p => {
          initialSelection[p.uid] = true;
        });
        setSelectedCandidateUids(initialSelection);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function removeParticipant() {
    try {
      await updateDoc(doc(db, "workspaces", id), {
        participants: arrayRemove(selectedUser),
      });
      setParticipants(participants.filter((x) => x.uid !== selectedUser.uid));
      setShowDelete(false);
    } catch (error) {
      console.error(error);
    }
  }

  const toggleCandidateSelection = (uid) => {
    setSelectedCandidateUids(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  async function handleCreateGroupConfirm() {
    try {
      // Filter participants based on what you checked/selected
      const chosenParticipants = participants.filter(p => selectedCandidateUids[p.uid]);

      if (chosenParticipants.length === 0) {
        alert("Please select at least one candidate for the group.");
        return;
      }

      setShowGroupModal(false);

      // Gather member UIDs
      const memberUids = chosenParticipants.map((p) => p.uid);
      if (workspace?.creatorId && !memberUids.includes(workspace.creatorId)) {
        memberUids.push(workspace.creatorId);
      }

      // Create new group chat document
      const newGroupChatRef = await addDoc(collection(db, "chats"), {
        isGroup: true,
        workspaceId: id,
        projectId: workspace.broadcastId,
        projectTitle: workspace.title,
        projectSkill: workspace.group || "",
        
        ownerId: workspace.creatorId,
        ownerName: workspace.creatorName,

        members: memberUids,
        participants: chosenParticipants,

        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Group created",
        lastMessageAt: serverTimestamp(),
      });

      navigate(`/chat/${newGroupChatRef.id}`);
    } catch (error) {
      console.error(error);
      alert("Unable to create group chat.");
    }
  }

  return (
    <div className="workspaceRoom">
      <div className="workspaceTop">
        <button className="backButton" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>{workspace?.title || "Workspace"}</h2>
        <button className="groupButton" onClick={() => setShowGroupModal(true)}>
          + Create Group
        </button>
      </div>

      <div className="workspaceMembers">
        {participants.length === 0 ? (
          <div className="emptyWorkspace">
            <h3>No Participants Yet</h3>
            <p>Participants will automatically appear here after you create chats with interested candidates.</p>
          </div>
        ) : (
          participants.map((user) => (
            <div
              key={user.uid}
              className="memberCard"
              onClick={() => navigate(`/chat/${user.uid}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedUser(user);
                setShowDelete(true);
              }}
            >
              <div className="memberAvatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="memberProfileImage" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="memberInfo">
                <h3>{user.name}</h3>
                <p>Tap to continue chatting</p>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showDelete}
        title="Remove Participant"
        message="Remove this participant from this workspace?"
        confirmText="Remove"
        onConfirm={removeParticipant}
        onClose={() => setShowDelete(false)}
      />

      {/* Custom Selection Modal for Group Creation */}
      {showGroupModal && (
        <div className="messageMenuOverlay">
          <div className="messageMenu" style={{ width: "320px", maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Create Group</h3>
            <p style={{ fontSize: "13px", color: "#8b8f98", marginBottom: "10px" }}>
              Select candidates to add to this group chat:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "10px 0" }}>
              {participants.map((user) => (
                <label 
                  key={user.uid} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    background: "#1c1e22", 
                    padding: "10px", 
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedCandidateUids[user.uid]}
                    onChange={() => toggleCandidateSelection(user.uid)}
                    style={{ accentColor: "#e5e5e5", width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "14px", color: "#fff" }}>{user.name}</span>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                style={{ flex: 1, background: "#24272c", color: "#8b8f98", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupConfirm}
                style={{ flex: 1, background: "#e5e5e5", color: "#111", fontWeight: "600", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}