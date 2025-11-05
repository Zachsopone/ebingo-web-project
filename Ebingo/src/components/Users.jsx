import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import Navigation from "./Navigation";
import Cookies from "js-cookie";
import { MdOutlineEdit, MdSave, MdCancel, MdDeleteOutline, MdLockReset } from "react-icons/md";
import { useSnackbar } from "notistack";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Users = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => {
        console.error("Fetch error:", err);
        enqueueSnackbar("Failed to fetch users.", { variant: "error" });
      });
  }, []);

  const handleChange = (field, value) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditedUser({ ...users[index] });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedUser({});
  };

  const handleSave = async () => {
    try {
      const { ID, ...updatedData } = editedUser; 

      const payload = { 
        ...updatedData, 
        Role: updatedData.Role ? updatedData.Role.toLowerCase() : "" 
      };

      const response = await axios.put(`${API_URL}/users/${ID}`, payload);

      const updated = [...users];
      updated[editIndex] = { ...response.data.newUser };
      setUsers(updated);
      setEditIndex(null);
      setEditedUser({});
      enqueueSnackbar("User updated successfully.", { variant: "success" });
    } catch (err) {
      console.error("Save error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to update user.", { variant: "error" });
      }
    }
  };

  const handleDeleteClick = (user, index) => {
    setUserToDelete({ user, index });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const { user, index } = userToDelete;
    try {
      await axios.delete(`${API_URL}/users/${user.ID}`);
      setUsers(users.filter((_, i) => i !== index));
      enqueueSnackbar("User deleted successfully.", { variant: "success" });
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to delete user.", { variant: "error" });
      }
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleChangePasswordClick = (user) => {
    setUserToChangePassword(user);
    setPasswordModalOpen(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = (field, value) => {
    if (field === "newPassword") {
      setNewPassword(value);
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      enqueueSnackbar("Passwords do not match.", { variant: "error" });
      return;
    }

    try {
      await axios.put(`${API_URL}/users/${userToChangePassword.ID}/password`, {
        newPassword,
        confirmPassword,
      });
      setPasswordModalOpen(false);
      setUserToChangePassword(null);
      setNewPassword("");
      setConfirmPassword("");
      enqueueSnackbar("Password updated successfully.", { variant: "success" });
    } catch (err) {
      console.error("Password update error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to update password.", { variant: "error" });
      }
    }
  };

  const cancelPasswordChange = () => {
    setPasswordModalOpen(false);
    setUserToChangePassword(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [newUser, ...prev]); // Add new user at the top
  };

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
    <>
      <Header />
      <Navigation onUserAdded={handleUserAdded} />
      <h1 className="flex justify-center text-xl my-4">Users List</h1>

      <div className="h-auto w-full justify-center">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2">ID</th>
              <th className="border border-black p-2">First Name</th>
              <th className="border border-black p-2">Middle Name</th>
              <th className="border border-black p-2">Last Name</th>
              <th className="border border-black p-2">Age</th>
              <th className="border border-black p-2">Contact Number</th>
              <th className="border border-black p-2">Address</th>
              <th className="border border-black p-2">Gender</th>
              <th className="border border-black p-2">Branch</th>
              <th className="border border-black p-2">Username</th>
              <th className="border border-black p-2">Role</th>
              <th className="border border-black p-2">Date Created</th>
              <th className="border border-black p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const isEditing = index === editIndex;
              return (
                <tr key={user.ID} className="text-center">
                  <td className="border border-black p-1">{user.ID}</td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Firstname || ""}
                        onChange={(e) => handleChange("Firstname", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Firstname
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Middlename || ""}
                        onChange={(e) => handleChange("Middlename", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Middlename
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Lastname || ""}
                        onChange={(e) => handleChange("Lastname", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Lastname
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Age || ""}
                        onChange={(e) => handleChange("Age", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Age
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Contactnumber || ""}
                        onChange={(e) => handleChange("Contactnumber", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Contactnumber
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Address || ""}
                        onChange={(e) => handleChange("Address", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Address
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <select
                        value={editedUser.Gender || ""}
                        onChange={(e) => handleChange("Gender", e.target.value)}
                        className="w-full border rounded px-1"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      user.Gender
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {user.Branch || "N/A"}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        type="email" 
                        value={editedUser.Username || ""}
                        onChange={(e) => handleChange("Username", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Username
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedUser.Role || ""}
                        onChange={(e) => handleChange("Role", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      user.Role
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {user.Date_created}
                  </td>
                  <td className="border border-black p-1">
                    <div className="flex justify-center gap-3">
                      {isEditing ? (
                        <>
                          <div className="tooltip-container">
                            <MdSave
                              onClick={handleSave}
                              className="text-green-600 text-2xl cursor-pointer"
                            />
                          </div>
                          <div className="tooltip-container">
                            <MdCancel
                              onClick={handleCancel}
                              className="text-red-600 text-2xl cursor-pointer"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="tooltip-container">
                            <span className="tooltip">Edit User</span>
                            <MdOutlineEdit
                              onClick={() => handleEditClick(index)}
                              className="text-yellow-600 text-2xl cursor-pointer"
                            />
                          </div>
                          <div className="tooltip-container">
                            <span className="tooltip">Delete User</span>
                            <MdDeleteOutline
                              onClick={() => handleDeleteClick(user, index)}
                              className="text-red-600 text-2xl cursor-pointer"
                            />
                          </div>
                          <div className="tooltip-container">
                            <span className="tooltip">Change Password</span>
                            <MdLockReset
                              onClick={() => handleChangePasswordClick(user)}
                              className="text-blue-600 text-2xl cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <footer className="w-full mt-12 bg-[#6CBFD6] text-white text-center py-3">
          <p>© {new Date().getFullYear()} Ebingo. All Rights Reserved.</p>
        </footer>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this user?
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

      {/* Password Change Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={cancelPasswordChange}
              className="absolute top-2 left-2 text-gray-600 hover:text-gray-800"
            >
              &#x2715;
            </button>
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                required
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                required
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
              >
                Reset Password
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

export default Users;