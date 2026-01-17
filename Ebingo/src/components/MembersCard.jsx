import { useState, useEffect } from "react";
import { MdOutlineEdit, MdCancel, MdSave, MdDeleteOutline} from "react-icons/md";
import { IoPersonAddSharp, IoPersonRemoveSharp } from "react-icons/io5";
import { FaClipboardList } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { useSnackbar } from "notistack";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import axios from "axios";
// import Profile from "./Profile";
import Viewer from "./Viewer";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const MembersCard = ({ user, onEdit, onDelete, onBan, onUnban, selectedOption }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [role, setRole] = useState("");
  const [showProfile, setShowProfile] = useState(false);


  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
      } catch (error) {
        console.error("Error decoding token", error);
      }
    }
  }, []);

  useEffect(() => {
    setNewData({
      id: selectedOption,
      fname: user.fname,
      mname: user.mname,
      lname: user.lname,
      age: user.age,
      permaddress: user.permaddress,
      cstatus: user.cstatus,
      cnumber: user.cnumber,
      email: user.email,
      now: user.now,
      risk_assessment: user.risk_assessment,
    });
  }, [selectedOption, user]);

  const [newData, setNewData] = useState({
    id: selectedOption,
    fname: user.fname,
    mname: user.mname,
    lname: user.lname,
    age: user.age,
    permaddress: user.permaddress,
    cstatus: user.cstatus,
    cnumber: user.cnumber,
    email: user.email,
    now: user.now,
    risk_assessment: user.risk_assessment,
  });

  const handleChange = (field) => (event) => {
    setNewData((prevData) => ({
      ...prevData,
      [field]: event.target.value,
    }));
  };

  const handleUpdate = () => {
    setIsEditing(false);
    onEdit(user.id, newData);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/members/${user.id}`);
      enqueueSnackbar("Member deleted successfully", { variant: "success" });
      setDeleteModalOpen(false);
      // Call parent handler to remove user from state directly
      onDelete(user.id);
    } catch (error) {
      console.error("Error deleting member:", error);
      enqueueSnackbar("Error deleting member", { variant: "error" });
      setDeleteModalOpen(false);
    }
  };

  const handleBan = () => {
    if (user.banned === 1) {
      enqueueSnackbar("The player is already banned!", {
        variant: "warning",
      });
    } else {
      setIsDeleting(true);
    }
  };
  
  const handleUnban = () => {
    if (user.banned === 0) {
      enqueueSnackbar("The player is not banned!", {
        variant: "warning",
      });
    } else {
      onUnban(user.id);
    }
  };

  const handleDownloadVisits = async () => {
    try {
      const response = await fetch(
        `${API_URL}/visits/download/${user.id}/${user.idnum}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        enqueueSnackbar("No visits found.", { variant: "error" });
        return;
      }

      const blob = await response.blob();
      saveAs(blob, `visits_${user.idnum}.xlsx`);
      enqueueSnackbar("Frequent of visits downloaded.", { variant: "success" });

    } catch {
      enqueueSnackbar("Error downloading visits.", { variant: "error" });
    }
  };

  const renderCell = (field, value) =>
    isEditing ? (
      <td>
        <input
          type="text"
          value={newData[field] || ""}
          onChange={handleChange(field)}
          className="border border-1 border-[#cccccc] rounded w-full min-h-5 max-w-full box-border"
        />
      </td>
    ) : (
      <td className="border border-black text-center">{value}</td>
    );

  return (
    <tr className={`h-8 ${user.banned === 1 ? "bg-red-200" : ""}`}>
      <td className="border border-black text-center h-4 w-8">{user.id}</td>
      {renderCell("fname", user.fname)}
      {renderCell("mname", user.mname)}
      {renderCell("lname", user.lname)}
      {renderCell("age", user.age)}
      {renderCell("permaddress", user.permaddress)}

      {isEditing ? (
        <td>
          <select
            value={newData.cstatus || ""}
            onChange={handleChange("cstatus")}
            className="border border-1 border-[#cccccc] rounded w-full min-h-5 max-w-full box-border"
          >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Widowed</option>
              <option value="Widowed">Legally Separated</option>
          </select>
        </td>
      ) : (
        <td className="border border-black text-center">{user.cstatus}</td>
      )}

      {renderCell("cnumber", user.cnumber)}
      <td className="border  border-black text-center">{user.idnum}</td>
      {renderCell("email", user.email)}
      {renderCell("now", user.now)}
        
      {isEditing ? (
        <td>
          <select
            value={newData.risk_assessment || ""}
            onChange={handleChange("risk_assessment")}
            className="border border-1 border-[#cccccc] rounded w-full min-h-5 max-w-full box-border"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </td>
      ) : (
        <td className="border border-black text-center">{user.risk_assessment}</td>
      )}

      <td className="border  border-black text-center w-24">
        <div className="flex justify-center gap-x-4">
          {isEditing ? (
            <>
              <div className="tooltip-container">
                <span className="tooltip">Save Details</span>
                <MdSave
                  className="text-2xl text-green-600 cursor-pointer"
                  onClick={handleUpdate}
                />
              </div>
              <div className="tooltip-container">
                <span className="tooltip">Cancel</span>
                <MdCancel
                  className="text-2xl text-red-600 cursor-pointer"
                  onClick={() => {
                    setNewData({
                      id: selectedOption,
                      fname: user.fname,
                      mname: user.mname,
                      lname: user.lname,
                      age: user.age,
                      permaddress: user.permaddress,
                      cstatus: user.cstatus,
                      cnumber: user.cnumber,
                      email: user.email,
                      now: user.now,
                      risk_assessment: user.risk_assessment,
                    });
                    setIsEditing(false);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="tooltip-container">
                <span className="tooltip">Edit Member</span>
                <MdOutlineEdit
                  className="text-2xl text-yellow-600 cursor-pointer"
                  onClick={() => setIsEditing(true)}
                />
              </div>
              {["kaizen", "superadmin"].includes(role.toLowerCase()) && (
                <div className="tooltip-container">
                  <span className="tooltip">Delete Member</span>
                  <MdDeleteOutline
                    className="text-2xl text-red-600 cursor-pointer"
                    onClick={() => setDeleteModalOpen(true)}
                  />
                </div>
              )}
              <div className="tooltip-container">
                <span className="tooltip">Ban Player</span>
                <IoPersonRemoveSharp
                  className="text-2xl text-red-600 cursor-pointer"
                  onClick={handleBan}
                />
              </div>
              <div className="tooltip-container">
                <span className="tooltip">Unban Player</span>
                <IoPersonAddSharp
                  className="text-2xl text-green-600 cursor-pointer"
                  onClick={handleUnban}
                />
              </div>
              <div className="tooltip-container">
                <span className="tooltip">Frequent of Visit</span>
                <FaClipboardList
                  className="text-2xl text-blue-600 cursor-pointer"
                  onClick={handleDownloadVisits}
                />
              </div>
              <div className="tooltip-container">
                <span className="tooltip">Profile</span>
                <CgProfile
                  className="text-2xl text-purple-600 cursor-pointer"
                  onClick={() => setShowProfile(true)}
                />
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">
                Are you sure you want to delete this member?
              </h3>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
              className="w-[25rem] h-[18rem] bg-white flex flex-col items-center gap-4 rounded-lg p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reason.trim()) {
                  enqueueSnackbar("State a reason of banning this member", { variant: "warning" });
                  return;
                }
                onBan(user.id, reason);
                setIsDeleting(false);
                setReason("");
              }}
            >
              <h1 className="text-lg mt-4 px-4 font-semibold text-black">
                Are you sure you want to ban this member?
              </h1>
              <textarea
                placeholder="Please enter the reason for banning this member"
                className="w-11/12 outline-none p-2 rounded border-2 border-black"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleting(false);
                    setReason("");
                  }}
                  className="rounded-md bg-red-600 hover:bg-red-700 p-2 w-32 transition text-black"
                >
                  No
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-green-700 hover:bg-green-900 text-white p-2 w-32 transition"
                >
                  Yes
                </button>
              </div>
            </form>
          </div>    
        )}
        {showProfile && (
          <Viewer memberId={user.id} onClose={() => setShowProfile(false)} />
        )}
      </td>
    </tr>
  );
};

MembersCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fname: PropTypes.string,
    mname: PropTypes.string,
    lname: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    permaddress: PropTypes.string,
    cstatus: PropTypes.string,
    cnumber: PropTypes.string,
    idnum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    email: PropTypes.string,
    now: PropTypes.string,
    risk_assessment: PropTypes.string,
    banned: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onBan: PropTypes.func.isRequired,
  onUnban: PropTypes.func.isRequired,
  selectedOption: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default MembersCard;
