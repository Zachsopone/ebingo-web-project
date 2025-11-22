import { useState, useEffect } from "react";

export default function ClosedPage() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date();
      startTime.setHours(9, 0, 0, 0); // 9:00 AM today

      if (now > startTime) {
        // If after 9:00 AM, show next day
        startTime.setDate(startTime.getDate() + 1);
      }

      const diff = startTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-[#F2F0EA] flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Ebingo System is currently closed right now
      </h1>
      <p className="text-xl">System will open in {timeLeft}</p>
    </div>
  );
}
