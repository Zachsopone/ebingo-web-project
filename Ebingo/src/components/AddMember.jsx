import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AddMember = ({ setPopupType, onMemberAdded }) => {
  const [selectedFile, setSelectedFile] = useState(null); // Profile image
  const [validFile, setValidFile] = useState(null); // Valid ID image
  const [imageUrl, setImageUrl] = useState(null); // Preview for profile image
  const [validImageUrl, setValidImageUrl] = useState(null); // Preview for valid ID image
  const fileInputRef = useRef(null);       // Profile
  const validFileInputRef = useRef(null);  // Valid ID
  const [selectedOption, setSelectedOption] = useState(""); // Branch ID
  const [branches, setBranches] = useState([]);
  const [values, setValues] = useState({
    fname: "",
    mname: "",
    lname: "",
    age: "",
    presaddress: "",
    permaddress: "",
    birthdate: "",
    cstatus: "",
    cnumber: "",
    Card_No: "",
    email: "",
    now: "",
    sof: "",
    mi: "",
    nationality: "",
    typeofid: "",
    idnum: "",
    risk_assessment: "",

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
    try {

      //Check for spaces in name fields
      if (
        /\s/.test(values.fname) ||
        /\s/.test(values.mname) ||
        /\s/.test(values.lname)
      ) {
        enqueueSnackbar("Name fields should not have spacing", {
          variant: "error",
        });
        return;
      }

      if (!/^09\d{9}$/.test(values.cnumber)) {
        enqueueSnackbar("Invalid Contact Number. must start with 09.", {
          variant: "error",
        });
        return;
      }

      // Validate all required fields
      const requiredFields = [
        "fname",
        "mname",
        "lname",
        "age",
        "presaddress",
        "permaddress",
        "birthdate",
        "cstatus",
        "cnumber",
        "Card_No",
        "gender",
        "email",
        "now",
        "sof",
        "mi",
        "nationality",
        "typeofid",
        "idnum",
        "risk_assessment",
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
      if (!selectedFile || !validFile) {
        enqueueSnackbar("Both profile and valid ID images are required", {
          variant: "error",
        });
        return;
      }

      // Upload images
      const formData = new FormData();
      formData.append("profile", selectedFile);
      formData.append("valid", validFile);

      console.log("Uploading images...");


      const uploadResponse = await axios.post(
        `${API_URL}/images/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("Upload response:", uploadResponse.data);

      if (!uploadResponse.data?.profile || !uploadResponse.data?.valid) {
        throw new Error("File upload failed: Invalid response structure");
      }

      // Prepare data for member addition
      const dataToSend = {
        ...values,
        branch_id: selectedOption,
        filename: uploadResponse.data.profile.filename,
        profilePath: uploadResponse.data.profile.path,
        filename2: uploadResponse.data.valid.filename,
        validPath: uploadResponse.data.valid.path,      
      };

      
      console.log("Sending member data:", dataToSend);
      const addResponse = await axios.post(`${API_URL}/members/add`, dataToSend);
      console.log("Add member response:", addResponse.data);

      enqueueSnackbar("Member added successfully", {
        variant: "success",
      });

      if (onMemberAdded) {
      onMemberAdded();
      }

      setPopupType(null);

    } catch (error) {
      console.error("Error adding member:", error);
      if (error.response) {
        const { status, data } = error.response;
        console.error("Response error details:", { status, data });
        if (status === 400) {
          enqueueSnackbar(`Error: ${data.error}`, { variant: "error" });
        } else if (status === 500) {
          enqueueSnackbar("Server error. Please try again later.", {
            variant: "error",
          });
        } else {
          enqueueSnackbar(`Unexpected error: ${data.error || "Unknown"}`, {
            variant: "error",
          });
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        enqueueSnackbar("Network error. Please check your server connection.", {
          variant: "error",
        });
      } else {
        console.error("Request setup error:", error.message);
        enqueueSnackbar(`Error: ${error.message}`, { variant: "error" });
      }
    }
  };

  // File change handler
  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      if (type === "profile") {
        setSelectedFile(file);
        setImageUrl(URL.createObjectURL(file));
      } else if (type === "valid") {
        setValidFile(file);
        setValidImageUrl(URL.createObjectURL(file));
      }
    } else {
      enqueueSnackbar(
        `Please select a valid image file for ${type === "profile" ? "Profile" : "Valid ID"}`,
        { variant: "error" }
      );
    }
  };

  // Button click handler — block if already uploaded
  const handleClick = (type) => {
    if (type === "profile") {
      if (selectedFile) {
        enqueueSnackbar("Remove the existing profile image first.", { variant: "warning" });
        return;
      }
      fileInputRef.current.click();
    } else {
      if (validFile) {
        enqueueSnackbar("Remove the existing valid ID image first.", { variant: "warning" });
        return;
      }
      validFileInputRef.current.click();
    }
  };

  const today = new Date();
  const minAllowedBirthdate = new Date();
  minAllowedBirthdate.setFullYear(today.getFullYear() - 21);
  const maxBirthdate = minAllowedBirthdate.toISOString().split("T")[0];

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="h-auto w-4/5 bg-[#F2F0EA] border border-black rounded-lg flex flex-row"
      >
        <div className="h-auto w-1/4 m-4 flex flex-col justify-between">
          {/* Profile Image Upload */}
          <div className="w-full h-[62%]">
            <div className="w-full h-[62%] border border-black overflow-hidden relative">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Selected"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = null;
                      }
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-opacity-75 z-10"
                    title="Remove image"
                  >
                    &#x2715;
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Profile Image Selected
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, "profile")}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="text-[#212121] text-sm hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300 w-full mt-4"
                onClick={() => handleClick("profile")}
              >
                Upload Profile Image
              </button>
            </div>

            {/* Valid ID Upload */}
            <div className="w-full h-[61%] border border-black overflow-hidden relative mt-4">
              {validImageUrl ? (
                <>
                  <img
                    src={validImageUrl}
                    alt="Selected"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValidImageUrl(null);
                      setValidFile(null);
                      if (validFileInputRef.current) {
                        validFileInputRef.current.value = null;
                      }
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-opacity-75 z-10"
                    title="Remove image"
                  >
                    &#x2715;
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Valid ID Image Selected
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={validFileInputRef} 
                onChange={(e) => handleFileChange(e, "valid")}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="text-[#212121] text-sm hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300 w-full mt-4"
                onClick={() => handleClick("valid")}
              >
                Upload Valid ID Image
              </button>
            </div>

          </div>
        </div>

        <div className="w-3/4 flex flex-col justify-between">
          <div className="">
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="First Name"
              required
              onChange={(e) => setValues({ ...values, fname: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Middle Name"
              required
              onChange={(e) => setValues({ ...values, mname: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Last Name"
              required
              onChange={(e) => setValues({ ...values, lname: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="number"
              placeholder="Age"
              required
              onChange={(e) => setValues({ ...values, age: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Present Address"
              required
              onChange={(e) => setValues({ ...values, presaddress: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Permanent Address"
              required
              onChange={(e) => setValues({ ...values, permaddress: e.target.value })}
            />
            
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md placeholder:text-gray-600"
              type="date"
              placeholder="Date of Birth"
              required
              max={maxBirthdate}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                if (selectedDate > minAllowedBirthdate) {
                  enqueueSnackbar("Member must be **21 years old or above**.", { variant: "error" });
                  setValues({ ...values, birthdate: "" });
                  e.target.value = "";
                  return;
                }
                setValues({ ...values, birthdate: e.target.value });
              }}
            />
            
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="tel"
              placeholder="Contact Number"
              required
              maxLength={11}
              pattern="09[0-9]{9}"
              onChange={(e) => setValues({ ...values, cnumber: e.target.value })}
              onInput={(e) => {
              // Only allow numbers
              e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="number"
              placeholder="Card Number"
              required
              onChange={(e) => setValues({ ...values, Card_No: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="email"
              placeholder="Email"
              required
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
            <select
              id="genoptions"
              value={values.gender}
              onChange={(e) => setValues({ ...values, gender: e.target.value })}
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              id="stoptions"
              value={values.cstatus}
              onChange={(e) => setValues({ ...values, cstatus: e.target.value })}
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              required
            >
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Widowed</option>
              <option value="Widowed">Legally Separated</option>
            </select>

            <div className="border-t border-black w-[98%] mt-4" />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Nature of Work"
              required
              onChange={(e) => setValues({ ...values, now: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Source of Fund"
              required
              onChange={(e) => setValues({ ...values, sof: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="number"
              placeholder="Monthly Income"
              required
              onChange={(e) => setValues({ ...values, mi: e.target.value })}
            />
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="text"
              placeholder="Nationality"
              required
              onChange={(e) => setValues({ ...values, nationality: e.target.value })}
            />
            <select
              id="idoptions"
              value={values.typeofid}
              onChange={(e) => setValues({ ...values, typeofid: e.target.value })}
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              required
            >
              <option value="">Choose a Valid ID</option>
              <option value="sss">SSS</option>
              <option value="pagibig">Pag-ibig</option>
              <option value="philhealth">Philhealth</option>
              <option value="nationalid">National ID/EPhil ID</option>
              <option value="nbi">NBI Clearance</option>
              <option value="passport">Passport</option>
              <option value="license">Driver's License</option>
              <option value="prc">PRC ID</option>
              <option value="postal">Postal ID</option>
              <option value="tin">TIN ID</option>
              <option value="scid">Senior Citizen ID</option>
              <option value="umid">UMID</option>
              <option value="acr">Alien Certificate of Recognition</option>
            </select>
            <input
              className="w-[30%] outline-none border ml-4 mt-4 p-2 border-black rounded-md"
              type="number"
              placeholder="ID Number"
              required
              onChange={(e) => setValues({ ...values, idnum: e.target.value })}
            />
            <select
              id="options"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-[30%] border ml-4 mt-4 p-2 border-black outline-none rounded-md"
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

          <div className="flex justify-center my-2">
            <div className="w-full max-w-lg">
              <h2 className="text-lg mb-1 text-center">
                Customer Risk Assessment
              </h2>
              <div className="flex items-center gap-6 justify-center">
                <span className="flex font-sm text-gray-700">
                  Risk Rating:
                </span>
                <div className="flex gap-6">
                  {["Low", "Medium", "High"].map((risk_assessment) => (
                    <label key={risk_assessment} className="flex gap-2">
                      <input
                        type="radio"
                        name="rating"
                        value={risk_assessment}
                        required
                        onChange={(e) =>
                          setValues({ ...values, risk_assessment: e.target.value })
                        }
                        //manage with local state hook
                      />
                      {risk_assessment}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button
              type="submit"
              className="w-full text-[#212121] hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300"
            >
              Add Member
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

AddMember.propTypes = {
  setPopupType: PropTypes.func.isRequired,
  onMemberAdded: PropTypes.func, 
};

export default AddMember;