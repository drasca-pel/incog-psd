import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);

useEffect(() => {
  const loadBroadcasts = async () => {
    try {
      const q = query(
        collection(db, "broadcasts"),
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

  loadBroadcasts();
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
          <button className="iconButton notificationButton">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>

            <span className="notificationBadge"></span>
          </button>

          {/* Profile */}
          <div className="profileAvatar">
            A
          </div>

        </div>

      </header>

      <main className="dashboardContent">

        <section className="welcomeCard">

          <span className="welcomeLabel">
            Welcome Back
          </span>

          <h1>
            Adeleye
          </h1>

          <p>
            Solve engineering problems, collaborate with professionals,
            and grow your technical portfolio with INCOG PSD.
          </p>

        <button
  className="primaryButton"
  onClick={() => navigate("/community")}
>
  Explore Community
</button>

       </section>

{/* ================= RECENT BROADCASTS ================= */}

<section className="broadcastSection">

  <div className="sectionHeader">

    <h2>Recent Broadcasts</h2>

    <button className="seeAllButton">
      See All
    </button>

  </div>

  <div className="broadcastList">

    {broadcasts.length === 0 ? (

      <div className="emptyState">
        No broadcasts available.
      </div>

    ) : (

      broadcasts.map((broadcast) => (

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

          <div className="broadcastFooter">

            <button className="acceptButton">
              Accept
            </button>

            <button className="viewButton">
              Details
            </button>

          </div>

        </div>

      ))

    )}

  </div>

</section>
{/* ================= RECENT CHATS ================= */}

<section className="chatSection">

  <div className="sectionHeader">

    <h2>Recent Chats</h2>

    <button className="seeAllButton">
      Open Chat
    </button>

  </div>

  <div className="chatCard">

    <div className="chatAvatar">
      C
    </div>

    <div className="chatDetails">

      <h3>
        No active conversations
      </h3>

      <p>
        Accepted broadcasts will appear here.
      </p>

    </div>

  </div>

</section>
{/* ================= ACTIVE PROJECTS ================= */}

<section className="projectSection">

  <div className="sectionHeader">

    <h2>Active Projects</h2>

    <button className="seeAllButton">
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
    </div>
  );
}