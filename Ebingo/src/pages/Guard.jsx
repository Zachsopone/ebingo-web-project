import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Guard = () => {
  const [member, setMember] = useState(null);
  const [branches, setBranches] = useState([]);
  const [validIdUrl, setValidIdUrl] = useState(null);
  const [rfid, setRfid] = useState("");
  const [scanMode, setScanMode] = useState(true);
  const [status, setStatus] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [imageError, setImageError] = useState(false);

  // 🕓 Keep live date & time
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔐 Extract guard branch ID from token
  const getGuardBranchId = () => {
    const token = Cookies.get("accessToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.branch_id || null;
    } catch {
      return null;
    }
  };

  // 🧹 Clear displayed data
  const clearDisplay = useCallback(() => {
    setStatus("");
    setMember(null);
    setBranches([]);
    setValidIdUrl(null);
    setImageError(false);
  }, []);

  // ⏱ Auto-clear after 4 seconds when showing member data
  useEffect(() => {
    if (status || validIdUrl) {
      const timer = setTimeout(() => {
        clearDisplay();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, validIdUrl, clearDisplay]);

  // 🖱 Instant clear when user clicks or presses any key — but not while typing manually
  useEffect(() => {
    const handleClick = (event) => {
      // Don't clear if typing inside input during manual mode
      const isInput =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable;

      if ((member || validIdUrl || status) && (!isInput || scanMode)) {
        clearDisplay();
      }
    };

    const handleKey = (event) => {
      // Prevent clearing if typing in manual mode
      const isInput =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable;

      if ((member || validIdUrl || status) && (!isInput || scanMode)) {
        clearDisplay();
      }
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [member, validIdUrl, status, clearDisplay, scanMode]);

  // 📤 Handle RFID submit
  const handleRFIDSubmit = useCallback(async (cardNumber) => {
    try {
      const guardBranchId = getGuardBranchId();
      const res = await axios.post(`${API_URL}/rfid`, {
        rfid: cardNumber,
        guardBranchId,
      });
      const { data: memberData, branches, validIdUrl } = res.data;

      if (memberData) {
        setMember(memberData);
        setBranches(branches);
        setValidIdUrl(validIdUrl);
        setImageError(false);

        if (!memberData.sameBranch) setStatus("different_branch");
        else if (memberData.banned === 1) setStatus("banned");
        else setStatus("valid");

        // const fullName = `${memberData.fname} ${memberData.mname || ""} ${memberData.lname}`.trim();
        // saveMemberData(fullName, memberData.Card_No);
      }
      setRfid("");
    } catch {
      setStatus("not_registered");
      setMember(null);
      setBranches([]);
      setValidIdUrl(null);
      setImageError(false);
      setRfid("");
    }
  }, []);

  // ⏱ Auto-submit scanned input after 0.5s
  useEffect(() => {
    if (scanMode && rfid) {
      const timeout = setTimeout(() => handleRFIDSubmit(rfid), 500);
      return () => clearTimeout(timeout);
    }
  }, [rfid, scanMode, handleRFIDSubmit]);

  // 🗃 Save scanned log
  // const saveMemberData = (fullName, cardNumber) => {
  //   const timestamp = new Date().toLocaleString();
  //   axios
  //     .post("http://localhost:12991/saveMemberData", {
  //       memberName: fullName,
  //       timestamp,
  //       cardNumber,
  //     })
  //     .catch(() => {});
  // };

  // 🧭 Manual submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (rfid) handleRFIDSubmit(rfid);
  };

  // 🖼 Handle image load error
  const handleImageError = () => setImageError(true);

  // 🚪 Logout
  const handleLogout = () => {
    axios
      .post(`${API_URL}/auth/logout`)
      .then(() => {
        Cookies.remove("accessToken");
        window.location.href = "/";
      })
      .catch((err) => console.error("Logout error:", err));
  };

  return (
    <main className="bg-[#F2F0EA] w-full h-screen flex flex-col">
      {/* Top bar */}
      <div className="w-full h-[20%] flex justify-between items-center px-5 pt-5 pb-7 border-b border-gray-400 relative">
        {/* Scan form */}
        <form
          onSubmit={scanMode ? (e) => e.preventDefault() : handleSubmit}
          className="flex flex-col gap-2"
        >
          <label className="text-lg">Scan RFID / ID / Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rfid}
              onChange={(e) => setRfid(e.target.value)}
              autoFocus={!scanMode}
              placeholder={
                scanMode ? "Waiting for scan..." : "Enter Card no., ID, or Name"
              }
              className="border border-black rounded-md p-2 bg-white w-[15.2rem]"
            />

            {/* Submit button for manual mode */}
            <AnimatePresence>
              {!scanMode && (
                <motion.button
                  type="submit"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Submit
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle scan/manual mode */}
          <div className="flex items-center gap-3 mt-2 relative">
            <span className="text-md">Scan Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!scanMode}
                onChange={() => setScanMode((prev) => !prev)}
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
            </label>
            <span className="text-md">Manual Mode</span>
          </div>
        </form>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-md font-semibold mb-1">{dateTime.toLocaleString()}</span>
          <button
            onClick={handleLogout}
            type="button"
            className="bg-red-500 px-4 py-2 rounded-md text-white hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <p className="text-lg absolute left-4 bottom-0 translate-y-1/2 w-fit bg-[#F2F0EA] px-1">
          Status
        </p>
      </div>

      {/* Main display */}
      <div className="flex flex-1">
        {/* Left: member info */}
        <div
          className={`w-1/4 h-full border-r border-gray-400 flex flex-col items-center text-center transition-colors duration-500 ${
            status === "valid"
              ? "bg-green-600"
              : status === "banned"
              ? "bg-red-600"
              : status === "different_branch"
              ? "bg-yellow-500"
              : ""
          }`}
        >
          {status === "valid" && member && (
            <>
              <p className="text-white text-3xl font-bold uppercase pt-5">
                Welcome {member.lname}, {member.mname || ""} {member.fname} to Ebingo
              </p>
              <div className="mt-4 text-white font-semibold text-xl space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "banned" && member && (
            <>
              <p className="text-white text-3xl font-bold uppercase pt-5">
                {member.lname}, {member.mname || ""} {member.fname} is BANNED
              </p>
              <div className="mt-4 text-white font-semibold text-xl space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "different_branch" && member && (
            <>
              <p className="text-white text-3xl font-bold uppercase pt-5">
                {member.lname}, {member.mname || ""} {member.fname} is not registered from this branch
              </p>
              <div className="mt-4 text-white font-semibold text-xl space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "not_registered" && (
            <h1 className="text-red-600 text-2xl font-bold uppercase pt-5">
              Not Registered
            </h1>
          )}
        </div>

        {/* Right: ID image */}
        <div className="flex-1 flex items-center justify-center h-full">
          {validIdUrl && !imageError ? (
            <img
              src={`${API_URL}${validIdUrl}`}
              alt="Valid ID"
              className="object-contain"
              style={{ height: "583px" }}
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-lg">No Valid ID Available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Guard;
