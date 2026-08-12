import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  const expiry = Number(localStorage.getItem("authExpiry") || 0);
  const isAuthenticated = !!token && Date.now() < expiry;

  if (!isAuthenticated) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpiry");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
