import React, { useState, useEffect } from "react";

export default function MediaUpload({
  onUpload,
  existingMedia = null,
}) {
  const [preview, setPreview] = useState(existingMedia);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(existingMedia);
  }, [existingMedia]);

  function handleChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Maximum upload size is 25MB.");
      return;
    }

    setUploading(true);

    const localPreview = {
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      file,
    };

    setPreview(localPreview);

    onUpload(localPreview);

    setUploading(false);
  }

  function removeMedia() {
    setPreview(null);

    onUpload(null);
  }

  return (
    <div className="mediaUploadContainer">

      {preview ? (
        <div className="mediaPreviewCard">

          {preview.type?.startsWith("image") && (
            <img
              src={preview.url}
              alt="Preview"
              className="broadcastImage"
            />
          )}

          {preview.type?.startsWith("video") && (
            <video
              src={preview.url}
              controls
              className="broadcastVideo"
            />
          )}

          {!preview.type?.startsWith("image") &&
            !preview.type?.startsWith("video") && (
              <div className="filePreview">
                📎 {preview.name}
              </div>
          )}

          <div className="mediaActions">

            <label className="changeMediaBtn">
              Change Media
              <input
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
            hidden
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleChange}
          />

        </label>

      )}

      {uploading && (
        <p className="uploadingText">
          Uploading...
        </p>
      )}

    </div>
  );
}