import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children, allowedRoles }) => {
  //console.log("Cookies after login:", Cookies.get());
  const token = Cookies.get("accessToken");
  //console.log("accessToken:", token);
  let userRole = null;

  if (token) {
    try {
      userRole = JSON.parse(atob(token.split(".")[1])).role; // Decode the JWT to get the role
      //console.log("userRole token: ", userRole);
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  if (!token || !allowedRoles.includes(userRole)) {
    if (userRole === null) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={`/${userRole}`} replace />; // Redirect to login if not authorized
  }
  return children; // Render the children if authorized
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;

