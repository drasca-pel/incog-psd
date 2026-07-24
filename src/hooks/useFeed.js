import {
  useState,
  useEffect,
  useCallback
} from "react";

import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
} from "firebase/firestore";

import { db } from "../firebase/firebase";


export default function useFeed() {

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);

  const [hasMore, setHasMore] = useState(true);



  const loadPosts = useCallback(async () => {

    if (loading || !hasMore) return;


    setLoading(true);


    try {


      let q;


      if (lastDoc) {

        q = query(

          collection(db, "feed"),

          orderBy(
            "createdAt",
            "desc"
          ),

          startAfter(lastDoc),

          limit(20)

        );


      } else {


        q = query(

          collection(db, "feed"),

          orderBy(
            "createdAt",
            "desc"
          ),

          limit(20)

        );


      }



      const snapshot =
        await getDocs(q);



      const newPosts =
        snapshot.docs.map(doc => ({

          id: doc.id,

          ...doc.data()

        }));



      if(snapshot.empty){

        setHasMore(false);

      }



      setPosts(prev => {


        const combined = [

          ...prev,

          ...newPosts

        ];


        // shuffle feed slightly

        return combined.sort(
          () => Math.random() - 0.5
        );


      });



      setLastDoc(
        snapshot.docs[
          snapshot.docs.length - 1
        ]
      );



    } catch(error){

      console.log(
        "Feed error:",
        error
      );

    }



    setLoading(false);



  },[
    loading,
    hasMore,
    lastDoc
  ]);




  useEffect(()=>{

    loadPosts();

  },[]);



  return {

    posts,

    loading,

    hasMore,

    loadPosts

  };

}