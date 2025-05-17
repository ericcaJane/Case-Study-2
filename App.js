import { Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import ViewerDashboard from "./ViewerDashboard";
import ResidentData from "./ResidentData";
import ViewInsight from "./ViewInsight"; // Import ViewInsights
import WelcomePage from "./WelcomePage";
import AddResident from "./AddResident";
import ViewData from "./ViewData";
import ViewList from "./ViewList";
import List from "./List";
import "./main.css";  
import ResidentList from "./ResidentList";
import ResidentInfo from './ResidentInfo';
import QrScanner from "./QrScanner";
import QrDetails from "./QrDetails";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  });

  return (
    <Routes>
      {/* Redirect based on user role */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              user
                ? user.role === "admin"
                  ? "/admindashboard"
                  : "/viewerdashboard"
                : "/login"
            }
          />
        }
      />

      {/* Signup and Login Routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login setUser={setUser} />} />

      {/* Admin Dashboard with Nested Routes */}
      <Route
        path="/admindashboard"
        element={
          user?.role === "admin" ? (
            <AdminDashboard user={user} />
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<WelcomePage />} /> {/* Default route */}
        <Route path="view-list" element={<ViewList />} />
        <Route path="add-resident" element={<AddResident />} />
        <Route path="resident-data" element={<ResidentData />} />
        <Route path="resident-list" element={<ResidentList />} />
        <Route path="view-insight" element={<ViewInsight />} />
        <Route path="qr-scanner" element={<QrScanner />} />
      </Route>

      {/* Viewer Dashboard with Nested Routes */}
      <Route
        path="/viewerdashboard"
        element={
          user?.role === "viewer" ? (
            <ViewerDashboard />
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<WelcomePage />} /> {/* Default route */}
        <Route path="view-list" element={<ViewList />} />
        <Route path="view-res-list" element={<List />} />
        <Route path="view-data" element={<ViewData />} />
        <Route path="view-insight" element={<ViewInsight />} />
      </Route>

       {/* Route for Resident Info (QR Code) */}
       <Route path="/residents/:id" element={<QrDetails />} />


    </Routes>

    
  );
}

export default App;