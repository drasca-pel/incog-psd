import React, { useState, useEffect, useRef } from "react";

export default function MediaUpload({ onUpload, existingMedia = null }) {
  const [preview, setPreview] = useState(existingMedia);
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(existingMedia);
  }, [existingMedia]);

  // Clean up Object URLs when the preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview?.url && preview.url.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Maximum upload size is 25MB.");
      if (e.target) e.target.value = "";
      return;
    }

    // Revoke previous blob URL if replacing
    if (preview?.url && preview.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }

    const localPreview = {
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      file,
    };

    setPreview(localPreview);
    onUpload(localPreview);
  }

  function removeMedia() {
    if (preview?.url && preview.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    onUpload(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  // Helper to determine media type from object or URL string
  const isImage =
    preview?.type?.startsWith("image") ||
    (typeof preview?.url === "string" && preview.url.match(/\.(jpeg|jpg|gif|png|webp)/i));

  const isVideo =
    preview?.type?.startsWith("video") ||
    (typeof preview?.url === "string" && preview.url.match(/\.(mp4|webm|ogg|mov)/i));

  return (
    <div className="mediaUploadContainer">
      {preview ? (
        <div className="mediaPreviewCard">
          {isImage && (
            <img
              src={preview.url}
              alt="Preview"
              className="broadcastImage"
            />
          )}

          {isVideo && (
            <video
              src={preview.url}
              controls
              className="broadcastVideo"
            />
          )}

          {!isImage && !isVideo && (
            <div className="filePreview">
              📎 {preview.name || "Attachment"}
            </div>
          )}

          <div className="mediaActions">
            <label className="changeMediaBtn">
              Change Media
              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleChange}
              />
            </label>

            <button
              type="button"
              className="removeMediaBtn"
              onClick={removeMedia}
            >
              Remove Media
            </button>
          </div>
        </div>
      ) : (
        <label className="uploadMediaBtn">
          📎 Upload Attachment
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}