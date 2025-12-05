import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Header from "./Header";
import Navigation from "./Navigation";
import Cookies from "js-cookie";
import { MdOutlineEdit, MdSave, MdCancel, MdDeleteOutline, MdMoreTime } from "react-icons/md";
import { useSnackbar } from "notistack";

const parseBackendDatetimeUTC = (mysqlDatetime) => {
  if (!mysqlDatetime) return null;
  let s = mysqlDatetime.replace(" ", "T");

  const match = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return null;

  const [, yy, mm, dd, hh, min] = match;

  return {
    year: Number(yy),
    month: Number(mm),
    day: Number(dd),
    hour: Number(hh),
    minute: Number(min),
  };
};

// Convert 24h → 12h
const to12HourParts = (hour24, minute) => {
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 || 12;
  return {
    hour: String(h12).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    ampm,
  };
};

// FIXED READ-ONLY DISPLAY
const formatDateTimeDisplay = (mysqlDatetime) => {
  if (!mysqlDatetime) return "";

  const p = parseBackendDatetimeUTC(mysqlDatetime);
  if (!p) return "";

  // Build pure UTC date for formatting only date portion
  const utcDate = new Date(Date.UTC(p.year, p.month - 1, p.day));

  const dateStr = utcDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const { hour, minute, ampm } = to12HourParts(p.hour, p.minute);

  return `${dateStr} • ${hour}:${minute} ${ampm}`;
};

// FIXED DROPDOWN PRE-SELECT
const mysqlToParts = (mysqlDatetime) => {
  if (!mysqlDatetime) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const { hour, minute, ampm } = to12HourParts(now.getHours(), now.getMinutes());
    return { date: `${y}-${m}-${d}`, hour, minute, ampm };
  }

  const p = parseBackendDatetimeUTC(mysqlDatetime);
  if (!p) return mysqlToParts(null);

  const date = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const { hour, minute, ampm } = to12HourParts(p.hour, p.minute);

  return { date, hour, minute, ampm };
};


// Convert parts to MySQL DATETIME string (local)
const partsToMySQLUTC = (dateStr, hourStr, minuteStr, ampm) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  let hour = parseInt(hourStr, 10);
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  // Create a local Date first
  const localDate = new Date(y, m - 1, d, hour, parseInt(minuteStr, 10), 0);
  // Convert to UTC string for MySQL
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
  return `${utcDate.getFullYear()}-${String(utcDate.getMonth() + 1).padStart(2, "0")}-${String(
    utcDate.getDate()
  ).padStart(2, "0")} ${String(utcDate.getHours()).padStart(2, "0")}:${String(
    utcDate.getMinutes()
  ).padStart(2, "0")}:00`;
};

const DateTimeDropdown = ({ initialDatetime, onCancel, onOk, onClose }) => {
  // initialDatetime is a MySQL DATETIME or empty
  const containerRef = useRef(null);
  const { date, hour, minute, ampm } = mysqlToParts(initialDatetime);

  const [selDate, setSelDate] = useState(date);
  const [selHour, setSelHour] = useState(hour);
  const [selMinute, setSelMinute] = useState(minute);
  const [selAmpm, setSelAmpm] = useState(ampm);

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    const parts = mysqlToParts(initialDatetime);
    setSelDate(parts.date);
    setSelHour(parts.hour);
    setSelMinute(parts.minute);
    setSelAmpm(parts.ampm);
  }, [initialDatetime]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div ref={containerRef} className="absolute z-40 w-80 bg-white border rounded shadow-lg p-3">
      <div className="flex flex-col gap-3">
        {/* Date */}
        <div>
          <label className="text-xs block mb-1">Date</label>
          <input
            type="date"
            value={selDate}
            min={todayStr}   // <-- prevent selecting past dates
            onChange={(e) => setSelDate(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
          />
        </div>

        {/* Time */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1">Hour</label>
            <select
              value={selHour}
              onChange={(e) => setSelHour(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs block mb-1">Minute</label>
            <select
              value={selMinute}
              onChange={(e) => setSelMinute(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="w-20">
            <label className="text-xs block mb-1">AM/PM</label>
            <select
              value={selAmpm}
              onChange={(e) => setSelAmpm(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-2 flex justify-between">
          <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm" type="button">Cancel</button>
          <button onClick={() => onOk(partsToMySQLUTC(selDate, selHour, selMinute, selAmpm))} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm" type="button">OK</button>
        </div>
      </div>
    </div>
  );
};

DateTimeDropdown.propTypes = {
  initialDatetime: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

DateTimeDropdown.defaultProps = {
  initialDatetime: "",
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Branches = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [branches, setBranches] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedBranch, setEditedBranch] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const [dtDropdown, setDtDropdown] = useState({ open: false, field: null, index: null, anchorRect: null });
  const dropdownContainerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { fetchBranches(); }, []);


  const fetchBranches = () => {
    // read role/branch info saved at login
    const role = Cookies.get("userRole") || "";       // make sure you set this at login
    const branchId = Cookies.get("userBranchId") || ""; // make sure you set this at login

    // If user is superadmin and branch id exists, send it in the body (POST).
    // Also set withCredentials so cookies (accessToken) will be sent to the API.
    if (role.toLowerCase() === "superadmin" && branchId) {
      axios
        .post(
          `${API_URL}/branches`,
          { branch_id: branchId },
          { withCredentials: true } // important -> send cookie
        )
        .then((res) => setBranches(res.data))
        .catch((err) => {
          console.error("Branches load error (POST):", err);
          enqueueSnackbar("Failed to load branches.", { variant: "error" });
        });
    } else {
      // other roles: fall back to GET (public)
      axios
        .get(`${API_URL}/branches`)
        .then((res) => setBranches(res.data))
        .catch((err) => {
          console.error("Branches load error (GET):", err);
          enqueueSnackbar("Failed to load branches.", { variant: "error" });
        });
    }
  };

  const handleUpdateBranchTime = async (b) => {
    if (!b.opening_time || !b.closing_time) {
      enqueueSnackbar(`Please set both opening and closing time for ${b.sname}.`, { variant: "warning" });
      return;
    }

    const open = new Date(b.opening_time);
    const close = new Date(b.closing_time);

    if (open >= close) {
      enqueueSnackbar("Opening time must be before closing time", { variant: "error" });
      return;
    }

    try {
      await axios.put(`${API_URL}/branches/${b.id}/time`, {
        opening_time: b.opening_time,
        closing_time: b.closing_time,
      });
      enqueueSnackbar(`${b.sname} time updated successfully.`, { variant: "success" });
    } catch (err) {
      console.error("Time update error:", err);
      enqueueSnackbar(`Failed to update times for ${b.sname}.`, { variant: "error" });
    }
  };
  
  const handleChange = (field, value) => setEditedBranch(prev => ({ ...prev, [field]: value }));

  const handleEditClick = (index) => { setEditIndex(index); setEditedBranch({ ...branches[index] }); };

  const handleCancel = () => { setEditIndex(null); setEditedBranch({}); setDtDropdown({ open: false, field: null, index: null, anchorRect: null }); };

  const handleSave = async () => {
    try {
      const { id, ...updatedData } = editedBranch;
      await axios.put(`${API_URL}/branches/${id}`, updatedData);
      const updated = [...branches];
      updated[editIndex] = { ...updated[editIndex], ...editedBranch };
      setBranches(updated);
      setEditIndex(null);

      setEditedBranch({});
      enqueueSnackbar("Branch updated successfully.", { variant: "success" });
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to update branch.", { variant: "error" });
      }
    } finally {
      setDtDropdown({ open: false, field: null, index: null, anchorRect: null });
    }
  };

  const handleDeleteClick = (branch, index) => { setBranchToDelete({ branch, index }); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!branchToDelete) return;
    const { branch, index } = branchToDelete;
    try {
      await axios.delete(`${API_URL}/branches/${branch.id}`);
      setBranches(branches.filter((_, i) => i !== index));
      enqueueSnackbar("Branch deleted successfully.", { variant: "success" });
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to delete branch.", { variant: "error" });
      }
    } finally {
      setDeleteModalOpen(false);
      setBranchToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const handleBranchAdded = (newBranch) => setBranches(prev => [...prev, newBranch]);

  const handleLogout = () => {
    axios
      .post(`${API_URL}/auth/logout`)
      .then(() => {
        Cookies.remove("accessToken");
        window.location.href = "/";
      })
      .catch((err) => console.error("Logout error:", err));
  };

  // open datetime dropdown anchored to element
  const openDtDropdown = (field, index, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDtDropdown({ open: true, field, index, anchorRect: rect });
  };

  const closeDtDropdown = () => setDtDropdown({ open: false, field: null, index: null, anchorRect: null });

  // Cancel inside dropdown: do not change branch value (just close)
  const onDateTimeCancel = () => closeDtDropdown();

  const onDateTimeOk = (mysqlDatetime) => {
    const { field, index } = dtDropdown;
    if (index === null || index === undefined) return closeDtDropdown();

    setBranches((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: mysqlDatetime };
      return updated;
    });

    if (editIndex === index) {
      setEditedBranch((prev) => ({ ...prev, [field]: mysqlDatetime }));
    }

    closeDtDropdown();
  };

  const computeDropdownStyle = () => {
    if (!dtDropdown.open || !dtDropdown.anchorRect || !containerRef.current) return { display: "none" };
    const containerBox = containerRef.current.getBoundingClientRect();
    const anchor = dtDropdown.anchorRect;
    return { position: "absolute", top: anchor.bottom - containerBox.top + 4, left: anchor.left - containerBox.left, zIndex: 9999 };
  };

  return (
    <>
      <Header />
      <Navigation onBranchAdded={handleBranchAdded} />
      <h1 className="flex justify-center text-xl my-4">Branches List</h1>

      <div className="h-auto w-full justify-center relative" ref={containerRef}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2">ID</th>
              <th className="border border-black p-2">Venue Name</th>
              <th className="border border-black p-2">Address</th>
              <th className="border border-black p-2">Venue Email Address</th>
              <th className="border border-black p-2">Opening Time</th>
              <th className="border border-black p-2">Closing Time</th>
              <th className="border border-black p-2">Actions</th>
            </tr>
          </thead>
            <tbody>
              {branches.map((branch, index) => {
                  const isEditing = index === editIndex;
                  return (
                  <tr key={branch.id} className="text-center">
                      <td className="border border-black p-1">{branch.id}</td>

                      <td className="border border-black p-1">
                          {isEditing ? (
                              <input
                                  value={editedBranch.sname || ""}
                                  onChange={(e) => handleChange("sname", e.target.value)}
                                  className="w-full border rounded px-1"
                              />
                          ) : branch.sname}
                      </td>

                      <td className="border border-black p-1">
                          {isEditing ? (
                              <input
                                  value={editedBranch.address || ""}
                                  onChange={(e) => handleChange("address", e.target.value)}
                                  className="w-full border rounded px-1"
                              />
                          ) : branch.address}
                      </td>

                      <td className="border border-black p-1">
                          {isEditing ? (
                              <input
                                  value={editedBranch.branchemail || ""}
                                  onChange={(e) => handleChange("branchemail", e.target.value)}
                                  className="w-full border rounded px-1"
                              />
                          ) : branch.branchemail}
                      </td>

                      {/* OPENING TIME */}
                      <td className="border border-black p-1">
                        <input
                          readOnly
                          value={formatDateTimeDisplay(branch.open_time)}
                          onClick={(e) => { if (isEditing) return; openDtDropdown("open_time", index, e);}}
                          className="w-38 border rounded cursor-pointer bg-white text-sm p-1"
                        />
                      </td>

                      {/* CLOSING TIME */}
                      <td className="border border-black p-1">
                        <input
                          readOnly
                          value={formatDateTimeDisplay(branch.close_time)}
                          onClick={(e) => { if (isEditing) return; openDtDropdown("close_time", index, e);}}
                          className="w-38 border rounded cursor-pointer bg-white text-sm p-1"
                        />
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="border border-black p-1">
                          <div className="flex justify-center gap-3">

                              <MdMoreTime
                                onClick={handleUpdateBranchTime}
                                className="text-green-600 text-2xl cursor-pointer"
                              />

                              {/* EDIT / SAVE */}
                              {isEditing ? (
                                  <>
                                      <MdSave
                                          onClick={handleSave}
                                          className="text-green-600 text-2xl cursor-pointer"
                                      />
                                      <MdCancel
                                          onClick={handleCancel}
                                          className="text-red-600 text-2xl cursor-pointer"
                                      />
                                  </>
                              ) : (
                                  <>
                                      <MdOutlineEdit
                                          onClick={() => handleEditClick(index)}
                                          className="text-yellow-600 text-2xl cursor-pointer"
                                      />
                                      <MdDeleteOutline
                                          onClick={() => handleDeleteClick(branch, index)}
                                          className="text-red-600 text-2xl cursor-pointer"
                                      />
                                  </>
                              )}
                          </div>
                      </td>
                  </tr>
                  );
              })}
            </tbody>
        </table>

        {/* DateTime dropdown (single instance) */}
        {dtDropdown.open && (
          <div
            ref={dropdownContainerRef}
            style={computeDropdownStyle()}
            className="z-50 absolute"
          >
            <DateTimeDropdown
              initialDatetime={branches[dtDropdown.index]?.[dtDropdown.field] || ""}
              onCancel={onDateTimeCancel}
              onOk={onDateTimeOk}
              onClose={onDateTimeCancel}
            />
          </div>
        )}
      </div>
      
      <footer className="w-full mt-12 bg-[#6CBFD6] text-white text-center py-3">
        <p>© {new Date().getFullYear()} Ebingo. All Rights Reserved.</p>
      </footer>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this branch?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-500 absolute top-[51px] px-3 py-2.5 right-0 text-white shadow-md hover:bg-red-600 transition-colors duration-200"
      >
        Logout
      </button>
    </>
  );
};

export default Branches;
