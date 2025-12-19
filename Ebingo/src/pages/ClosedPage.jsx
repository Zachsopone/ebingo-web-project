import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ClosedPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const branchId = location.state?.branchId;

  const [timeLeft, setTimeLeft] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!branchId) return;

    let intervalId;

    const updateStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/branches/${branchId}/status`,
          { withCredentials: true }
        );

        const now = new Date(data.serverNow);
        const opening = new Date(data.openingTime);
        const closing = new Date(data.closingTime);

        // If branch is open → redirect
        if (now >= opening && now <= closing) {
          const token = Cookies.get("accessToken");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const role = payload.role?.toLowerCase();

            if (role === "cashier") {
              navigate("/cashier/members", { replace: true });
            } else if (role === "guard") {
              navigate("/guard", { replace: true });
            }
          }
          return;
        }

        // Opening time already PASSED → static message
        if (opening <= now) {
          setShowCountdown(false);
          setTimeLeft("");
          return;
        }

        // Opening time is in the FUTURE → countdown
        const diffMs = opening - now;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);

        setShowCountdown(true);
        setTimeLeft(
          `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`
        );
      } catch (err) {
        console.error("Failed to fetch branch status:", err);
      }
    };

    updateStatus();
    intervalId = setInterval(updateStatus, 1000);

    return () => clearInterval(intervalId);
  }, [branchId, navigate]);

  return (
    <div className="w-full h-screen bg-[#F2F0EA] flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Ebingo System is currently closed
      </h1>

      {showCountdown ? (
        <p className="text-xl">
          System will open in <strong>{timeLeft}</strong>
        </p>
      ) : (
        <p className="text-xl">
          System will open at the time the admin sets for the opening date and time
        </p>
      )}
    </div>
  );
}