import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";


const API_URL = import.meta.env.VITE_API_BASE_URL;

const Guard = ({ fixedBranchId: propBranchId }) => {
  const [member, setMember] = useState(null);
  const [branches, setBranches] = useState([]);
  const [profileIdUrl, setProfileIdUrl] = useState(null);
  const [rfid, setRfid] = useState("");
  const [scanMode, setScanMode] = useState(true);
  const [status, setStatus] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [imageError, setImageError] = useState(false);
  const [branchName, setBranchName] = useState("");

  // Get branchId
  const getBranchId = () => {
    if (propBranchId !== undefined && propBranchId !== null) {
      return propBranchId;
    }

    const token = Cookies.get("accessToken");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.branch_id || null;
    } catch (err) {
      console.warn("Failed to decode token in Header:", err);
      return null;
    }
  };
  
    const currentBranchId = getBranchId();

  // Fetch branch name
  useEffect(() => {
    if (!currentBranchId) {
      setBranchName("");
      return;
    }

    axios
      .get(`${API_URL}/branches`, { withCredentials: true })
      .then((res) => {
        const branch = res.data.find((b) => b.id === Number(currentBranchId));
        setBranchName(branch?.sname || "");
      })
      .catch((err) => {
        console.error("Failed to load branch name:", err);
        setBranchName("");
      });
  }, [currentBranchId]);

  // Keep live date & time
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract guard branch ID from token
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

  // Clear displayed data
  const clearDisplay = useCallback(() => {
    setStatus("");
    setMember(null);
    setBranches([]);
    setProfileIdUrl(null);
    setImageError(false);
  }, []);

  // Auto-clear after seconds when showing member data
  useEffect(() => {
    if (status || profileIdUrl) {
      const timer = setTimeout(() => {
        clearDisplay();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, profileIdUrl, clearDisplay]);

  // Instant clear when user clicks or presses any key — but not while typing manually
  useEffect(() => {
    const handleClick = (event) => {
      // Don't clear if typing inside input during manual mode
      const isInput =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable;

      if ((member || profileIdUrl || status) && (!isInput || scanMode)) {
        clearDisplay();
      }
    };

    const handleKey = (event) => {
      // Prevent clearing if typing in manual mode
      const isInput =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable;

      if ((member || profileIdUrl || status) && (!isInput || scanMode)) {
        clearDisplay();
      }
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [member, profileIdUrl, status, clearDisplay, scanMode]);

  // Handle RFID submit
  const handleRFIDSubmit = useCallback(async (IDNum) => {
    try {
      const guardBranchId = getGuardBranchId();
      const res = await axios.post(`${API_URL}/rfid`, {
        rfid: IDNum,
        guardBranchId,
      });
      const { data: memberData, branches, profileIdUrl } = res.data;

      if (memberData) {
        setMember(memberData);
        setBranches(branches);
        setProfileIdUrl(profileIdUrl);
        setImageError(false);

        if (memberData.banned === 1) {
          setStatus("banned");
        } else if (memberData.sameBranch) {
          setStatus("valid");
        } else {
          setStatus("different_branch");
        }

        // const fullName = `${memberData.fname} ${memberData.mname || ""} ${memberData.lname}`.trim();
        // saveMemberData(fullName, memberData.idnum);
      }
      setRfid("");
    } catch {
      setStatus("not_registered");
      setMember(null);
      setBranches([]);
      setProfileIdUrl(null);
      setImageError(false);
      setRfid("");
    }
  }, []);

  // Auto-submit scanned input after 0.5s
  useEffect(() => {
    if (scanMode && rfid) {
      const timeout = setTimeout(() => handleRFIDSubmit(rfid), 500);
      return () => clearTimeout(timeout);
    }
  }, [rfid, scanMode, handleRFIDSubmit]);

  // Save scanned log
  // const saveMemberData = (fullName, IDNum) => {
  //   const timestamp = new Date().toLocaleString();
  //   axios
  //     .post("http://localhost:12991/saveMemberData", {
  //       memberName: fullName,
  //       timestamp,
  //       IDNum,
  //     })
  //     .catch(() => {});
  // };

  // Manual submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (rfid) handleRFIDSubmit(rfid);
  };

  // Handle image load error
  const handleImageError = () => setImageError(true);

  // Logout
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
    <main className="bg-[#F2F0EA] w-full h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-center py-2 ...">
        {branchName && (
          <span className="text-lg font-semibold uppercase">
            {branchName}
          </span>
        )}
      </div>
      {/* Top bar */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center pt-0 px-5 sm:pb-7 border-b border-gray-400 relative gap-4 sm:gap-0">
        {/* Scan form */}
        <form
          onSubmit={scanMode ? (e) => e.preventDefault() : handleSubmit}
          className="flex flex-col gap-2 sm:w-auto w-full"
        >
          <label className="text-lg">Scan ID Number / Name</label>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={rfid}
              onChange={(e) => setRfid(e.target.value)}
              autoFocus={!scanMode}
              placeholder={
                scanMode ? "Waiting for scan..." : "Enter ID no., or Name"
              }
              className="border border-black rounded-md p-2 bg-white w-full sm:w-[15rem]"
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
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md sm:items-start"
                >
                  Submit
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle scan/manual mode */}
          <div className="flex items-center gap-3 mt-2 relative sm:flex-row sm:gap-4 sm:mt-0">
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
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4 sm:mt-0 w-full sm:w-auto">
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
      <div className="flex flex-col sm:flex-row flex-1 min-h-0">
        {/* Left: member info */}
        <div
          className={`w-full sm:w-1/4 h-40 items-center text-center border-b sm:border-r border-gray-400 flex flex-col transition-colors duration-500 sm:h-full pt-2 ${
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
              <p className="text-white sm:text-3xl font-bold uppercase sm:px-5 pt-3 text-lg">
                Welcome {member.lname}, {member.mname || ""} {member.fname}, {member.idnum} to Ebingo
              </p>
              <div className="mt-2 sm:mt-4 text-white font-semibold sm:text-xl text-sm space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "banned" && member && (
            <>
              <p className="text-white sm:text-3xl font-bold uppercase sm:px-5 pt-2 text-lg">
                {member.lname}, {member.mname || ""} {member.fname}, {member.idnum} is BANNED
              </p>
              <div className="mt-2 sm:mt-4 text-white font-semibold sm:text-xl text-sm space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "different_branch" && member && (
            <>
              <p className="text-white sm:text-3xl font-bold uppercase sm:px-5 pt-2 text-lg">
                {member.lname}, {member.mname || ""} {member.fname}, {member.idnum}
              </p>
              <div className="mt-2 sm:mt-4 text-white font-semibold sm:text-xl text-sm space-y-1">
                {branches.length > 0
                  ? branches.map((b) => <p key={b.id}>{b.sname}</p>)
                  : <p>No branch records found</p>}
              </div>
            </>
          )}

          {status === "not_registered" && (
            <h1 className="text-red-600 sm:text-2xl text-lg font-bold uppercase pt-2 sm:pt-5">
              Not Registered
            </h1>
          )}
        </div>

        {/* Right: ID image */}
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          {profileIdUrl && !imageError ? (
            <img
              src={`${API_URL}${profileIdUrl}`}
              alt="Valid ID"
              className="w-full h-full object-contain sm:max-h-full"
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-gray-600 text-lg">No Valid ID Available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

Guard.propTypes = {
  fixedBranchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Guard.defaultProps = {
  fixedBranchId: null,
};

export default Guard;
