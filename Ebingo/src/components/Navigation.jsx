import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import Cookies from "js-cookie";
import Popup from "./Popup";
import AddMember from "./AddMember";
import AddBranch from "./AddBranch";
import AddUser from "./AddUser";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SelectedOptionContext } from "../context/OptionContext";
import { useSnackbar } from "notistack";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Helper for displaying in UI
const formatDisplayDate = (date) =>
  date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

const playerFormatDate = (date) =>
  date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

// Helper for query + filename (YYYY-MM-DD local, not UTC)
const formatForQuery = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Navigation = ({ onBranchAdded, triggerRefetch, onUserAdded }) => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("");
  const [popupType, setPopupType] = useState(null);
  const { selectedOption } = useContext(SelectedOptionContext);

  // Date range states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calendar states → keep fromMonth and toMonth always consecutive
  const [fromMonth, setFromMonth] = useState(new Date());
  const [toMonth, setToMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  );

  const [playerFromDate, setPlayerFromDate] = useState(null);
  const [playerToDate, setPlayerToDate] = useState(null);
  const [playerShowCalendar, setPlayerShowCalendar] = useState(false);

  const [playerFromMonth, setPlayerFromMonth] = useState(new Date());
  const [playerToMonth, setPlayerToMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  );

  const calendarRef = useRef(null);
  const playerCalendarRef = useRef(null);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token", error);
      }
    }
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
      if (playerCalendarRef.current && !playerCalendarRef.current.contains(e.target)) {
        setPlayerShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    if (playerShowCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar, playerShowCalendar]);

  // Generate & download Excel (MasterList)
  const handlePrintMasterList = async () => {
    try {
      if (!selectedOption) {
        alert("Please select a branch first!");
        return;
      }

      const response = await fetch(
        `${API_URL}/members/master?branch_id=${selectedOption}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("accessToken") || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Download Masterlist");
      }

      const data = await response.json();

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "MasterList");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `MasterList_Branch${selectedOption}.xlsx`);
      enqueueSnackbar("MasterList downloaded.", { variant: "success" });
    } catch (err) {
      console.error(err.message);
      alert("Error downloading Master List");
    }
  };

  // nav items logic
  let navItems = [];
  const isMembersPage = location.pathname.includes("/members");
  const isBranchesPage = location.pathname.includes("/branches");
  const isUsersPage = location.pathname.includes("/users");

  if (role.toLowerCase() === "cashier") {
    navItems = [
      { label: "Members", path: `/${role.toLowerCase()}/members` },
      { label: "Add Member", action: "addmember" },
    ];

    if (isMembersPage) {
      navItems.push({ label: "Download Masterlist", action: "masterlist" });
    }
  } else {
    navItems = [
      { label: "Members", path: `/${role.toLowerCase()}/members` },
      { label: "Branches", path: `/${role.toLowerCase()}/branches` },
      { label: "Users", path: `/${role.toLowerCase()}/users` },
    ];

    if (isBranchesPage) {
      navItems.push({ label: "Add Branch", action: "addbranch" });
    } else if (isUsersPage) {
      navItems.push({ label: "Add User", action: "adduser" });
    } else if (isMembersPage) {
      navItems.push({ label: "Add Member", action: "addmember" });
      navItems.push({ label: "Download Masterlist", action: "masterlist" });
    }
  }

  const handleNavClick = (item) => {
    if (item.action === "masterlist") {
      handlePrintMasterList();
    } else if (item.action) {
      setPopupType(item.action);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const getNavClass = (label) => {
    if (
      label === "Add Member" ||
      label === "Add Branch" ||
      label === "Add User"
    ) {
      return "cursor-pointer text-black hover:bg-[#95bcc9] px-3 py-2.5 transition-colors duration-200";
    }
    if (label === "Download Masterlist") {
      return "cursor-pointer text-black hover:bg-[#95bcc9] px-3 py-2.5 transition-colors duration-200 text-md";
    }
    return "cursor-pointer hover:bg-[#57a7bd] px-3 py-2.5 transition-colors duration-200 text-white";
  };

  // Handle selecting dates for the range
  const handleSelectDate = (date) => {
    if (!fromDate || (fromDate && toDate)) {
      // first click OR restarting selection
      setFromDate(date);
      setToDate(null);
    } else if (fromDate && !toDate) {
      // second click
      if (date < fromDate) {
        // swap so From is always earlier
        setToDate(fromDate);
        setFromDate(date);
      } else {
        setToDate(date);
      }
    }
  };

  const handlePlayerSelectDate = (date) => {
    if (!playerFromDate || (playerFromDate && playerToDate)) {
      setPlayerFromDate(date);
      setPlayerToDate(null);
    } else if (playerFromDate && !playerToDate) {
      if (date < playerFromDate) {
        setPlayerToDate(playerFromDate);
        setPlayerFromDate(date);
      } else {
        setPlayerToDate(date);
      }
    }
  };

  // Render one calendar
  const renderCalendar = (monthState) => {
    const year = monthState.getFullYear();
    const month = monthState.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    return (
      <div className="bg-white p-3 rounded shadow-md shadow-black/40 w-64 flex flex-col mx-1">
        <div className="text-center mb-2 font-semibold">
          {monthState.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="font-bold">
              {d}
            </div>
          ))}

          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);

            const isSelected =
              (fromDate && dateObj.toDateString() === fromDate.toDateString()) ||
              (toDate && dateObj.toDateString() === toDate.toDateString());

            const isInRange =
              fromDate && toDate && dateObj >= fromDate && dateObj <= toDate;

            return (
              <div
                key={day}
                onClick={() => handleSelectDate(dateObj)}
                className={`cursor-pointer py-1 rounded ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : isInRange
                    ? "bg-blue-200"
                    : "hover:bg-gray-200"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render player calendar
  const renderPlayerCalendar = (monthState) => {
    const year = monthState.getFullYear();
    const month = monthState.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    return (
      <div className="bg-white p-3 rounded shadow-md shadow-black/40 w-64 flex flex-col mx-1">
        {/* Month header */}
        <div className="text-center mb-2 font-semibold">
          {monthState.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="font-bold">
              {d}
            </div>
          ))}

          {/* Empty slots before the 1st day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);

            const isSelected =
              (playerFromDate &&
                dateObj.toDateString() === playerFromDate.toDateString()) ||
              (playerToDate &&
                dateObj.toDateString() === playerToDate.toDateString());

            const isInRange =
              playerFromDate &&
              playerToDate &&
              dateObj >= playerFromDate &&
              dateObj <= playerToDate;

            return (
              <div
                key={day}
                onClick={() => handlePlayerSelectDate(dateObj)}
                className={`cursor-pointer flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-200
                  ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : isInRange
                      ? "bg-blue-200 text-black"
                      : "hover:bg-gray-200"
                  }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  const shiftMonths = (direction) => {
    if (direction === "prev") {
      const newFrom = new Date(
        fromMonth.getFullYear(),
        fromMonth.getMonth() - 1,
        1
      );
      setFromMonth(newFrom);
      setToMonth(new Date(newFrom.getFullYear(), newFrom.getMonth() + 1, 1));
    } else if (direction === "next") {
      const newFrom = new Date(
        fromMonth.getFullYear(),
        fromMonth.getMonth() + 1,
        1
      );
      setFromMonth(newFrom);
      setToMonth(new Date(newFrom.getFullYear(), newFrom.getMonth() + 1, 1));
    }
  };

  const playerShiftMonths = (direction) => {
    if (direction === "prev") {
      const newFrom = new Date(
        playerFromMonth.getFullYear(),
        playerFromMonth.getMonth() - 1,
        1
      );
      setPlayerFromMonth(newFrom);
      setPlayerToMonth(new Date(newFrom.getFullYear(), newFrom.getMonth() + 1, 1));
    } else if (direction === "next") {
      const newFrom = new Date(
        playerFromMonth.getFullYear(),
        playerFromMonth.getMonth() + 1,
        1
      );
      setPlayerFromMonth(newFrom);
      setPlayerToMonth(new Date(newFrom.getFullYear(), newFrom.getMonth() + 1, 1));
    }
  };

  return (
    <>
      <nav className="bg-[#6CBFD6] text-white shadow-lg flex items-center justify-between">
        <ul className="flex items-center">
          {navItems.map((item) => (
            <li
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={getNavClass(item.label)}
            >
              {item.label}
            </li>
          ))}

          {/* List of Visitors Nav Item */}
          <li
            className="cursor-pointer text-black hover:bg-[#95bcc9] px-3 transition-colors duration-200 flex items-center gap-1"
            onClick={() => setShowCalendar((prev) => !prev)}
          >
            <span>List of Visitors:</span>
            <div className="relative">
              <label className="absolute top-0 left-2 text-xs">From:</label>
              <input
                readOnly
                value={fromDate ? formatDisplayDate(fromDate) : ""}
                className="pl-2 pt-3.5 pb-1 border w-[6.8rem] cursor-pointer"
                placeholder="Select date"
              />
            </div>
            <div className="relative">
              <label className="absolute top-0 left-2 text-xs">To:</label>
              <input
                readOnly
                value={toDate ? formatDisplayDate(toDate) : ""}
                className="pl-2 pt-3.5 pb-1 border w-[6.8rem] cursor-pointer"
                placeholder="Select date"
              />
            </div>
          </li>

          {/* List of New Players Nav Item */}
          <li
            className="cursor-pointer text-black hover:bg-[#95bcc9] px-3 transition-colors duration-200 flex items-center gap-1"
            onClick={() => setPlayerShowCalendar((prev) => !prev)}
          >
            <span>New Players list:</span>
            <div className="relative">
              <label className="absolute top-0 left-2 text-xs">From:</label>
              <input
                readOnly
                value={playerFromDate ? playerFormatDate(playerFromDate) : ""}
                className="pl-2 pt-3.5 pb-1 border w-[6.8rem] cursor-pointer"
                placeholder="Select date"
              />
            </div>
            <div className="relative">
              <label className="absolute top-0 left-2 text-xs">To:</label>
              <input
                readOnly
                value={playerToDate ? playerFormatDate(playerToDate) : ""}
                className="pl-2 pt-3.5 pb-1 border w-[6.8rem] cursor-pointer"
                placeholder="Select date"
              />
            </div>
          </li>

        </ul>
      </nav>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="absolute mt-2 ml-4 bg-white p-4 rounded-lg shadow-black/40 shadow-md z-50 flex flex-col"
          style={{ left: "480px", top: "86px" }}
        >
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => shiftMonths("prev")}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-500"
            >
              &lt;
            </button>
            <span className="font-semibold">Select Date Range</span>
            <button
              onClick={() => shiftMonths("next")}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-500"
            >
              &gt;
            </button>
          </div>

          {/* Two Calendars side by side */}
          <div className="flex">
            {renderCalendar(fromMonth)}
            {renderCalendar(toMonth)}
          </div>

          {/* Download Button */}
          <div className="mt-3 flex justify-end">
            <button
              disabled={!fromDate || !toDate}
              onClick={async () => {
                try {
                  const response = await fetch(
                    `${API_URL}/range/download?from=${formatForQuery(
                      fromDate
                    )}&to=${formatForQuery(toDate)}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${
                          Cookies.get("accessToken") || ""
                        }`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to download visits");
                  }

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute(
                    "download",
                    `Visits_${formatForQuery(fromDate)}_${formatForQuery(
                      toDate
                    )}.xlsx`
                  );
                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  enqueueSnackbar("Visits downloaded successfully!", {
                    variant: "success",
                  });

                  setFromDate(null);
                  setToDate(null);
                  // setShowCalendar(false); // Close the calendar popup automatically
                } catch (err) {
                  console.error(err);
                  enqueueSnackbar("Failed to download visits", {
                    variant: "error",
                  });
                }
              }}
              className={`px-4 py-2 rounded ${
                !fromDate || !toDate
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Download Visits
            </button>
          </div>
        </div>
      )}


      {/* Player Calendar Dropdown */}
      {playerShowCalendar && (
        <div
          ref={playerCalendarRef}
          className="absolute mt-2 ml-4 bg-white p-4 rounded-lg shadow-black/40 shadow-md z-50 flex flex-col"
          style={{ left: "840px", top: "86px" }}
        >
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => playerShiftMonths("prev")}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-500"
            >
              &lt;
            </button>
            <span className="font-semibold">Select Date Range</span>
            <button
              onClick={() => playerShiftMonths("next")}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-500"
            >
              &gt;
            </button>
          </div>

          {/* Two Calendars side by side */}
          <div className="flex">
            {renderPlayerCalendar(playerFromMonth)}
            {renderPlayerCalendar(playerToMonth)}
          </div>

          {/* Download Button */}
          <div className="mt-3 flex justify-end">
            <button
              disabled={!playerFromDate || !playerToDate}
              onClick={async () => {
                try {
                  const response = await fetch(
                    `${API_URL}/players/download?from=${formatForQuery(
                      playerFromDate
                    )}&to=${formatForQuery(playerToDate)}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${
                          Cookies.get("accessToken") || ""
                        }`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to download new players");
                  }

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute(
                    "download",
                    `New_Players_${formatForQuery(playerFromDate)}_${formatForQuery(
                      playerToDate
                    )}.xlsx`
                  );
                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  enqueueSnackbar("New Players downloaded successfully!", {
                    variant: "success",
                  });

                  setPlayerFromDate(null);
                  setPlayerToDate(null);
                  // setPlayerShowCalendar(false); // Close the calendar popup automatically
                } catch (err) {
                  console.error(err);
                  enqueueSnackbar("Failed to download new players", {
                    variant: "error",
                  });
                }
              }}
              className={`px-4 py-2 rounded ${
                !playerFromDate || !playerToDate
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Download New Players
            </button>
          </div>
        </div>
      )}

      {/* Popups */}
      {popupType === "addmember" && (
        <Popup onClose={() => setPopupType(null)}>
          <AddMember setPopupType={setPopupType} onMemberAdded={triggerRefetch} />
        </Popup>
      )}
      {popupType === "addbranch" && (
        <Popup onClose={() => setPopupType(null)}>
          <AddBranch setPopupType={setPopupType} onBranchAdded={onBranchAdded} />
        </Popup>
      )}
      {popupType === "adduser" && (
        <Popup onClose={() => setPopupType(null)}>
          <AddUser setPopupType={setPopupType} onUserAdded={onUserAdded} />
        </Popup>
      )}
    </>
  );
};

Navigation.propTypes = {
  onBranchAdded: PropTypes.func,
  onUserAdded: PropTypes.func,
  triggerRefetch: PropTypes.func,
};

export default Navigation;
