import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import Home from "../pages/Home";
import Login from "../auth/Login";
import Data from "../pages/Data";
import About from "../pages/About";
import DataViewPage from "../user/DataViewPage";
import Signup from "../auth/Signup";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="" element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="about" element={<About />} />
      <Route
        path="add"
        element={
          <ProtectedRoute>
            <DataViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="data"
        element={
          <ProtectedRoute>
            <Data />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
