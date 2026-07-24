import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebase";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SkillSelection from "./pages/Skillselection";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import CreatePost from "./pages/CreatePost";
import Broadcast from "./pages/Broadcast";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import Community from "./pages/Community";
import BroadcastDetails from "./pages/BroadcastDetails";
import BottomNav from "./components/BottomNav";
import MyBroadcasts from "./pages/MyBroadcasts";
import EditBroadcast from "./pages/EditBroadcast";
import { checkExpiredBroadcasts } from "./utils/checkExpiredBroadcasts";
import InterestedCandidates from "./pages/InterestedCandidates";

function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      await checkExpiredBroadcasts();
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading INCOG...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

 return (
  <>
    {children}

    {[
      "/dashboard",
      "/feed",
      "/my-broadcasts",
      "/alerts",
      "/broadcast",
    ].includes(location.pathname) && <BottomNav />}
  </>
);
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/community" element={<Community />} />
        <Route path="/broadcast/:id" element={<PrivateRoute><BroadcastDetails /></PrivateRoute>} />
        <Route path="/my-broadcasts" element={<PrivateRoute><MyBroadcasts /></PrivateRoute>} />
        <Route
 path="/feed"
 element={<Feed />}
/>

<Route
  path="/profile/:uid"
  element={<Profile />}
/>


<Route
 path="/create-post"
 element={<CreatePost />}
/>
      <Route
  path="/edit-broadcast/:id"
  element={
    <PrivateRoute>
      <EditBroadcast />
    </PrivateRoute>
  }
/>
         <Route
  path="/interested-candidates/:id"
  element={
    <PrivateRoute>
      <InterestedCandidates />
    </PrivateRoute>
  }
/>
         <Route path="/chat/:id" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />

        {/* Setup */}
        <Route
          path="/SkillSelection"
          element={
            <PrivateRoute>
              <SkillSelection />
            </PrivateRoute>
          }
        />

        {/* Main App */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
        <Route
          path="/broadcast"
          element={
            <PrivateRoute>
              <Broadcast />
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <Alerts />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Anything else */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0B1120",
    color: "#38BDF8",
    fontSize: "20px",
    fontWeight: "700",
  },
};