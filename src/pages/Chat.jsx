import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectChats from "./DirectChats";
import Portfolio from "./Portfolio";
import "../styles/Chat.css";

export default function Chat() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("direct");

  return (
    <div className="chatPage">
      <button className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1>Chats</h1>

      <div className="chatTabs">
        <button
          className={activeTab === "direct" ? "activeTab" : ""}
          onClick={() => setActiveTab("direct")}
        >
          Direct
        </button>

        <button
          className={activeTab === "portfolio" ? "activeTab" : ""}
          onClick={() => setActiveTab("portfolio")}
        >
          Portfolio
        </button>
      </div>

      <div className="chatContent">
        {activeTab === "direct" && <DirectChats />}
        {activeTab === "portfolio" && <Portfolio />}
      </div>
    </div>
  );
}