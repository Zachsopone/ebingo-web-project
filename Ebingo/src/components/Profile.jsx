import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Profile = ({ memberId, onClose }) => {
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (memberId) {
      axios
        .get(`${API_URL}/members/${memberId}`)
        .then((res) => setMember(res.data))
        .catch((err) => console.error("Error fetching member profile:", err));
    }
  }, [memberId]);

  if (!member) return null;

  const date = new Date(member.created_date);
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
  .getDate()
  .toString()
  .padStart(2, '0')}-${date.getFullYear()}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-[#F2F0EA] h-auto w-4/5 pt-5 px-5 pb-9 rounded-lg relative">
            {/* Close button */}
            <button
            onClick={onClose}
            className="absolute top-1 right-3 text-gray-700 hover:text-red-500 text-lg font-bold"
            >
            &#x2715;
            </button>

            <h1 className="text-xl mb-5 text-center font-semibold">
            Players Registration Form
            </h1>

            <div className="flex flex-row w-5/4">
            {/* <div className="flex flex-row h-auto w-4/5"></div> */}
                {/* <div className="h-auto w-1/2 flex flex-col"></div> */}
                <div className="flex flex-col items-center w-1/3">
                    {/* Column 1 */}
                    <a
                        href={`${API_URL}/valid/${member.filename2}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                        src={`${API_URL}/valid/${member.filename2}`}
                        alt="Valid ID"
                        className="object-cover w-[180px] h-[180px] border cursor-pointer hover:opacity-80 overflow-hidden relative"
                        />
                    </a>
                    <div className="mt-2 flex items-center gap-1 justify-center mb-1">
                    <span className="flex text-[1.06rem] font-semibold">
                    Type of ID:
                    </span>
                    <p className="flex text-[1.06rem]">{member.typeofid}</p>
                    </div>

                    <div className="flex items-center gap-1 justify-center mb-1">
                    <span className="flex text-[1.06rem] font-semibold">
                    ID Number:
                    </span>
                    <p className="flex text-[1.06rem]">{member.idnum}</p>
                    </div>

                    <div className="flex flex-col items-center">
                    <p className="text-sm font-semibold">
                    System generated:
                    </p>
                    <p className="text-lg tracking-wide leading-none mt-8" style={{ fontFamily: "Code39, sans-serif" }}> *{member.idnum}* </p>
                    </div>

                </div>    

                {/* Column 2 */}
                {/* <div className="w-3/4 flex flex-col justify-between"></div> */}
                <div className="flex flex-col w-1/3 items-center gap-10 mt-12">
                    
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           First Name:
                        </span>
                        <p className="flex text-[1.06rem]">{member.fname}</p>
                    </div>
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Date of Birth:
                        </span>
                        <p className="flex text-[1.06rem]">{member.birthdate}</p>
                    </div>
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Age:
                        </span>
                        <p className="flex text-[1.06rem]">{member.age}</p>
                    </div>
                    <div className="flex items-center gap-1 justify-center mb-11">
                        <span className="flex text-[1.06rem] font-semibold">
                           Nationality:
                        </span>
                        <p className="flex text-[1.06rem]">{member.nationality}</p>
                    </div>
                </div>

                {/* Column 3 */}
                <div className="flex flex-col w-1/3 items-center gap-10 mt-12">

                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Middle Name:
                        </span>
                        <p className="flex text-[1.06rem]">{member.mname}</p>
                    </div>

                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Contact No:
                        </span>
                        <p className="flex text-[1.06rem]">{member.cnumber}</p>
                    </div>
                
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Address:
                        </span>
                        <p className="flex text-[1.06rem]">{member.permaddress}</p>
                    </div>

                    <div className="flex items-center gap-1 justify-center mb-11">
                        <span className="flex text-[1.06rem] font-semibold">
                           Risk Assessment:
                        </span>
                        <p className="flex text-[1.06rem]">{member.risk_assessment}</p>
                    </div>
                </div>

                {/* Column 4 */}
                <div className="flex flex-col w-1/3 items-center gap-10 mt-12">
                
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Last Name:
                        </span>
                        <p className="flex text-[1.06rem]">{member.lname}</p>
                    </div>
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Branch:
                        </span>
                        <p className="flex text-[1.06rem]">{member.sname}</p>
                    </div>
                    <div className="mb-2 flex items-center gap-1 justify-center">
                        <span className="flex text-[1.06rem] font-semibold">
                           Gender:
                        </span>
                        <p className="flex text-[1.06rem]">{member.gender}</p>
                    </div>
                    <div className="flex items-center gap-1 justify-center mb-11">
                        <span className="flex text-[1.06rem] font-semibold">
                           Registration Date:
                        </span>
                        <p className="flex text-[1.06rem]">
                        {formattedDate}
                        </p>
                    </div>
                </div>
                    
            </div>
        </div>
    </div>
  );
};


Profile.propTypes = {
  memberId: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

export default Profile;
