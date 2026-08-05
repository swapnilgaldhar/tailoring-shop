import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated (authToken in localStorage)
  const isAuthenticated = !!localStorage.getItem("authToken");

  if (!isAuthenticated) {
    //ticated Redirect to login if not authen
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the component
  return children;
};

export default ProtectedRoute;
