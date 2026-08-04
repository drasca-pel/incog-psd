import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { uploadToCloudinary } from "../services/cloudinary";
import "../styles/CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const MAX_SIZE = 30 * 1024 * 1024; // 30MB limit

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_SIZE) {
      alert("Maximum upload size is 30MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  function cancelPost() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setText("");
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function publishPost() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("You must be logged in to create a post.");
      return;
    }

    if (!text.trim() && !file) {
      return;
    }

    try {
      setUploading(true);

      let mediaURL = null;
      let mediaType = null;

      if (file) {
        const result = await uploadToCloudinary(file);
        mediaURL = result.url;
        mediaType = result.resourceType === "video" ? "video" : "image";
      }

      await addDoc(collection(db, "feed"), {
        userId: currentUser.uid,
        name: currentUser.displayName || "INCOG User",
        photoURL: currentUser.photoURL || null,
        text: text.trim(),
        mediaURL,
        mediaType,
        createdAt: serverTimestamp(),
      });

      cancelPost();
      navigate("/feed");
    } catch (error) {
      console.error("Failed to publish post:", error);
      alert("Failed to publish post. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="createPostPage">
      <button
        className="backButton"
        onClick={() => navigate(-1)}
        disabled={uploading}
      >
        ←
      </button>

      <h1>Create Post</h1>

      <div className="createPostBox">
        <textarea
          placeholder="Share what you are building..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={uploading}
        />

        <p className="warningText">
          Review your post carefully before publishing. Make sure your write-up
          is correct before sharing.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {preview &&
          (file?.type.startsWith("video") ? (
            <video src={preview} controls className="previewMedia" />
          ) : (
            <img src={preview} alt="preview" className="previewMedia" />
          ))}

        <div className="postActions">
          <button
            className="cancelButton"
            onClick={cancelPost}
            disabled={uploading}
          >
            Cancel
          </button>

          <button
            className="publishButton"
            onClick={publishPost}
            disabled={uploading || (!text.trim() && !file)}
          >
            {uploading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}