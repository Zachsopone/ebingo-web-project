import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

useEffect(() => {
  if (!branchId) return;
  let interval;

  const updateTimer = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/branches/${branchId}`);
      if (!data.opening_time || !data.closing_time) return;

      const openingTime = new Date(data.opening_time); // local Date
      const closingTime = new Date(data.closing_time);
      const now = new Date();

      // If branch is open, redirect
      if (now >= openingTime && now <= closingTime) {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="));
        if (token) {
          const payload = JSON.parse(atob(token.split("=")[1].split(".")[1]));
          if (payload.role.toLowerCase() === "cashier") navigate("/cashier/members", { replace: true });
          else if (payload.role.toLowerCase() === "guard") navigate("/guard", { replace: true });
        }
        return;
      }

      // Countdown only if opening time is in future
      const diff = openingTime - now;
      if (diff <= 0) {
        setTimeLeft("");
      } else {
        const h = Math.floor(diff / 1000 / 60 / 60);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    } catch (err) {
      console.error("Failed to fetch branch opening time", err);
    }
  };

  updateTimer();
  interval = setInterval(updateTimer, 1000);
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
        <p className="text-xl">System will open at a time admin set for opening and closing date and time</p>
      )}
    </div>
  );
}
