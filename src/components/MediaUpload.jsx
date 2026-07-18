import React, { useState } from "react";

export default function MediaUpload({

  onUpload,

  existingMedia = null,

}) {

  const [preview, setPreview] =
    useState(existingMedia);

  const [uploading, setUploading] =
    useState(false);

  function handleChange(e) {

    const file = e.target.files[0];

    if (!file) return;

    // 25MB limit
    if (file.size > 25 * 1024 * 1024) {

      alert(
        "Maximum upload size is 25MB."
      );

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

    onUpload({

      removed: true,

    });

  }

  return (

    <div className="mediaUpload">

      {preview && (

        <div className="mediaPreview">

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

              <a

                href={preview.url}

                target="_blank"

                rel="noreferrer"

              >

                📎 {preview.name}

              </a>

          )}

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "10px",
            }}
          >

            <label className="broadcastButton">

              Change

              <input

                type="file"

                accept="image/*,video/*,.pdf,.doc,.docx"

                hidden

                onChange={handleChange}

              />

            </label>

            <button

              type="button"

              className="createVocalsButton"

              onClick={removeMedia}

            >

              Remove

            </button>

          </div>

        </div>

      )}

      {!preview && (

        <label className="broadcastButton">

          Upload Attachment

          <input

            type="file"

            accept="image/*,video/*,.pdf,.doc,.docx"

            hidden

            onChange={handleChange}

          />

        </label>

      )}

      {uploading && (

        <p>Uploading...</p>

      )}

    </div>

  );

}