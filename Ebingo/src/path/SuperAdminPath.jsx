import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PropTypes from "prop-types";

const SuperAdminPath = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

SuperAdminPath.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SuperAdminPath;
