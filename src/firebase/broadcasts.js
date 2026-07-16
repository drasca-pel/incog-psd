import React, { useState } from "react";
import { auth, db } from "../firebase/firebase";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

import TopBar from "../components/TopBar";
import MediaUpload from "../components/MediaUpload";


export default function Broadcast(){

  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");
  const [skill,setSkill] = useState("");
  const [media,setMedia] = useState(null);

  const [loading,setLoading] = useState(false);



  async function createBroadcast(e){

    e.preventDefault();


    if(!title || !description || !skill){

      alert("Fill all required fields");
      return;

    }


    setLoading(true);


    try{


      // Check active broadcast limit

      const q = query(

        collection(db,"broadcasts"),

        where(
          "creatorId",
          "==",
          auth.currentUser.uid
        ),

        where(
          "status",
          "==",
          "active"
        )

      );


      const existing = await getDocs(q);



      if(existing.size >= 3){

        alert(
          "You already have 3 active broadcasts. Complete one before creating another."
        );

        setLoading(false);
        return;

      }



      await addDoc(

        collection(db,"broadcasts"),

        {

          creatorId:
          auth.currentUser.uid,


          creatorName:
          auth.currentUser.displayName ||
          "INCOG User",


          title,


          description,


          targetSkills:[
            skill
          ],


          media: media || null,


          status:"active",


          createdAt:
          serverTimestamp(),


          lastReminderAt:
          serverTimestamp(),


          reminderCount:0

        }

      );



      alert("Broadcast created successfully");



      setTitle("");
      setDescription("");
      setSkill("");
      setMedia(null);



    }catch(error){

      alert(error.message);

    }


    setLoading(false);

  }




  return(

    <div style={styles.page}>


      <TopBar title="Broadcast"/>


      <div style={styles.container}>


        <div style={styles.card}>


          <h2>
            📢 Create Broadcast
          </h2>



          <form onSubmit={createBroadcast}>


            <input

              placeholder="What do you need?"

              value={title}

              onChange={
                e=>setTitle(e.target.value)
              }

              style={styles.input}

            />



            <textarea

              placeholder="Explain your problem..."

              value={description}

              onChange={
                e=>setDescription(e.target.value)
              }

              style={styles.textarea}

            />



            <input

              placeholder="Required skill"

              value={skill}

              onChange={
                e=>setSkill(e.target.value)
              }

              style={styles.input}

            />



            <h4>
              Attachment
            </h4>


            <MediaUpload

              onUpload={(file)=>setMedia(file)}

            />



            <button

              disabled={loading}

              style={styles.button}

            >

              {
                loading
                ? "Posting..."
                : "Broadcast"
              }

            </button>



          </form>


        </div>


      </div>


    </div>

  );

}



const styles = {

page:{
minHeight:"100vh",
background:"#0B1120",
color:"white",
paddingBottom:"90px"
},


container:{
padding:"15px"
},


card:{
background:"#111827",
padding:"20px",
borderRadius:"15px"
},


input:{
width:"100%",
padding:"12px",
marginBottom:"15px",
background:"#1F2937",
border:"none",
borderRadius:"8px",
color:"white"
},


textarea:{
width:"100%",
height:"120px",
padding:"12px",
marginBottom:"15px",
background:"#1F2937",
border:"none",
borderRadius:"8px",
color:"white"
},


button:{
background:"#38BDF8",
border:"none",
padding:"12px 25px",
borderRadius:"10px",
marginTop:"15px",
cursor:"pointer"
}

};