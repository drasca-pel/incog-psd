import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectChats from "./DirectChats";
import "../styles/Chat.css";

export default function Chat() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="chatPage">
      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>Chats</h1>

      <div className="chatSearchBar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or skill..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="chatSearchClear" onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
      </div>

      <div className="chatContent">
        <DirectChats searchTerm={searchTerm} />
      </div>
    </div>
  );
}