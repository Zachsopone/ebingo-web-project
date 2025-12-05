import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const parseMySQLDatetimeLocal = (mysqlDatetime) => {
  if (!mysqlDatetime) return null;
  const [date, time] = mysqlDatetime.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min, s] = time.split(":").map(Number);
  return new Date(y, m-1, d, h, min, s);
};

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");
  const [openingTimeDisplay, setOpeningTimeDisplay] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

  useEffect(() => {
    if (!branchId) return;
    const intervalId = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_URL}/branches/${branchId}`);
        const now = new Date();
        const open = parseMySQLDatetimeLocal(data.opening_time);
        const close = parseMySQLDatetimeLocal(data.closing_time);

        if (!open || !close) return;
        if (now >= open && now <= close) {
          const token = document.cookie.split("; ").find(r=>r.startsWith("accessToken="));
          if (token) {
            const payload = JSON.parse(atob(token.split("=")[1].split(".")[1]));
            navigate(`/${payload.role.toLowerCase()}`, { replace: true });
          }
          return;
        }

        const diff = open - now;
        if (diff <= 0) setTimeLeft("");
        else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000)/60000);
          const s = Math.floor((diff % 60000)/1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
        setOpeningTimeDisplay(open.toLocaleString([], { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:true }));
      } catch(err) { console.error(err); }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [branchId, navigate]);

  return (
    <div className="w-full h-screen bg-[#F2F0EA] flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Ebingo System is currently closed</h1>
      {timeLeft ? <p className="text-xl">System will open in {timeLeft}</p> : <p className="text-xl">System will open at {openingTimeDisplay || "time set by admin"}</p>}
    </div>
  );
}
