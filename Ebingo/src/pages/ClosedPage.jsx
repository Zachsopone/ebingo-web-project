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
    if (!branchId) return;

    try {
      const { data } = await axios.get(`${API_URL}/branches/${branchId}/status`);
      const now = new Date();

      if (data.isOpen) {
        // Branch is open → redirect immediately
        const token = Cookies.get("accessToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const role = payload.role.toLowerCase();
          if (role === "cashier") navigate("/cashier/members", { replace: true });
          else if (role === "guard") navigate("/guard", { replace: true });
        }
        return;
      }

      // Calculate time left until next opening
      const nextOpening = new Date(data.nextOpeningTime);
      const diff = nextOpening - now;
      if (diff > 0) {
        const h = Math.floor(diff / 1000 / 60 / 60);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft("");
      }

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
          System will open at {openingTimeDisplay || "the time admin set for opening and closing"}
        </p>
      )}
    </div>
  );
}
