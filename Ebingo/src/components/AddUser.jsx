import { useState, useEffect } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const UserBranch = ({ setPopupType, onUserAdded }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [branches, setBranches] = useState([]);
  const [values, setValues] = useState({
    Firstname: "",
    Middlename: "",
    Lastname: "",
    Age: "",
    Contactnumber: "",
    Emailaddress: "",
    Address: "",
    Gender: "",
    Username: "",
    Password: "",
    Role: "",
  });

  const { enqueueSnackbar } = useSnackbar();


  useEffect(() => {
    axios
      .get(`${API_URL}/branches`)
      .then((res) => {
        console.log("Branches fetched:", res.data);
        setBranches(res.data);
      })
      .catch((err) => {
        console.error("Branch fetch error:", err);
        enqueueSnackbar("Failed to fetch branches", { variant: "error" });
      });
  }, [enqueueSnackbar]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFields = [
      "Firstname",
      "Middlename",
      "Lastname",
      "Age",
      "Contactnumber",
      "Emailaddress",
      "Address",
      "Gender",
      "Username",
      "Password",
      "Role",
    ];
    const missingFields = requiredFields.filter((field) => !values[field]);

    if (missingFields.length > 0) {
      enqueueSnackbar(`Missing required fields: ${missingFields.join(", ")}`, {
        variant: "error",
      });
      return;
    }

    if (!selectedOption) {
      enqueueSnackbar("Please select a branch", { variant: "error" });
      return;
    }

    if (values.Emailaddress !== values.Username) {
      enqueueSnackbar("Email Address and Username must be the same", { variant: "error" });
      return;
    }

    try {
      const dataToSend = {
        ...values,
        Branch_ID: selectedOption,
        Role: values.Role.toLowerCase(),
      };

      console.log("Sending user data:", dataToSend);
      const response = await axios.post(`${API_URL}/users/add`, dataToSend);

      const newUser = response.data.newUser;

      if (onUserAdded) {
        onUserAdded(newUser);
      }

      enqueueSnackbar("User added successfully!", { variant: "success" });
      setPopupType(null);
    } catch (error) {
      console.error("Error adding user:", error);
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) {
          enqueueSnackbar(`Error: ${data.error}`, { variant: "error" });
        } else if (status === 500) {
          enqueueSnackbar("Server error. Please try again later.", { variant: "error" });
        } else {
          enqueueSnackbar(`Error: ${data.error || "Unknown error"}`, { variant: "error" });
        }
      } else if (error.request) {
        enqueueSnackbar("Network error. Please check your connection.", { variant: "error" });
      } else {
        enqueueSnackbar(`Request error: ${error.message}`, { variant: "error" });
      }
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="h-auto w-4/5 bg-[#F2F0EA] border border-black rounded-lg px-6 pb-6 pt-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              placeholder="First Name"
              required
              value={values.Firstname}
              onChange={(e) => setValues({ ...values, Firstname: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Middle Name</label>
            <input
              type="text"
              placeholder="Middle Name"
              required
              value={values.Middlename}
              onChange={(e) => setValues({ ...values, Middlename: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              placeholder="Last Name"
              required
              value={values.Lastname}
              onChange={(e) => setValues({ ...values, Lastname: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Age</label>
            <input
              type="number"
              placeholder="Age"
              required
              value={values.Age}
              onChange={(e) => setValues({ ...values, Age: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Contact Number</label>
            <input
              type="text"
              placeholder="Contact Number"
              required
              value={values.Contactnumber}
              onChange={(e) => setValues({ ...values, Contactnumber: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Email Address"
              required
              value={values.Emailaddress}
              onChange={(e) => setValues({ ...values, Emailaddress: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Address</label>
            <input
              type="text"
              placeholder="Address"
              required
              value={values.Address}
              onChange={(e) => setValues({ ...values, Address: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Gender</label>
            <select
              value={values.Gender}
              onChange={(e) => setValues({ ...values, Gender: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Branch</label>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full p-2 border border-black rounded-md outline-none"
              required
            >
              <option value="">Choose Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.sname}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Username</label>
            <input
              type="email"
              placeholder="Username (must be email)"
              required
              value={values.Username}
              onChange={(e) => setValues({ ...values, Username: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              required
              value={values.Password}
              onChange={(e) => setValues({ ...values, Password: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Role</label>
            <input
              type="text"
              placeholder="Role"
              required
              value={values.Role}
              onChange={(e) => setValues({ ...values, Role: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>
        </div>
        <div className="mt-8">
          <button
            type="submit"
            className="text-[#212121] hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300 w-full"
          >
            Add User
          </button>
        </div>
      </form>
    </div>
  );
};

UserBranch.propTypes = {
  setPopupType: PropTypes.func.isRequired,
  onUserAdded: PropTypes.func,
};

export default UserBranch;