import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Helper: parse MySQL DATETIME string into local JS Date
const parseMySQLDatetimeLocal = (mysqlDatetime) => {
  if (!mysqlDatetime) return null;
  const [datePart, timePart] = mysqlDatetime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second); // local time
};

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");
  const [openingTimeDisplay, setOpeningTimeDisplay] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

  useEffect(() => {
    if (!branchId) return;

    let interval;

    const updateTimer = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}`);
        const now = new Date();

        const openingTime = parseMySQLDatetimeLocal(data.opening_time);
        const closingTime = parseMySQLDatetimeLocal(data.closing_time);

        if (!openingTime || !closingTime) return;

        // If branch is currently open, redirect immediately
        if (now >= openingTime && now <= closingTime) {
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("accessToken="));
          if (token) {
            const payload = JSON.parse(
              atob(token.split("=")[1].split(".")[1])
            );
            if (payload.role.toLowerCase() === "cashier")
              navigate("/cashier/members", { replace: true });
            else if (payload.role.toLowerCase() === "guard")
              navigate("/guard", { replace: true });
          }
          return;
        }

        const diff = openingTime - now;

        if (diff <= 0) {
          // Opening time is in the past → display fixed message
          setTimeLeft("");
          setOpeningTimeDisplay(
            openingTime.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          );
        } else {
          // Opening time is in the future → display countdown
          const h = Math.floor(diff / 1000 / 60 / 60);
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${h}h ${m}m ${s}s`);
          setOpeningTimeDisplay(
            openingTime.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          );
        }
      } catch (err) {
        console.error("Failed to fetch branch opening time", err);
      }
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000); // update every second
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
          System will open at {openingTimeDisplay || "the time admin set for opening and closing date and time"}
        </p>
      )}
    </div>
  );
}
