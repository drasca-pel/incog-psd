import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

import MediaUpload from "../components/MediaUpload";


export default function Feed(){

  const [text,setText] = useState("");
  const [media,setMedia] = useState(null);
  const [posts,setPosts] = useState([]);

  const [commentText,setCommentText] = useState({});
  const [comments,setComments] = useState({});


  useEffect(()=>{

    const q = query(
      collection(db,"posts"),
      orderBy("createdAt","desc")
    );


    const unsubscribe = onSnapshot(q,(snapshot)=>{

      setPosts(
        snapshot.docs.map(doc=>({
          id:doc.id,
          ...doc.data()
        }))
      );

    });


    return ()=>unsubscribe();

  },[]);



  async function createPost(e){

    e.preventDefault();


    if(!text && !media){
      alert("Add text or media");
      return;
    }


    await addDoc(
      collection(db,"posts"),
      {

        text,

        media,

        userId:
        auth.currentUser.uid,


        username:
        auth.currentUser.displayName ||
        "INCOG User",


        likes:[],


        createdAt:
        serverTimestamp()

      }
    );


    setText("");
    setMedia(null);

  }





  async function likePost(post){


    const ref = doc(
      db,
      "posts",
      post.id
    );


    const liked =
    post.likes?.includes(
      auth.currentUser.uid
    );


    await updateDoc(ref,{

      likes: liked

      ?

      arrayRemove(
        auth.currentUser.uid
      )

      :

      arrayUnion(
        auth.currentUser.uid
      )

    });

  }





  async function addComment(postId){


    if(!commentText[postId])
    return;



    await addDoc(

      collection(
        db,
        "posts",
        postId,
        "comments"
      ),

      {

        text:
        commentText[postId],


        username:
        auth.currentUser.displayName ||
        "INCOG User",


        createdAt:
        serverTimestamp()

      }

    );


    setCommentText({

      ...commentText,

      [postId]:""

    });

  }





  function sharePost(post){


    const url =
    window.location.origin +
    "/post/" +
    post.id;


    if(navigator.share){

      navigator.share({

        title:"INCOG Post",

        text:
        post.text,

        url

      });

    }

    else{

      navigator.clipboard.writeText(url);

      alert(
        "Post link copied"
      );

    }

  }





  return (

<div style={styles.page}>

<TopBar title="Feed"/>


<div style={styles.container}>


<div style={styles.card}>


<h3>
Create Post
</h3>


<form onSubmit={createPost}>


<textarea

placeholder="Share something..."

value={text}

onChange={
e=>setText(e.target.value)
}

style={styles.textarea}

/>


<MediaUpload

onUpload={
file=>setMedia(file)
}

/>


<button style={styles.button}>
Post
</button>


</form>


</div>





{
posts.map(post=>(


<div
key={post.id}
style={styles.card}
>


<h4>
👤 {post.username}
</h4>


<p>
{post.text}
</p>



{
post.media &&

post.media.type?.startsWith("image")

?

<img
src={post.media.url}
style={styles.media}
/>

:

post.media &&

<video
src={post.media.url}
controls
style={styles.media}
/>

}



<div style={styles.actions}>


<button
onClick={()=>likePost(post)}
>

❤️ {post.likes?.length || 0}

</button>


<button
onClick={()=>sharePost(post)}
>

↗ Share

</button>


</div>



<input

placeholder="Write comment..."

value={
commentText[post.id] || ""
}

onChange={
e=>
setCommentText({

...commentText,

[post.id]:
e.target.value

})
}

style={styles.input}

/>


<button

onClick={()=>
addComment(post.id)
}

>

Comment

</button>



</div>


))

}


</div>


</div>

);

}



const styles={

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
borderRadius:"15px",
marginBottom:"15px"
},

textarea:{
width:"100%",
height:"100px",
background:"#1F2937",
color:"white",
borderRadius:"10px",
padding:"10px"
},

input:{
width:"100%",
padding:"10px",
marginTop:"10px",
background:"#1F2937",
color:"white"
},

button:{
marginTop:"10px",
padding:"10px 20px",
borderRadius:"8px"
},

media:{
width:"100%",
borderRadius:"10px",
marginTop:"15px"
},

actions:{
display:"flex",
gap:"15px",
marginTop:"15px"
}

};