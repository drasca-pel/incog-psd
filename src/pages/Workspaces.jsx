import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

import "../styles/Workspaces.css";

export default function Workspaces() {

  const navigate = useNavigate();

  // Temporary data
  const [workspaces, setWorkspaces] = useState([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const deleteWorkspace = () => {

    setWorkspaces((prev) =>
      prev.filter((w) => w.id !== selectedWorkspace.id)
    );

    setShowDelete(false);
    setSelectedWorkspace(null);

  };

  return (
    <div className="workspacePage">

      {workspaces.length === 0 ? (

        <div className="workspaceEmpty">

          <div className="workspaceIcon">
            📁
          </div>

          <h2>No Workspaces Yet</h2>

          <p>
            Every broadcast you create and begin working on
            will automatically create a workspace here.
          </p>

        </div>

      ) : (

        workspaces.map((workspace) => (

          <div
            key={workspace.id}
            className="workspaceCard"
            onClick={() =>
              navigate(`/workspace/${workspace.id}`)
            }
            onContextMenu={(e) => {

              e.preventDefault();

              setSelectedWorkspace(workspace);

              setShowDelete(true);

            }}
          >

            <div className="workspaceHeader">

              <div className="workspaceFolder">
                📁
              </div>

              <div>

                <h3>{workspace.title}</h3>

                <small>
                  {workspace.members.length} Participants
                </small>

              </div>

            </div>

            <div className="workspaceFooter">

              <span>
                Last activity:
              </span>

              <span>
                {workspace.updatedAt}
              </span>

            </div>

          </div>

        ))

      )}

      <ConfirmModal

        isOpen={showDelete}

        title="Delete Workspace"

        message="Delete this workspace permanently?"

        confirmText="Delete"

        onConfirm={deleteWorkspace}

        onClose={() => {

          setShowDelete(false);

          setSelectedWorkspace(null);

        }}

      />

    </div>
  );
}