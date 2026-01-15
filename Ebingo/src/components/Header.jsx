import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Popup from "./Popup";
import Members from "./Members";
import Branches from "./Branches";
import axios from "axios";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Header = ({ fixedBranchId }) => {
  const location = useLocation();
  const [popupType, setPopupType] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [branchName, setBranchName] = useState("");

  const isBranchesPage = location.pathname.includes("branches");

  // Live date & time
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

// Fetch branch name from full list
useEffect(() => {
  if (!fixedBranchId) return;
  axios
    .get(`${API_URL}/branches`, { withCredentials: true })  // Add withCredentials if using cookie auth
    .then(res => {
      const branch = res.data.find(b => b.id === fixedBranchId);
      setBranchName(branch ? branch.sname : "");
    })
    .catch(err => {
      console.error("Error fetching branches:", err);
      setBranchName("");
    });
}, [fixedBranchId]);

  return (
    <header className="bg-[#A8D5E3] w-full h-[3.2rem] flex items-center relative px-4">

      {isBranchesPage ? 
        (popupType === "branches" && (
          <Popup onClose={() => setPopupType(null)}>
            <Branches />
          </Popup>
        ))
      : 
        (popupType === "members" && (
          <Popup onClose={() => setPopupType(null)}>
            <Members />
          </Popup>
        ))
      }

    {/* LEFT — Branch name (aligned with Members) */}
    <div className="absolute left-4 flex items-center h-full">
      {branchName && (
        <span className="text-lg font-semibold uppercase">
          {branchName}
        </span>
      )}
    </div>  

    {/* CENTER — Title */}
    <div className="mx-auto text-black font-semibold text-lg">
      E-Bingo Information System
    </div>

    {/* RIGHT — Live date & time (aligned with Logout) */}
    <div className="absolute right-4 flex items-center h-full">
      <span className="text-md font-semibold">
        {dateTime.toLocaleString()}
      </span>
    </div>

    </header>
  );
};

Header.propTypes = {
  fixedBranchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Header.defaultProps = {
  fixedBranchId: null,
};

export default Header;
