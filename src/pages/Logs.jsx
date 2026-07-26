import react, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getuserlogs, deletelog } from "../utils/logsService";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Logs.css";

export default function logs() {
  const navigate = useNavigate();
  const [logs, setlogs] = useState([]);
  const [loading, setloading] = useState(true);
  const [confirmmodal, setconfirmmodal] = useState(null);

  useEffect(() => {
    loadlogs();
  }, []);

  async function loadlogs() {
    try {
      const data = await getuserlogs();
      setlogs(data);
    } catch (err) {
      console.error("error loading logs:", err);
    }
    setloading(false);
  }

  function handledeletelog(log) {
    setconfirmmodal({
      title: "delete log?",
      message: `delete "${log.name}" and everything saved inside it?`,
      confirmText: "delete",
      type: "confirm",
      action: async () => {
        try {
          await deletelog(log.id);
          setlogs((prev) => prev.filter((l) => l.id !== log.id));
          setconfirmmodal(null);
        } catch (err) {
          console.error("error deleting log:", err);
          setconfirmmodal({
            title: "delete failed",
            message: "unable to delete this log. please try again.",
            confirmText: "ok",
            type: "info",
            action: () => setconfirmmodal(null),
          });
        }
      },
    });
  }

  return (
    <div className="logspage">
      <button className="backbutton" onClick={() => navigate(-1)}>←</button>
      <h1>my logs</h1>

      {loading ? (
        <p className="logsloading">loading...</p>
      ) : logs.length === 0 ? (
        <div className="emptystate">
          <h3>no logs yet</h3>
          <p>long-press any message, image, or video in chat to save it here.</p>
        </div>
      ) : (
        <div className="logsgrid">
          {logs.map((log) => (
            <div
              key={log.id}
              className="logcard"
              onClick={() => navigate(`/logs/${log.id}`)}
            >
              <div className="logcardicon">📁</div>
              <div className="logcardinfo">
                <h3>{log.name}</h3>
                <span>{log.itemCount || 0} items</span>
              </div>
              <button
                className="logdeletebtn"
                onClick={(e) => {
                  e.stopPropagation();
                  handledeletelog(log);
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmmodal && (
        <ConfirmModal
          isOpen={!!confirmmodal}
          title={confirmmodal.title}
          message={confirmmodal.message}
          confirmText={confirmmodal.confirmText}
          type={confirmmodal.type || "confirm"}
          onConfirm={confirmmodal.action}
          onClose={() => setconfirmmodal(null)}
        />
      )}
    </div>
  );
}