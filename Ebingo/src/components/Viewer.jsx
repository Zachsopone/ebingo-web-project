import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaDownload } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Viewer = ({ memberId, onClose }) => {
  const [member, setMember] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memberId) return;
    setError(null);
    axios
      .get(`${API_URL}/members/${memberId}`)
      .then((res) => setMember(res.data))
      .catch((err) => {
        console.error("Error fetching member:", err);
        setError("Failed to load member data");
      });
  }, [memberId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.85)] flex flex-col items-center z-[1000] overflow-hidden">
      {/* Toolbar */}
      <div className="fixed top-0 left-0 w-full flex justify-between items-center text-white py-3 px-6 z-50 bg-[rgba(40,40,40,1)]">
        <button
          onClick={onClose}
          className="text-2xl hover:text-red-500 transition"
          title="Close Viewer"
        >
          <RxCross2 />
        </button>

        <h2 className="text-white text-lg text-center">Member Document Viewer</h2>

        <FaDownload
          className="text-xl cursor-pointer hover:text-green-400 transition"
          title="Download as PDF"
          onClick={async () => {
            if (!member) return;
            try {
              const res = await fetch(`${API_URL}/docx/${memberId}/docx`);
              if (!res.ok) throw new Error();

              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Player_Registration_${member.Card_No}.docx`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert("Download failed. Try again.");
            }
          }}
        />
        
      </div>

      <div className="w-full h-full overflow-y-auto pb-10 px-4">
        <div className="max-w-[8.5in] mx-auto">
          {error && (
            <div className="flex items-center justify-center h-[11in] bg-white text-red-600">
              <p>{error}</p>
            </div>
          )}

          {member && !error && (
            <div className="w-[8.5in] h-[11in] bg-white shadow-xl rounded overflow-hidden mt-16 relative px-[5.6rem] py-[5.8rem] mx-auto">
              <h1 className="text-xl font-semibold text-center mb-[3rem] text-black">
                Player’s Registration Form
              </h1>

              <div className="flex flex-row justify-between">
                {/* Column 1 */}
                <div className="flex flex-col w-[30%] break-words text-left">

                  <div className="space-y-6 break-words text-left">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Name:</span>
                      <p className="text-[1.06rem] break-words">{member.fname} {member.mname} {member.lname}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Permanent Address:</span>
                      <p className="text-[1.06rem] break-words">{member.permaddress}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Present Address:</span>
                      <p className="text-[1.06rem] break-words">{member.presaddress}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Age:</span>
                      <p className="text-[1.06rem]">{member.age}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Nationality:</span>
                      <p className="text-[1.06rem]">{member.nationality}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Registration Date:</span>
                      <p className="text-[1.06rem]">{formatDate(member.created_date)}</p>
                    </div>
                  </div>

                  <div className="space-y-6 break-words text-left mt-[1.4rem]">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Status:</span>
                        <p className="text-[1.06rem]">{member.banned === 1 ? "Ban" : "Not Ban"}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Nature of Work:</span>
                        <p className="text-[1.06rem]">{member.now}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Reason:</span>
                        <p className="text-[1.06rem]">{member.reason}</p>
                    </div>
                  </div>

                </div>

                {/* Column 2 */}
                <div className="flex flex-col w-[30%] break-words text-left">

                  <div className="space-y-6 break-words text-left">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Date of Birth:</span>
                      <p className="text-[1.06rem]">{member.birthdate}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Contact Number:</span>
                      <p className="text-[1.06rem] break-words">{member.cnumber}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Gender:</span>
                      <p className="text-[1.06rem]">{member.gender}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Civil Status:</span>
                      <p className="text-[1.06rem]">{member.cstatus}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Branch:</span>
                      <p className="text-[1.06rem] break-words">{member.sname}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Time:</span>
                      <p className="text-[1.06rem]">{formatTime(member.created_time)}</p>
                    </div>
                  </div>  

                  <div className="space-y-6 break-words text-left mt-[1.4rem]">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Email Address:</span>
                      <p className="text-[1.06rem] break-words">{member.email}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Source of Fund:</span>
                        <p className="text-[1.06rem]">{member.sof}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Risk Assessment:</span>
                        <p className="text-[1.06rem]">{member.risk_assessment}</p>
                    </div>
                  </div>
                
                </div>

                {/* Column 3 */}
                <div className="flex flex-col w-[30%] break-words text-left">


                  <div className="space-y-6 break-words text-left">
                    <div className="flex flex-col items-center mb-1">
                      <img
                        src={`${API_URL}/valid/${member.filename2}`}
                        alt="Valid ID"
                        className="object-cover h-50 w-40 border border-black"
                      />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Type of ID:</span>
                      <p className="text-[1.06rem] break-words">{member.typeofid}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">ID Number:</span>
                      <p className="text-[1.06rem] break-words">{member.idnum}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="font-semibold text-[1.06rem] text-center mb-1">
                        System generated:
                      </p>
                      <p
                        className="text-lg tracking-wide leading-none mt-8 text-center"
                        style={{ fontFamily: "Code39, sans-serif" }}
                      >
                        *{member.idnum}*
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 break-words text-left mt-[4.7rem]">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Card Number:</span>
                      <p className="text-[1.06rem] break-words">{member.Card_No}</p>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[1.06rem] mb-1">Monthly Income:</span>
                      <p className="text-[1.06rem] break-words">{member.mi}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Viewer.propTypes = {
  memberId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Viewer;
