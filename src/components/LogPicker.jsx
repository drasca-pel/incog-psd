import react, { useEffect, useState } from "react";
import { getuserlogs, createlog, addreferencetolog } from "../utils/logsService";
import ConfirmModal from "./ConfirmModal";
import "../styles/LogPicker.css";

export default function logpicker({ message, chatId, onClose }) {
  const [logs, setlogs] = useState([]);
  const [loading, setloading] = useState(true);
  const [newlogname, setnewlogname] = useState("");
  const [creating, setcreating] = useState(false);
  const [successmodal, setsuccessmodal] = useState(false);

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

  async function handlesavetolog(logid) {
    try {
      await addreferencetolog(logid, message, chatId);
      setsuccessmodal(true);
    } catch (err) {
      console.error("error saving to log:", err);
    }
  }

  async function handlecreateandsave() {
    if (!newlogname.trim()) return;
    setcreating(true);
    try {
      const logid = await createlog(newlogname.trim());
      await addreferencetolog(logid, message, chatId);
      setsuccessmodal(true);
    } catch (err) {
      console.error("error creating log:", err);
    }
    setcreating(false);
  }

  return (
    <>
      <div className="logpickeroverlay" onClick={onClose}>
        <div className="logpickerbox" onClick={(e) => e.stopPropagation()}>
          <h3>add to log</h3>

          <div className="logcreaterow">
            <input
              type="text"
              placeholder="new log name"
              value={newlogname}
              onChange={(e) => setnewlogname(e.target.value)}
            />
            <button
              className="logcreatebtn"
              disabled={creating || !newlogname.trim()}
              onClick={handlecreateandsave}
            >
              create & save
            </button>
          </div>

          <div className="logdivider">or add to existing</div>

          <div className="loglist">
            {loading ? (
              <p className="logemptytext">loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="logemptytext">no logs yet — create one above.</p>
            ) : (
              logs.map((log) => (
                <button
                  key={log.id}
                  className="loglistitem"
                  onClick={() => handlesavetolog(log.id)}
                >
                  <span>{log.name}</span>
                  <span className="logitemcount">{log.itemCount || 0}</span>
                </button>
              ))
            )}
          </div>

          <button className="logcancelbtn" onClick={onClose}>cancel</button>
        </div>
      </div>

      <ConfirmModal
        isOpen={successmodal}
        title="saved"
        message="this item has been added to your log."
        confirmText="ok"
        type="info"
        onClose={() => {
          setsuccessmodal(false);
          onClose();
        }}
        onConfirm={() => {
          setsuccessmodal(false);
          onClose();
        }}
      />
    </>
  );
}