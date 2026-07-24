import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { collection, getDocs, where, query, orderBy, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [userData, setUserData] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  useEffect(() => {
    const loadBroadcasts = async () => {
      try {
        const q = query(
          collection(db, "broadcasts"),
          where("creatorId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBroadcasts(data);
      } catch (err) {
        console.error("Error loading broadcasts:", err);
      }
    };

    const loadUser = async () => {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (snap.exists()) {
        setUserData(snap.data());
      }
    };

    loadBroadcasts();
    loadUser();
  }, []);

  return (
    <div className="dashboard">

      {/* Top Navigation */}
      <header className="topbar">

        <div className="logoSection">
          <div className="logoBox">I</div>

          <div>
            <h2>INCOG PSD</h2>
            <p>Professional Skills & Development</p>
          </div>
        </div>

        <div className="topActions">

          {/* Search */}
          <button className="iconButton">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Notifications */}
          <button
            className="iconButton notificationButton"
            onClick={() => {
              setModalTitle("Notifications");
              setModalMessage("Notification settings are coming soon.");
              setModalType("info");
              setModalOpen(true);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>

            <span className="notificationBadge"></span>
          </button>

          {/* Profile */}
          <div
            className="profileAvatar"
            onClick={() => navigate(`/profile/${auth.currentUser.uid}`)}
            style={{ cursor: "pointer", overflow: "hidden" }}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              auth.currentUser?.displayName?.charAt(0).toUpperCase() || "A"
            )}
          </div>

        </div>

      </header>

      <main className="dashboardContent">

        <section className="welcomeCard">

          <span className="welcomeLabel">
            Welcome Back
          </span>
            
          <h1>
            {auth.currentUser?.displayName || "INCOG User"}
          </h1>

          <p>
            Solve engineering problems, collaborate with professionals,
            and grow your technical portfolio with INCOG PSD.
          </p>

          <button
            className="primaryButton"
            onClick={() => navigate("/logs")}
          >
            Logs
          </button>

        </section>

        {/* ================= RECENT BROADCASTS ================= */}

        <section className="broadcastSection">

          <div className="sectionHeader">

            <h2>My Recent Broadcasts</h2>

            <button
              className="viewButton"
              onClick={() => navigate("/my-broadcasts")}
            >
              See All
            </button>

          </div>

          <div className="broadcastList">

            {broadcasts.length === 0 ? (

              <div className="emptyState">
                No broadcasts available.
              </div>

            ) : (

              broadcasts.slice(0, 2).map((broadcast) => (

                <div
                  className="broadcastCard"
                  key={broadcast.id}
                >

                  <div className="broadcastHeader">

                    <div className="broadcastAvatar">
                      {(broadcast.creatorName || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="broadcastInfo">

                      <h3>
                        {broadcast.title}
                      </h3>

                      <span>
                        {broadcast.targetSkills?.join(", ") || "General"}
                      </span>

                    </div>

                  </div>

                  <p className="broadcastDescription">
                    {broadcast.description}
                  </p>

                </div>

              ))

            )}

          </div>

        </section>

        {/* ================= RECENT CHATS ================= */}

        <section className="chatSection">

          <div className="sectionHeader">

            <h2>Recent Chats</h2>

            <button
              className="seeAllButton"
              onClick={() => navigate("/chat")}
            >
              Open Chat
            </button>

          </div>

          <div className="chatCard">

            <div className="chatAvatar">
              C
            </div>

            <div className="chatDetails">

              <h3>
                Continue Your Conversations
              </h3>

              <p>
                Your latest chats will appear here once you begin collaborating.
              </p>

            </div>

          </div>

        </section>

        {/* ================= ACTIVE PROJECTS ================= */}

        <section className="projectSection">

          <div className="sectionHeader">

            <h2>Active Projects</h2>

            <button
              className="seeAllButton"
              onClick={() => navigate("/portfolio")}
            >
              Portfolio
            </button>

          </div>

          <div className="projectCard">

            <h3>
              No Active Projects
            </h3>

            <p>
              Projects you accept and complete will appear here and can later be added to your portfolio.
            </p>

          </div>

        </section>

      </main>

      <ConfirmModal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />

    </div>
  );
}