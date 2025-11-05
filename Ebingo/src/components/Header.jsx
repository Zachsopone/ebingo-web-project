import { useState } from "react";
import { useLocation } from "react-router-dom";
import Popup from "./Popup";
import Members from "./Members";
import Branches from "./Branches";


const Header = () => {
  const location = useLocation();
  const [popupType, setPopupType] = useState(false);

  const isBranchesPage = location.pathname.includes("branches");

  return (
    <header className="bg-[#A8D5E3] w-full h-[3.2rem] flex flex-row justify-evenly items-center">

      {isBranchesPage ? 
        (popupType === "branches" && (
          <Popup onClose={() => setPopupType(null)}>
            <Branches />
          </Popup>
        ))
      : 
        (popupType === "members" && (
          <Popup onClose={() => setPopupType(null)}>
            <Members />
          </Popup>
        ))
      }

    <div className="text-black font-semibold text-lg">
      E-Bingo Information System
    </div>
    </header>
  );
};

export default Header;
