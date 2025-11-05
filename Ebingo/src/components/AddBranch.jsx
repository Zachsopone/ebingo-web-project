import { useState } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AddBranch = ({ setPopupType, onBranchAdded }) => {
  const [values, setValues] = useState({
    sname: "",
    address: "",
    cperson: "",
    contact: "",
    position: "",
  });

  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFields = ["sname", "address", "cperson", "contact", "position"];
    const missingFields = requiredFields.filter((field) => !values[field]);

    if (missingFields.length > 0) {
      enqueueSnackbar(`Missing required fields: ${missingFields.join(", ")}`, {
        variant: "error",
      });
      return;
    }

    try {
      console.log("Sending branch data:", values);
      const response = await axios.post(`${API_URL}/branches/add`, values);

      const { newBranch } = response.data;

      if (onBranchAdded) {
        onBranchAdded(newBranch);
      }
      
      enqueueSnackbar("Branch added successfully!", { variant: "success" });
      setPopupType(null);
    } catch (error) {
      console.error("Error adding branch:", error);
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
        className="h-auto w-2/5 bg-[#F2F0EA] border border-black rounded-lg"
      >
        <div className="flex flex-col gap-4 m-4 mx-5">
          <div>
            <label className="block mb-1">Branch Name</label>
            <input
              type="text"
              placeholder="Main Branch"
              required
              value={values.sname}
              onChange={(e) => setValues({ ...values, sname: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Address</label>
            <input
              type="text"
              placeholder="Branch Address"
              required
              value={values.address}
              onChange={(e) => setValues({ ...values, address: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={values.cperson}
              onChange={(e) => setValues({ ...values, cperson: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Contact Number</label>
            <input
              type="number"
              placeholder="Mobile Number"
              required
              value={values.contact}
              onChange={(e) => setValues({ ...values, contact: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Position</label>
            <input
              type="text"
              placeholder="Job Position"
              required
              value={values.position}
              onChange={(e) => setValues({ ...values, position: e.target.value })}
              className="w-full p-2 border border-black rounded-md outline-none"
            />
          </div>

          <div className="mt-4 mb-1">
            <button
              type="submit"
              className="text-[#212121] hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300 w-full"
            >
              Add Branch
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

AddBranch.propTypes = {
  setPopupType: PropTypes.func.isRequired,
  onBranchAdded: PropTypes.func,
};

export default AddBranch;