import React, { useState } from "react";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import storage from "../firebase/storage";


export default function MediaUpload({ onUpload }) {

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");



  async function handleUpload(e) {

    const file = e.target.files[0];

    if (!file) return;


    setUploading(true);
    setFileName(file.name);


    try {

      const fileRef = ref(
        storage,
        `uploads/${Date.now()}-${file.name}`
      );


      await uploadBytes(
        fileRef,
        file
      );


      const url = await getDownloadURL(
        fileRef
      );


      onUpload({
        url,
        type: file.type,
        name: file.name
      });


    } catch(error) {

      alert(error.message);

    }


    setUploading(false);

  }



  return (

    <div>

      <input
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleUpload}
      />


      {
        uploading && (
          <p>
            Uploading...
          </p>
        )
      }


      {
        fileName && !uploading && (
          <p>
            Uploaded: {fileName}
          </p>
        )
      }


    </div>

  );

}