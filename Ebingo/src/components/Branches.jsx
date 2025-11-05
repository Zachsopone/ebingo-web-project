import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import Navigation from "./Navigation";
import Cookies from "js-cookie";
import { MdOutlineEdit, MdSave, MdCancel, MdDeleteOutline } from "react-icons/md";
import { useSnackbar } from "notistack"; 

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Branches = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [branches, setBranches] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedBranch, setEditedBranch] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = () => {
    axios
      .get(`${API_URL}/branches`)
      .then((res) => setBranches(res.data))
      .catch((err) => {
        console.error("Fetch error:", err);
        enqueueSnackbar("Failed to load branches.", { variant: "error" });
      });
  };

  const handleChange = (field, value) => {
    setEditedBranch((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditedBranch({ ...branches[index] });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedBranch({});
  };

  const handleSave = async () => {
    try {
      const { id, ...updatedData } = editedBranch;
      await axios.put(`${API_URL}/branches/${id}`, updatedData);
      const updated = [...branches];
      updated[editIndex] = editedBranch;
      setBranches(updated);
      setEditIndex(null);
      setEditedBranch({});
      enqueueSnackbar("Branch updated successfully.", { variant: "success" });
    } catch (err) {
      console.error("Save error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        enqueueSnackbar(err.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to update branch.", { variant: "error" });
      }
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
      enqueueSnackbar("Failed to delete branch.", { variant: "error" });
    } finally {
      setDeleteModalOpen(false);
      setBranchToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const handleBranchAdded = (newBranch) => {
    setBranches((prev) => [...prev, newBranch]);
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
      <Navigation onBranchAdded={handleBranchAdded} />
      <h1 className="flex justify-center text-xl my-4">Branches List</h1>

      <div className="h-auto w-full justify-center">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2">ID</th>
              <th className="border border-black p-2">Branch Name</th>
              <th className="border border-black p-2">Address</th>
              <th className="border border-black p-2">Contact Person</th>
              <th className="border border-black p-2">Contact Number</th>
              <th className="border border-black p-2">Position</th>
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
                        value={editedBranch.sname}
                        onChange={(e) => handleChange("sname", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      branch.sname
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedBranch.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      branch.address
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedBranch.cperson}
                        onChange={(e) => handleChange("cperson", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      branch.cperson
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedBranch.contact}
                        onChange={(e) => handleChange("contact", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      branch.contact
                    )}
                  </td>
                  <td className="border border-black p-1">
                    {isEditing ? (
                      <input
                        value={editedBranch.position}
                        onChange={(e) => handleChange("position", e.target.value)}
                        className="w-full border rounded px-1"
                      />
                    ) : (
                      branch.position
                    )}
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
                            <span className="tooltip">Edit Branch</span>
                            <MdOutlineEdit
                              onClick={() => handleEditClick(index)}
                              className="text-yellow-600 text-2xl cursor-pointer"
                            />
                          </div>
                          <div className="tooltip-container">
                            <span className="tooltip">Delete Branch</span>
                            <MdDeleteOutline
                              onClick={() => handleDeleteClick(branch, index)}
                              className="text-red-600 text-2xl cursor-pointer"
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