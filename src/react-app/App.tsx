import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";

import Login from "@/react-app/pages/Login";
import AddActivities from "@/react-app/pages/AddActivities";
import Dashboard from "@/react-app/pages/Dashboard";
import AuthCallback from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>  {/* 👈 IMPORTANT */}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-activities" element={<AddActivities />} />
          <Route path="*" element={<h1 style={{color:"white"}}>404 Page not found</h1>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
