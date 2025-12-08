import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");
  const [openingTimeDisplay, setOpeningTimeDisplay] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

  useEffect(() => {
    if (!branchId) return;

    const updateTimer = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}/status`);
        const now = new Date();
        const nextOpening = new Date(data.nextOpeningTime);

        // Branch is open → redirect user
        if (data.isOpen) {
          const token = Cookies.get("accessToken");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const role = payload.role.toLowerCase();
            if (role === "cashier") navigate("/cashier/members", { replace: true });
            else if (role === "guard") navigate("/guard", { replace: true });
          }
          return;
        }

        // Calculate full time left until next opening
        const diff = nextOpening - now; // milliseconds
        if (diff > 0) {
          const totalSeconds = Math.floor(diff / 1000);
          const days = Math.floor(totalSeconds / (3600 * 24));
          const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          let timeString = "";
          if (days > 0) timeString += `${days}d `;
          if (hours > 0 || days > 0) timeString += `${hours}h `;
          if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
          timeString += `${seconds}s`;

          setTimeLeft(timeString);

          // Display next opening date & time in friendly format
          setOpeningTimeDisplay(
            nextOpening.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          );
        } else {
          // If somehow nextOpening is past, show admin-set message
          setTimeLeft("");
          setOpeningTimeDisplay("the time admin sets for opening and closing");
        }
      } catch (err) {
        console.error("Failed to fetch branch opening time", err);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [branchId, navigate]);

  return (
    <div className="w-full h-screen bg-[#F2F0EA] flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Ebingo System is currently closed
      </h1>
      {timeLeft ? (
        <p className="text-xl">System will open in {timeLeft}</p>
      ) : (
        <p className="text-xl">
          System will open at {openingTimeDisplay}
        </p>
      )}
    </div>
  );
}
