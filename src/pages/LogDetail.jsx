import react, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getlogitems, deletelogitem } from "../utils/logsService";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Logs.css";

export default function logdetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setitems] = useState([]);
  const [loading, setloading] = useState(true);
  const [confirmmodal, setconfirmmodal] = useState(null);

  useEffect(() => {
    loaditems();
  }, [id]);

  async function loaditems() {
    try {
      const data = await getlogitems(id);
      setitems(data);
    } catch (err) {
      console.error("error loading log items:", err);
    }
    setloading(false);
  }

  function handledeleteitem(item) {
    setconfirmmodal({
      title: "remove item?",
      message: "remove this item from the log?",
      confirmText: "remove",
      type: "confirm",
      action: async () => {
        try {
          await deletelogitem(item.id, id);
          setitems((prev) => prev.filter((i) => i.id !== item.id));
          setconfirmmodal(null);
        } catch (err) {
          console.error("error deleting log item:", err);
          setconfirmmodal({
            title: "removal failed",
            message: "unable to remove this item. please try again.",
            confirmText: "ok",
            type: "info",
            action: () => setconfirmmodal(null),
          });
        }
      },
    });
  }

  return (
    <div className="logdetailpage">
      <button className="backbutton" onClick={() => navigate(-1)}>←</button>
      <h1>log items</h1>

      {loading ? (
        <p className="logsloading">loading...</p>
      ) : items.length === 0 ? (
        <div className="emptystate">
          <h3>nothing saved yet</h3>
        </div>
      ) : (
        <div className="logitemslist">
          {items.map((item) => (
            <div key={item.id} className="logitemcard">
              <div className="logitemheader">
                <strong>{item.senderName}</strong>
                <button
                  className="logitemdeletebtn"
                  onClick={() => handledeleteitem(item)}
                >
                  🗑
                </button>
              </div>

              {item.type === "image" && item.mediaURL && (
                <img
                  src={item.mediaURL}
                  alt="saved"
                  className="logitemimage"
                  onClick={() => navigate(`/chat/${item.chatId}`)}
                />
              )}

              {item.type === "video" && item.mediaURL && (
                <video src={item.mediaURL} controls className="logitemvideo" />
              )}

              {item.text && <p className="logitemtext">{item.text}</p>}

              <button
                className="logitemjumpbtn"
                onClick={() => navigate(`/chat/${item.chatId}`)}
              >
                go to chat →
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