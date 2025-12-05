// ClosedPage.jsx — corrected and lint-clean
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");       // countdown string (e.g. "1h 2m 3s")
  const [nextOpening, setNextOpening] = useState(""); // human-friendly opening time (used in UI)

  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

  // Parse backend datetime string into a JS Date.
  // Use new Date(datetime) so ISO strings with 'Z' are treated as UTC then converted to local.
  // This is the most robust behavior for comparing "now" (local) against stored UTC timestamps.
  const toLocalDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!branchId) return;

    let intervalId;

    const updateTimer = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}`);

        const now = new Date();
        const opening = toLocalDate(data.opening_time);
        const closing = toLocalDate(data.closing_time);

        // If any date missing / invalid, show generic message
        if (!opening || !closing) {
          setTimeLeft("");
          setNextOpening("");
          return;
        }

        // If branch currently open => redirect immediately
        if (now >= opening && now <= closing) {
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("accessToken="));

          if (token) {
            try {
              const payload = JSON.parse(atob(token.split("=")[1].split(".")[1]));
              const role = (payload.role || "").toLowerCase();
              if (role === "cashier") return navigate("/cashier/members", { replace: true });
              if (role === "guard") return navigate("/guard", { replace: true });
            } catch (err) {
              // if token decode fails, just do nothing here
              console.error("Token decode failed on ClosedPage redirect:", err);
            }
          }
          return;
        }

        // Compute time until next opening (opening may be in future or past)
        const diffMs = opening - now;

        if (diffMs > 0) {
          const hours = Math.floor(diffMs / 3600000);
          const minutes = Math.floor((diffMs % 3600000) / 60000);
          const seconds = Math.floor((diffMs % 60000) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          setNextOpening(""); // countdown shown, no "fixed opening" text
        } else {
          // Opening already passed — show formatted opening datetime instead of countdown
          setTimeLeft("");
          setNextOpening(opening.toLocaleString());
        }
      } catch (err) {
        console.error("Failed to fetch branch opening time", err);
        setTimeLeft("");
        setNextOpening("");
      }
    };

    // initial call + interval
    updateTimer();
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [branchId, navigate]);

  return (
    <div className="w-full h-screen bg-[#F2F0EA] flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Ebingo System is currently closed
      </h1>

      {timeLeft ? (
        <p className="text-xl">System will open in <b>{timeLeft}</b></p>
      ) : (
        <p className="text-xl">
          System will open at <b>{nextOpening || "the scheduled opening time"}</b>
        </p>
      )}
    </div>
  );
}
