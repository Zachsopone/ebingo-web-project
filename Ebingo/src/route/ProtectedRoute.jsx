import { Navigate} from "react-router-dom";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = Cookies.get("accessToken");
  const [isOpen, setIsOpen] = useState(true); // assume open by default
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

  // For cashier and guard: check branch status periodically
  useEffect(() => {
    if (!branchId || !["cashier", "guard"].includes(userRole)) {
      setLoading(false);
      return;
    }

    let interval;
    const checkBranchStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}`);
        if (!data.opening_time || !data.closing_time) {
          setIsOpen(false);
          return;
        }

        const now = new Date();
        const openTime = new Date(data.opening_time + "Z"); // treat as UTC
        const closeTime = new Date(data.closing_time + "Z");

        setIsOpen(now >= openTime && now <= closeTime);
      } catch (err) {
        console.error("Failed to fetch branch times:", err);
      } finally {
        setLoading(false);
      }
    };

    checkBranchStatus();
    interval = setInterval(checkBranchStatus, 5000); // check every 5 seconds
    return () => clearInterval(interval);
  }, [branchId, userRole]);

  if (!token) return <Navigate to="/" replace />; // no token
  if (!allowedRoles.includes(userRole)) return <Navigate to={`/${userRole}`} replace />; // not authorized

  // Redirect to closed page if branch is closed
  if (["cashier", "guard"].includes(userRole) && !loading && !isOpen) {
    return <Navigate to="/closed" state={{ branchId }} replace />;
  }

  return children; // render children if all checks passed
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;