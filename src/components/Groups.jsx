import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Groups.css"; // Optional dedicated dark stylesheet or inline dark theme support

export default function Groups() {
  const navigate = useNavigate();
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group Deletion States
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "chats"),
        where("members", "array-contains", auth.currentUser.uid),
        where("isGroup", "==", true)
      );

      const snap = await getDocs(q);
      const groups = [];

      snap.forEach((docSnap) => {
        groups.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      setGroupChats(groups);
    } catch (error) {
      console.error("Error loading group chats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroup) return;

    try {
      await deleteDoc(doc(db, "chats", selectedGroup.id));
      setGroupChats(groupChats.filter((g) => g.id !== selectedGroup.id));
      setShowDeleteConfirm(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Unable to delete group.");
    }
  }

  if (loading) {
    return <div style={{ color: "#8b8f98", padding: "20px", textAlign: "center" }}>Loading groups...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {groupChats.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#8b8f98" }}>
          <h3 style={{ color: "#e5e5e5", marginBottom: "8px" }}>No Group Chats Yet</h3>
          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Create a group from any of your workspaces using the selection checkboxes to chat collectively with selected participants.
          </p>
        </div>
      ) : (
        groupChats.map((group) => {
          const hasUnread = group.lastSenderId && group.lastSenderId !== auth.currentUser?.uid && !group.readBy?.includes(auth.currentUser?.uid);

          return (
            <div
              key={group.id}
              onClick={() => navigate(`/chat/${group.id}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedGroup(group);
                setShowDeleteConfirm(true);
              }}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "16px",
                background: "#15171a",
                borderRadius: "14px",
                cursor: "pointer",
                border: "1px solid #24262b",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#1b1d21",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontSize: "18px",
                  color: "#fff",
                  position: "relative",
                  border: "1px solid #303238"
                }}
              >
                {group.projectTitle?.charAt(0).toUpperCase() || "G"}
                {hasUnread && (
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "12px",
                      height: "12px",
                      background: "#ff4d4d",
                      borderRadius: "50%",
                      border: "2px solid #15171a"
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#e5e5e5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {group.projectTitle || "Workspace Group"}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#8b8f98", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {group.lastMessage || "Tap to open group chat"}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGroup(group);
                  setShowDeleteConfirm(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8b8f98",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px"
                }}
                title="Delete Group"
              >
                ⋮
              </button>
            </div>
          );
        })
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Group Chat"
        message="Are you sure you want to delete this group chat? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteGroup}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
}