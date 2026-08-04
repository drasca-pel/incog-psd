import React, {
  useEffect,
  useState,
} from "react";

import { NavLink } from "react-router-dom";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import useNotifications from "../hooks/useNotifications";

import "../styles/BottomNav.css";

export default function BottomNav() {

  // This comes ONLY from unread chats.
  const {
    chatNotifications,
  } = useNotifications();

  const [
    alertsCount,
    setAlertsCount,
  ] = useState(0);

  // =====================================================
  // ALERTS BADGE
  // =====================================================

  useEffect(() => {

    let unsubscribeAlerts = null;

    const unsubscribeAuth =
      auth.onAuthStateChanged((user) => {

        // Remove previous listener
        if (unsubscribeAlerts) {
          unsubscribeAlerts();
          unsubscribeAlerts = null;
        }

        // No user
        if (!user) {
          setAlertsCount(0);
          return;
        }

        // =================================================
        // ONLY LISTEN TO ALERTS
        // =================================================

        const alertsQuery = query(
          collection(db, "alerts"),
          where(
            "receiverId",
            "==",
            user.uid
          )
        );

        unsubscribeAlerts =
          onSnapshot(
            alertsQuery,
            (snapshot) => {

              // Every document in alerts represents
              // one pending broadcast alert.

              setAlertsCount(
                snapshot.size
              );
            },

            (error) => {

              console.error(
                "Alerts badge error:",
                error
              );

              setAlertsCount(0);
            }
          );
      });

    return () => {

      if (unsubscribeAlerts) {
        unsubscribeAlerts();
      }

      unsubscribeAuth();
    };

  }, []);

  // =====================================================
  // CHAT BADGE
  // =====================================================

  const chatUnreadCount =
    chatNotifications.reduce(
      (total, chat) =>
        total +
        (chat.unreadCount || 0),
      0
    );

  return (
    <nav className="bottomNav">

      {/* HOME */}

      <NavLink
        to="/dashboard"
        className="navItem"
      >
        <span className="navIcon">

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 11L12 3l9 8" />
            <path d="M5 10v10h14V10" />
          </svg>

        </span>

        <span>Home</span>
      </NavLink>


      {/* FEED */}

      <NavLink
        to="/feed"
        className="navItem"
      >
        <span className="navIcon">

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>

        </span>

        <span>Feed</span>
      </NavLink>


      {/* CREATE */}

      <NavLink
        to="/my-broadcasts"
        className="navCreate"
      >
        <span>+</span>
      </NavLink>


      {/* ALERTS */}

      <NavLink
        to="/alerts"
        className="navItem"
      >
        <span className="navIcon navIconWithBadge">

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
            <path d="M13 21h-2" />
          </svg>

          {/* ALERTS COUNT ONLY */}

          {alertsCount > 0 && (
            <span className="navBadge">
              {alertsCount > 9
                ? "9+"
                : alertsCount}
            </span>
          )}

        </span>

        <span>Alerts</span>
      </NavLink>


      {/* CHAT */}

      <NavLink
        to="/chat"
        className="navItem"
      >
        <span className="navIcon navIconWithBadge">

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.3 9.3 0 0 1-4-.9L3 21l1.9-4A8.5 8.5 0 1 1 21 11.5z" />
          </svg>

          {/* CHAT COUNT ONLY */}

          {chatUnreadCount > 0 && (
            <span className="navBadge">
              {chatUnreadCount > 9
                ? "9+"
                : chatUnreadCount}
            </span>
          )}

        </span>

        <span>Chat</span>
      </NavLink>

    </nav>
  );
}