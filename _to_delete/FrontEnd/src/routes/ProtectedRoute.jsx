import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token or user is found, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If token and user are found, render the child components
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.any,
};
