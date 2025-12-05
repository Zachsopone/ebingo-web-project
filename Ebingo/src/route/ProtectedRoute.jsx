// 🔥 FIXED ProtectedRoute.jsx — accurate branch time access control

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

  // Extract role + branch from token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role?.toLowerCase();
      branchId = payload.branch_id;
    } catch (err) {
      console.error("❌ JWT decode failed", err);
    }
  }

  // Convert MySQL stored datetime into LOCAL time safely
  const toLocalTime = (datetime) => {
    return new Date(datetime.replace("Z", ""));  // Prevent forced UTC offset
  };

  // 🕒 Check branch allowed time
  useEffect(() => {
    if (!branchId || !["cashier", "guard"].includes(userRole)) {
      setLoading(false);
      return;
    }

    let interval;
    const checkBranchTime = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}`);

        if (!data.opening_time || !data.closing_time) {
          setIsOpen(false);
          setLoading(false);
          return;
        }

        const now = new Date();
        const openTime = toLocalTime(data.opening_time);
        const closeTime = toLocalTime(data.closing_time);

        // ⏳ System open only within the window
        const accessAllowed = now >= openTime && now <= closeTime;

        setIsOpen(accessAllowed);
      } catch (e) {
        console.error("🔥 Branch time fetch failed", e);
      }
      setLoading(false);
    };

    checkBranchTime();
    interval = setInterval(checkBranchTime, 5000); // automatic periodic validation

    return () => clearInterval(interval);
  }, [userRole, branchId]);

  // ⛔ No token → login page
  if (!token) return <Navigate to="/" replace />;

  // Role mismatch → redirect to user's page
  if (!allowedRoles.includes(userRole)) return <Navigate to={`/${userRole}`} replace />;

  // Cashier/Guard trying to access outside business hours → ClosedPage
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
