import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Header from "./Header";
import Navigation from "./Navigation";
import Cookies from "js-cookie";
import { MdOutlineEdit, MdSave, MdCancel, MdDeleteOutline, MdMoreTime } from "react-icons/md";
import { useSnackbar } from "notistack";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Helper: parse MySQL DATETIME string into local JS Date
const parseMySQLDatetimeLocal = (mysqlDatetime) => {
  if (!mysqlDatetime) return null;
  const [datePart, timePart] = mysqlDatetime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second); // local time
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

// Convert parts to MySQL DATETIME string (local)
const partsToMySQL = (dateStr, hourStr, minuteStr, ampm) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  let hour = parseInt(hourStr, 10);
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const dt = new Date(y, m - 1, d, hour, parseInt(minuteStr, 10), 0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}:00`;
};

// Format MySQL DATETIME for display
const formatDateTimeDisplay = (mysqlDatetime) => {
  if (!mysqlDatetime) return "";
  const dt = parseMySQLDatetimeLocal(mysqlDatetime);
  if (!dt) return "";
  return dt.toLocaleString([], { 
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true 
  });
};

// DateTimeDropdown component
const DateTimeDropdown = ({ initialDatetime, onCancel, onOk, onClose }) => {
  const containerRef = useRef(null);
  const dt = parseMySQLDatetimeLocal(initialDatetime) || new Date();
  const { hour, minute, ampm } = to12HourParts(dt.getHours(), dt.getMinutes());

  const [selDate, setSelDate] = useState(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`);
  const [selHour, setSelHour] = useState(hour);
  const [selMinute, setSelMinute] = useState(minute);
  const [selAmpm, setSelAmpm] = useState(ampm);

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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
        <div>
          <label className="text-xs block mb-1">Date</label>
          <input type="date" value={selDate} min={todayStr} onChange={(e)=>setSelDate(e.target.value)} className="w-full border px-2 py-1 rounded text-sm" />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1">Hour</label>
            <select value={selHour} onChange={(e)=>setSelHour(e.target.value)} className="w-full border px-2 py-1 rounded text-sm">
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs block mb-1">Minute</label>
            <select value={selMinute} onChange={(e)=>setSelMinute(e.target.value)} className="w-full border px-2 py-1 rounded text-sm">
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="text-xs block mb-1">AM/PM</label>
            <select value={selAmpm} onChange={(e)=>setSelAmpm(e.target.value)} className="w-full border px-2 py-1 rounded text-sm">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex justify-between">
          <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm" type="button">Cancel</button>
          <button onClick={() => onOk(partsToMySQL(selDate, selHour, selMinute, selAmpm))} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm" type="button">OK</button>
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

// Main Branches component
const Branches = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [branches, setBranches] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedBranch, setEditedBranch] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); const [branchToDelete, setBranchToDelete] = useState(null);
  const [dtDropdown, setDtDropdown] = useState({ open: false, field: null, index: null, anchorRect: null });
  const containerRef = useRef(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const role = Cookies.get("userRole") || "";
      const branchId = Cookies.get("userBranchId") || "";
      let res;
      if (role.toLowerCase() === "superadmin" && branchId) {
        res = await axios.post(`${API_URL}/branches`, { branch_id: branchId }, { withCredentials: true });
      } else {
        res = await axios.get(`${API_URL}/branches`);
      }
      setBranches(res.data);
    } catch (err) {
      console.error(err);
      console.error("Branches load error:", err);
      enqueueSnackbar("Failed to load branches.", { variant: "error" });
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

  const handleDeleteClick = (branch, index) => {
    setBranchToDelete({ branch, index });
    setDeleteModalOpen(true);
  };

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

  // Datetime dropdown handlers
  const openDtDropdown = (field, index, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDtDropdown({ open: true, field, index, anchorRect: rect });
  };

  const closeDtDropdown = () => setDtDropdown({ open: false, field: null, index: null, anchorRect: null });

  const onDateTimeCancel = () => closeDtDropdown();

  const onDateTimeOk = (mysqlDatetime) => {
    const { field, index } = dtDropdown;
    if (index === null || index === undefined) { closeDtDropdown(); return; }

    setBranches(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: mysqlDatetime };
      return updated;
    });

    if (editIndex === index) {
      setEditedBranch(prev => ({ ...prev, [field]: mysqlDatetime }));
    }

    closeDtDropdown();
  };

  const handleUpdateTime = async (branch) => {
    // Validate times before sending
    const openTime = parseMySQLDatetimeLocal(branch.open_time);
    const closeTime = parseMySQLDatetimeLocal(branch.close_time);
    if (!openTime || !closeTime) {
      enqueueSnackbar("Please set both opening and closing time.", { variant: "warning" });
      return;
    }
    if (openTime >= closeTime) {
      enqueueSnackbar("Opening time must be before closing time.", { variant: "error" });
      return;
    }

    try {
      await axios.put(`${API_URL}/branches/${branch.id}/time`, {
        open_time: branch.open_time,
        close_time: branch.close_time
      });
      enqueueSnackbar(`${branch.sname} time updated successfully.`, { variant: "success" });
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Failed to update branch times.", { variant: "error" });
    }
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
              <th className="border border-black p-2">Venue Email</th>
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
                    {isEditing ? <input value={editedBranch.sname || ""} onChange={(e)=>handleChange("sname", e.target.value)} className="w-full border rounded px-1"/> : branch.sname}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? <input value={editedBranch.address || ""} onChange={(e)=>handleChange("address", e.target.value)} className="w-full border rounded px-1"/> : branch.address}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? <input value={editedBranch.branchemail || ""} onChange={(e)=>handleChange("branchemail", e.target.value)} className="w-full border rounded px-1"/> : branch.branchemail}
                  </td>
                  <td className="border border-black p-1">
                    <input
                      readOnly
                      value={formatDateTimeDisplay(branch.open_time)}
                      onClick={(e)=>openDtDropdown("open_time", index, e)}
                      className="w-38 border rounded cursor-pointer bg-white text-sm p-1"
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      readOnly
                      value={formatDateTimeDisplay(branch.close_time)}
                      onClick={(e)=>openDtDropdown("close_time", index, e)}
                      className="w-38 border rounded cursor-pointer bg-white text-sm p-1"
                    />
                  </td>
                  <td className="border border-black p-1">
                    <div className="flex justify-center gap-3">
                      <MdMoreTime onClick={() => handleUpdateTime(branch)} className="text-green-600 text-2xl cursor-pointer"/>
                      {isEditing ? (
                        <>
                          <MdSave onClick={handleSave} className="text-green-600 text-2xl cursor-pointer"/>
                          <MdCancel onClick={handleCancel} className="text-red-600 text-2xl cursor-pointer"/>
                        </>
                      ) : (
                        <>
                          <MdOutlineEdit onClick={() => handleEditClick(index)} className="text-yellow-600 text-2xl cursor-pointer"/>
                          <MdDeleteOutline onClick={() => handleDeleteClick(branch, index)} className="text-red-600 text-2xl cursor-pointer"/>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {dtDropdown.open && (
          <div style={{ position: "absolute", zIndex: 50, top: dtDropdown.anchorRect?.bottom || 0, left: dtDropdown.anchorRect?.left || 0 }}>
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
