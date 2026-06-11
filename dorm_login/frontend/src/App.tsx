import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import Students from "@/pages/admin/Students";
import Dormitories from "@/pages/admin/Dormitories";
import Repairs from "@/pages/admin/Repairs";
import Visitors from "@/pages/admin/Visitors";
import Leaves from "@/pages/admin/Leaves";
import Scores from "@/pages/admin/Scores";
import Utility from "@/pages/admin/Utility";
import Announcements from "@/pages/admin/Announcements";
import StudentRepairs from "@/pages/student/Repairs";
import StudentVisitors from "@/pages/student/Visitors";
import StudentLeave from "@/pages/student/Leave";
import StudentScores from "@/pages/student/Scores";
import StudentUtility from "@/pages/student/Utility";
import StudentAnnouncements from "@/pages/student/Announcements";
import Monitor from "@/pages/Monitor";
import AdminMonitor from "@/pages/admin/AdminMonitor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/admin/dormitories" element={<ProtectedRoute><Dormitories /></ProtectedRoute>} />
        <Route path="/admin/repairs" element={<ProtectedRoute><Repairs /></ProtectedRoute>} />
        <Route path="/admin/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
        <Route path="/admin/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
        <Route path="/admin/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
        <Route path="/admin/utility" element={<ProtectedRoute><Utility /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/student/repairs" element={<ProtectedRoute><StudentRepairs /></ProtectedRoute>} />
        <Route path="/student/visitors" element={<ProtectedRoute><StudentVisitors /></ProtectedRoute>} />
        <Route path="/student/leave" element={<ProtectedRoute><StudentLeave /></ProtectedRoute>} />
        <Route path="/student/scores" element={<ProtectedRoute><StudentScores /></ProtectedRoute>} />
        <Route path="/student/utility" element={<ProtectedRoute><StudentUtility /></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute><StudentAnnouncements /></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
        <Route path="/admin/monitor" element={<ProtectedRoute><AdminMonitor /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
