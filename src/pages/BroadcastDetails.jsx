import React from "react";

export default function BroadcastDetails() {
  return (
    <div className="broadcastDetailsPage">

      <div className="broadcastDetailsCard">

        <h1>ESP32 Smart Irrigation System</h1>

        <p>
          <strong>Created by:</strong> Adeleye
        </p>

        <p>
          <strong>Broadcast Group:</strong> Embedded Systems
        </p>

        <p>
          <strong>Status:</strong> Active
        </p>

        <hr />

        <h3>Problem Description</h3>

        <p>
          This is where the full broadcast description will appear.
          Later, it will be loaded directly from Firebase.
        </p>

        <div className="broadcastButtons">

          <button className="acceptButton">
            Accept Problem
          </button>

          <button className="reportButton">
            Report
          </button>

        </div>

      </div>

    </div>
  );
}