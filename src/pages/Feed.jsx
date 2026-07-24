import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import ConfirmModal from "../components/ConfirmModal";
import "../styles/Feed.css";


export default function Feed(){


  const navigate = useNavigate();


  const [posts,setPosts] = useState([]);

  const [lastDoc,setLastDoc] = useState(null);

  const [loading,setLoading] = useState(false);

  const [hasMore,setHasMore] = useState(true);

  const [expanded,setExpanded] = useState({});

  const [refreshing,setRefreshing] = useState(false);

  const [selectedPost,setSelectedPost] = useState(null);

  const [userData, setUserData] = useState(null);





  async function loadPosts(refresh=false){


    if(loading) return;



    setLoading(true);



    try{


      let q;



      if(refresh){


        q=query(

          collection(db,"feed"),

          orderBy(
            "createdAt",
            "desc"
          ),

          limit(10)

        );


      }

      else{


        q=query(

          collection(db,"feed"),

          orderBy(
            "createdAt",
            "desc"
          ),

          ...(lastDoc
          ?
          [startAfter(lastDoc)]
          :
          []),

          limit(10)

        );


      }




      const snap =
        await getDocs(q);



      const newPosts =
        snap.docs.map(item=>({

          id:item.id,

          ...item.data()

        }));





      const shuffled =
        [...newPosts].sort(
          ()=>Math.random()-0.5
        );





      if(refresh){


        setPosts(shuffled);


      }

      else{


        setPosts(prev=>{


          const combined=[

            ...prev,

            ...shuffled

          ];



          return Array.from(

            new Map(

              combined.map(
                post=>[
                  post.id,
                  post
                ]
              )

            ).values()

          );


        });


      }






      if(snap.empty){

        setHasMore(false);

      }

      else{


        setLastDoc(

          snap.docs[
            snap.docs.length-1
          ]

        );


      }



    }
    catch(error){

      console.log(error);

    }
    finally{

      setLoading(false);

      setRefreshing(false);

    }


  }








  useEffect(()=>{


    const loadUser = async () => {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (snap.exists()) {
        setUserData(snap.data());
      }
    };

    loadPosts();
    loadUser();



  },[]);








  useEffect(()=>{


    function scroll(){


      if(

        window.innerHeight +
        window.scrollY >=
        document.documentElement.scrollHeight-300

      ){

        if(hasMore)

        loadPosts();


      }


    }



    window.addEventListener(
      "scroll",
      scroll
    );


    return ()=>{

      window.removeEventListener(
        "scroll",
        scroll
      );

    };


  },[lastDoc,hasMore,loading]);









  async function refreshFeed(){


    setRefreshing(true);

    setLastDoc(null);

    setHasMore(true);

    await loadPosts(true);


  }









  async function deletePost(){


    if(!selectedPost)
    return;



    if(

      selectedPost.userId !==
      auth.currentUser.uid

    )
    return;



    await deleteDoc(

      doc(
        db,
        "feed",
        selectedPost.id
      )

    );



    setPosts(prev=>

      prev.filter(

        p=>
        p.id !== selectedPost.id

      )

    );


    setSelectedPost(null);


  }









  function toggleText(id){


    setExpanded(prev=>({

      ...prev,

      [id]:
      !prev[id]

    }));

  }









  return(

    <div className="feedPage">



      <div className="feedHeader">


        <button
        onClick={()=>navigate(-1)}
        className="backButton"
        >

        ←

        </button>



        <h1>
        INCOG Feed
        </h1>



        <button
        onClick={()=>navigate("/create-post")}
        >

        + Post

        </button>



      </div>





      <button

      className="refreshButton"

      onClick={refreshFeed}

      >

      {refreshing
      ?
      "Refreshing..."
      :
      "↻ Refresh Feed"}

      </button>









      <div className="feedContainer">


      {

      posts.map(post=>(


        <div

        className="feedCard"

        key={post.id}

        onContextMenu={(e)=>{


          e.preventDefault();


          if(

          post.userId ===
          auth.currentUser.uid

          ){

          setSelectedPost(post);

          }


        }}

        >






        <div className="feedUser">


        <div

        className="clickProfile"

        onClick={()=>navigate(

          `/profile/${post.userId}`

        )}
        style={{ cursor: "pointer", overflow: "hidden", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}

        >


        {post.userId === auth.currentUser.uid && userData?.photoURL ? (
          <img
            src={userData.photoURL}
            alt="profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ) : post.photoURL ? (
          <img
            src={post.photoURL}
            alt="profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ) : (
          <div
            className="feedAvatar"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {post.name?.charAt(0)?.toUpperCase()}
          </div>
        )}


        </div>




        <span>
        {post.name}
        </span>


        </div>







        <p>


        {

        expanded[post.id]

        ?

        post.text

        :

        post.text?.length > 150

        ?

        post.text.substring(0,150)+"..."

        :

        post.text

        }



        </p>





        {

        post.text?.length > 150 &&

        <button

        onClick={()=>toggleText(post.id)}

        >

        {
        expanded[post.id]
        ?
        "View Less"
        :
        "View More"
        }

        </button>

        }







        {

        post.mediaType==="image"

        &&

        <img

        className="feedMedia"

        src={post.mediaURL}

        alt="post"

        />

        }





        {

        post.mediaType==="video"

        &&

        <video

        className="feedMedia"

        src={post.mediaURL}

        controls

        />

        }




        </div>


      ))

      }



      </div>





      <ConfirmModal
        isOpen={Boolean(selectedPost)}
        title="Delete Post"
        message="Are you sure you want to delete this post?"
        confirmText="Delete"
        onClose={() => setSelectedPost(null)}
        onConfirm={deletePost}
        type="confirm"
      />





    </div>


  );

}