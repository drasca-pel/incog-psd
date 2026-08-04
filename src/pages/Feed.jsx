import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { auth, db } from "../firebase/firebase";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Feed.css";

export default function Feed() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userData, setUserData] = useState(null);

  // Touch state for Pull-to-Refresh
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 70;

  const currentUserId = auth.currentUser?.uid;

  const loadPosts = useCallback(
    async (refresh = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const postsRef = collection(db, "feed");
        let q;

        if (refresh || !lastDoc) {
          q = query(postsRef, orderBy("createdAt", "desc"), limit(10));
        } else {
          q = query(
            postsRef,
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(10)
          );
        }

        const snap = await getDocs(q);
        const newPosts = snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        if (refresh) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => {
            const combined = [...prev, ...newPosts];
            return Array.from(
              new Map(combined.map((post) => [post.id, post])).values()
            );
          });
        }

        if (snap.empty || snap.docs.length < 10) {
          setHasMore(false);
        } else {
          setLastDoc(snap.docs[snap.docs.length - 1]);
        }
      } catch (error) {
        console.error("Error loading feed:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lastDoc, loading]
  );

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUserId) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUserId));
        if (snap.exists()) {
          setUserData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    loadPosts(true);
    loadUser();
  }, [currentUserId]);

  useEffect(() => {
    function handleScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 300 &&
        hasMore &&
        !loading
      ) {
        loadPosts();
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadPosts]);

  async function refreshFeed() {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    await loadPosts(true);
  }

  // Touch handlers for Pull-to-Refresh
  function handleTouchStart(e) {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  }

  function handleTouchMove(e) {
    if (startY === 0 || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      const resistanceDistance = Math.min(distance * 0.5, 100);
      setPullDistance(resistanceDistance);
    }
  }

  async function handleTouchEnd() {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      await refreshFeed();
    }
    setStartY(0);
    setPullDistance(0);
  }

  async function deletePost() {
    if (!selectedPost || selectedPost.userId !== currentUserId) return;

    try {
      await deleteDoc(doc(db, "feed", selectedPost.id));
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setSelectedPost(null);
    }
  }

  function toggleText(id) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="feedPage">
      <div className="feedHeader">
        <button onClick={() => navigate(-1)} className="backButton">
          ←
        </button>
        <h1>INCOG Feed</h1>
        <button onClick={() => navigate("/create-post")}>+ Post</button>
      </div>

      <button
        className="refreshButton"
        onClick={refreshFeed}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing..." : "↻ Refresh Feed"}
      </button>

      <div
        className="feedContainer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {pullDistance > 0 && (
          <div
            style={{
              height: `${pullDistance}px`,
              opacity: pullDistance / PULL_THRESHOLD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              fontSize: "0.85rem",
              color: "#666",
              transition:
                pullDistance === 0 ? "height 0.2s ease, opacity 0.2s ease" : "none",
            }}
          >
            <span>
              {pullDistance >= PULL_THRESHOLD
                ? "Release to refresh..."
                : "Pull down to refresh"}
            </span>
          </div>
        )}

        {posts.map((post) => {
          const isOwner = post.userId === currentUserId;
          const userAvatar =
            isOwner && userData?.photoURL ? userData.photoURL : post.photoURL;

          return (
            <div
              className="feedCard"
              key={post.id}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isOwner) setSelectedPost(post);
              }}
            >
              <div className="feedUser">
                <div
                  className="clickProfile"
                  onClick={() => navigate(`/profile/${post.userId}`)}
                  style={{
                    cursor: "pointer",
                    overflow: "hidden",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
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
                      {post.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <span>{post.name}</span>
              </div>

              <p>
                {expanded[post.id]
                  ? post.text
                  : post.text?.length > 150
                  ? post.text.substring(0, 150) + "..."
                  : post.text}
              </p>

              {post.text?.length > 150 && (
                <button onClick={() => toggleText(post.id)}>
                  {expanded[post.id] ? "View Less" : "View More"}
                </button>
              )}

              {post.mediaType === "image" && (
                <img className="feedMedia" src={post.mediaURL} alt="post" />
              )}

              {post.mediaType === "video" && (
                <video className="feedMedia" src={post.mediaURL} controls />
              )}
            </div>
          );
        })}
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