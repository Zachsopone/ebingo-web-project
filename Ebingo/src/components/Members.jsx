import { useEffect, useState, useContext } from "react";
import axios from "axios";
import MembersCard from "./MembersCard";
import { useSnackbar } from "notistack";
import { TbRefresh } from "react-icons/tb";
import { SelectedOptionContext } from "../context/OptionContext";
import Cookies from "js-cookie";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Members = ({ fixedBranchId, refetchKey }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [refetchKeyload, setRefetchKey] = useState(0);
  const { selectedOption, setSelectedOption } = useContext(SelectedOptionContext);
  const [role, setRole] = useState("");
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState(""); 


  useEffect(() => {
    const handleMemberAdded = () => {
      setRefetchKey((prev) => prev + 1);
    };

    const handleMemberDeleted = () => {
      setRefetchKey((prev) => prev + 1);
    };

    window.addEventListener("memberAdded", handleMemberAdded);
    window.addEventListener("memberDeleted", handleMemberDeleted);

    return () => {
      window.removeEventListener("memberAdded", handleMemberAdded);
      window.removeEventListener("memberDeleted", handleMemberDeleted);
    };
  }, []);
  

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
        if (payload.role.toLowerCase() === "cashier" && fixedBranchId) {
          setSelectedOption(fixedBranchId);
        }
      } catch (error) {
        console.error("Error decoding token", error);
      }
    }
  }, [setSelectedOption, fixedBranchId]);


  useEffect(() => {
    axios.get(`${API_URL}/branches`)
      .then((res) => setBranches(res.data))
      .catch((err) => console.error("Error fetching branches", err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedOption) return;
      try {
        const response = await axios.post(
          `${API_URL}/members/view`,
          { branch_id: selectedOption }
        );
        setUsers(response.data.data);
        setFilteredUsers(response.data.data); // reset filtered list
      } catch (error) {
        console.error("Error fetching data:", error); 
      }
    };
    fetchData();
  }, [refetchKey, selectedOption, refetchKeyload]);

  const handleEdit = async (id, newData) => {
    try {
      await axios.put(`${API_URL}/members/${id}`, newData);
      enqueueSnackbar("The member was updated successfully", { variant: "success" });
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error("Error updating member:", error);
      enqueueSnackbar("Error updating member", { variant: "error" });
    }
  };

  const handleDelete = (id) => {
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
    setFilteredUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
  };

  const handleBan = async (id, reason) => {
    const payload = { branch_id: selectedOption, reason };
    try {
      await axios.post(`${API_URL}/status/ban/${id}`, payload);
      enqueueSnackbar("Member was banned successfully", { variant: "success" });
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      if (error.response?.data) {
        enqueueSnackbar(error.response.data, { variant: "error" });
      } else {
        enqueueSnackbar("Error banning member", { variant: "error" });
      }
    }
  };

  const handleUnban = async (id) => {
    try {
      await axios.post(`${API_URL}/status/unban/${id}`, { branch_id: selectedOption });
      enqueueSnackbar("Member unbanned successfully", { variant: "success" });
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error("Error unbanning member:", error);
      enqueueSnackbar("Error unbanning member", { variant: "error" });
    }
  };

  //SEARCH FUNCTION
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      setSearchMessage("");
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const results = users.filter(user => {
      const fullName1 = `${user.fname} ${user.mname} ${user.lname}`.toLowerCase();
      const fullName2 = `${user.lname} ${user.fname} ${user.mname}`.toLowerCase();
      return (
        fullName1.includes(term) ||
        fullName2.includes(term) ||
        (user.Card_No && user.Card_No.toString().toLowerCase().includes(term))
      );
    });

    setFilteredUsers(results);
    setSearchMessage(results.length === 0 ? "No member found. Please try again." : "");
  };

  const renderDropdown = () => {
    if (role.toLowerCase() === "cashier") {
      const selectedBranch = branches.find((b) => b.id === parseInt(selectedOption));

      return (
        <select
          id="branchoptions"
          value={selectedOption}
          // onChange={(e) => setSelectedOption(e.target.value)}
          readOnly
          className="w-[30%] outline-none border ml-4 p-2 border-black rounded-md bg-gray-200"
        >
          <option value={selectedOption}>
            {selectedBranch ? selectedBranch.sname : "Loading..."}
          </option>
        </select>
      );
    } else {
      return (
        <select
          id="branchoptions"
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          className="w-[30%] outline-none border ml-4 p-2 border-black rounded-md"
        >
          <option value="">Choose Branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.sname}
            </option>
          ))}
        </select>
      );
    }
  };

  return (
    <div className="w-full h-auto flex justify-center items-center">
      <div className="h-auto w-full">

        {/* 🔹 DROPDOWN + SEARCH */}
        <div className="w-full flex flex-row justify-between items-center pt-5 pb-4 px-4">
          {renderDropdown()}
          <div className="flex">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition"
            >
              Search Member
            </button>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === "") {
                  setFilteredUsers(users);
                  setSearchMessage("");
                }
              }}
              placeholder="Enter name or Card No"
              className="p-2 border border-black"
            />
          </div>
          <TbRefresh
            className="text-2xl cursor-pointer"
            onClick={() => setRefetchKey(prev => prev + 1)}
          />
        </div>

        <h1 className="flex justify-center text-xl pb-4">Members List</h1>

        {searchMessage && (
          <p className="text-center text-red-600 font-semibold mb-2">{searchMessage}</p>
        )}

        <table className="w-full border-collapse h-8 text-sm">
          <thead>
            <tr>
              <th className="border border-black rounded-md">ID</th>
              <th className="border border-black rounded-md">First Name</th>
              <th className="border border-black rounded-md">Middle Name</th>
              <th className="border border-black rounded-md">Last Name</th>
              <th className="border border-black rounded-md">Age</th>
              <th className="border border-black rounded-md">Permanent Address</th>
              <th className="border border-black rounded-md">Civil Status</th>
              <th className="border border-black rounded-md">Contact Number</th>
              <th className="border border-black rounded-md">Card Number</th>
              <th className="border border-black rounded-md">Email Address</th>
              <th className="border border-black rounded-md">Nature of Work</th>
              <th className="border border-black rounded-md">Risk Assessment</th>
              <th className="border border-black rounded-md">Edit Ban Unban Visit Profile</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <MembersCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onBan={handleBan}
                onUnban={handleUnban}
                onDelete={handleDelete}
                selectedOption={selectedOption}
              />
            ))}
          </tbody>
        </table>
        <footer className="w-full mt-12 bg-[#6CBFD6] text-white text-center py-3">
          <p>© {new Date().getFullYear()} Ebingo. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

Members.propTypes = {
  fixedBranchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  refetchKey: PropTypes.number,
};

export default Members;