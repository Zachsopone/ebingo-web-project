import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import PropTypes from "prop-types";

// allowClosed = true
const ProtectedRoute = ({ children, allowedRoles }) => {
  //console.log("Cookies after login:", Cookies.get());
  const token = Cookies.get("accessToken");
  if (!token) return <Navigate to="/" replace />;

  let userRole = null;
  let payload = null;

  try {
    payload = JSON.parse(atob(token.split(".")[1]));
    userRole = (payload.role || "").toLowerCase();

    // Cashier/Guard working hours check
    // if (!allowClosed && ["cashier", "guard"].includes(userRole)) {
    //   const now = new Date();
    //   const currentMinutes = now.getHours() * 60 + now.getMinutes();
    //   const startMinutes = 9 * 60;        // 9:00 AM
    //   const endMinutes = 18 * 60 + 5;

    //   if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    //     return <Navigate to="/closed" replace />;
    //   }
    // }
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children; // Render the children if authorized
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  allowClosed: PropTypes.bool,
};

export default ProtectedRoute;

