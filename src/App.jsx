import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SkillSelection from "./pages/SkillSelection";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Broadcast from "./pages/Broadcast";
import Chat from "./pages/Chat";
import Alerts from "./pages/Alerts";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/skills" element={<SkillSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;