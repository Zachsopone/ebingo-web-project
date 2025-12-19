import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = Cookies.get("accessToken");

  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  let userRole = null;
  let branchId = null;

  // Decode JWT
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role?.toLowerCase();
      branchId = payload.branch_id;
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  useEffect(() => {
    // Only cashier / guard need branch-time validation
    if (!token || !branchId || !["cashier", "guard"].includes(userRole)) {
      setLoading(false);
      return;
    }

    let intervalId;

    const checkBranchStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/branches/${branchId}/status`,
          { withCredentials: true }
        );

        const now = new Date(data.serverNow);
        const opening = new Date(data.openingTime);
        const closing = new Date(data.closingTime);

        const open = now >= opening && now <= closing;
        setIsOpen(open);
      } catch (err) {
        console.error("Failed to check branch status:", err);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    checkBranchStatus();
    intervalId = setInterval(checkBranchStatus, 5000);

    return () => clearInterval(intervalId);
  }, [token, branchId, userRole]);

  // Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Role not allowed
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  // Waiting for branch status
  if (loading) {
    return null; // or spinner if you want
  }

  // Branch closed → redirect to ClosedPage
  if (["cashier", "guard"].includes(userRole) && !isOpen) {
    return <Navigate to="/closed" state={{ branchId }} replace />;
  }

  // Access granted
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;
