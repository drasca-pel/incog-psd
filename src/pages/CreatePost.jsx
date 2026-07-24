import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  uploadToCloudinary,
} from "../services/cloudinary";

import "../styles/CreatePost.css";


export default function CreatePost() {


  const navigate = useNavigate();


  const [text, setText] = useState("");

  const [file, setFile] = useState(null);

  const [preview, setPreview] = useState(null);

  const [uploading, setUploading] = useState(false);



  const MAX_SIZE = 30 * 1024 * 1024;




  function handleFileChange(e){


    const selectedFile =
      e.target.files[0];


    if(!selectedFile) return;




    if(selectedFile.size > MAX_SIZE){


      // Replace this later with your ConfirmModal

      alert(
        "Maximum upload size is 30MB"
      );


      e.target.value = "";

      return;

    }



    setFile(selectedFile);



    setPreview(
      URL.createObjectURL(selectedFile)
    );


  }





  function cancelPost(){


    setText("");

    setFile(null);

    setPreview(null);


  }






  async function publishPost(){


    if(!text.trim() && !file)
      return;



    try{


      setUploading(true);



      let mediaURL = null;

      let mediaType = null;




      if(file){


        const result =
          await uploadToCloudinary(file);



        mediaURL =
          result.url;



        mediaType =
          result.resourceType === "video"
          ?
          "video"
          :
          "image";


      }





      await addDoc(

        collection(
          db,
          "feed"
        ),

        {


          userId:
          auth.currentUser.uid,


          name:
          auth.currentUser.displayName ||
          "INCOG User",



          photoURL:
          auth.currentUser.photoURL ||
          null,



          text,



          mediaURL,



          mediaType,



          createdAt:
          serverTimestamp()


        }

      );





      setText("");

      setFile(null);

      setPreview(null);



      navigate("/feed");



    }
    catch(error){


      console.log(
        error
      );


    }
    finally{


      setUploading(false);


    }


  }







  return (

    <div className="createPostPage">


      <button

        className="backButton"

        onClick={() => navigate(-1)}

      >

        ←

      </button>




      <h1>
        Create Post
      </h1>





      <div className="createPostBox">





        <textarea

          placeholder="Share what you are building..."

          value={text}

          onChange={(e)=>
            setText(e.target.value)
          }

        />





        <p className="warningText">

          Review your post carefully before publishing.
          Make sure your write-up is correct before sharing.

        </p>







        <input

          type="file"

          accept="image/*,video/*"

          onChange={handleFileChange}

        />







        {
          preview &&

          (

            file.type.startsWith("video")

            ?

            <video

              src={preview}

              controls

              className="previewMedia"

            />

            :

            <img

              src={preview}

              alt="preview"

              className="previewMedia"

            />

          )

        }








        <div className="postActions">


          <button

            className="cancelButton"

            onClick={cancelPost}

          >

            Cancel

          </button>






          <button

            className="publishButton"

            onClick={publishPost}

            disabled={uploading}

          >

            {
              uploading
              ?
              "Publishing..."
              :
              "Publish"
            }


          </button>



        </div>





      </div>




    </div>

  );

}