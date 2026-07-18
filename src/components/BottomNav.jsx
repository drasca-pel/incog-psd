import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {

  return (
    <nav className="bottomNav">

      <NavLink to="/dashboard" className="navItem">

        <span className="navIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11L12 3l9 8"/>
            <path d="M5 10v10h14V10"/>
          </svg>
        </span>

        <span>
          Home
        </span>

      </NavLink>


      <NavLink to="/feed" className="navItem">

        <span className="navIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16"/>
            <path d="M4 12h16"/>
            <path d="M4 18h16"/>
          </svg>
        </span>

        <span>
          Feed
        </span>

      </NavLink>


      <NavLink to="/my-broadcasts" className="navCreate">

        <span>
          +
        </span>

      </NavLink>


      <NavLink to="/alerts" className="navItem">

        <span className="navIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/>
            <path d="M13 21h-2"/>
          </svg>
        </span>

        <span>
          Alerts
        </span>

      </NavLink>


      <NavLink to="/chat" className="navItem">

        <span className="navIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.3 9.3 0 0 1-4-.9L3 21l1.9-4A8.5 8.5 0 1 1 21 11.5z"/>
          </svg>
        </span>

        <span>
          Chat
        </span>

      </NavLink>

    </nav>
  );
}