import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = Cookies.get("accessToken");
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  let userRole = null;
  let branchId = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role.toLowerCase();
      branchId = payload.branch_id;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  useEffect(() => {
    if (!branchId || !["cashier", "guard"].includes(userRole)) {
      setLoading(false);
      return;
    }

    const checkBranchStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}/status`);
        setIsOpen(data.isOpen);
      } catch (err) {
        console.error("Failed to fetch branch status:", err);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    checkBranchStatus();
    const interval = setInterval(checkBranchStatus, 5000);
    return () => clearInterval(interval);
  }, [branchId, userRole]);

  if (!token) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(userRole)) return <Navigate to={`/${userRole}`} replace />;

  if (["cashier", "guard"].includes(userRole) && !loading && !isOpen) {
    return <Navigate to="/closed" state={{ branchId }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;
