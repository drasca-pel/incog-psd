import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "../styles/Community.css";

export default function Community() {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    const loadUsers = async () => {

      try {

        const snapshot = await getDocs(
          collection(db, "users")
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(data);

      } catch(error) {

        console.error(
          "Error loading users:",
          error
        );

      }

    };


    loadUsers();

  }, []);


  return (

    <div className="communityPage">


      <header className="communityHeader">

        <h1>
          People You May Know
        </h1>

        <p>
          Connect with engineers and discover people with similar skills.
        </p>

      </header>



      <section className="peopleSection">


        {users.length === 0 ? (

          <div className="emptyState">
            No engineers found yet.
          </div>

        ) : (


          users.map((user) => (

            <div
              className="peopleCard"
              key={user.id}
            >


              <div className="personAvatar">

                {(user.name || "U")
                  .charAt(0)
                  .toUpperCase()}

              </div>



              <div className="personInfo">


                <h3>
                  {user.name || "INCOG User"}
                </h3>


                <span>
                  {user.skills?.join(" • ") || "Engineering"}
                </span>



                <button className="connectButton">
                  Connect
                </button>


              </div>


            </div>

          ))

        )}


      </section>


    </div>

  );

}