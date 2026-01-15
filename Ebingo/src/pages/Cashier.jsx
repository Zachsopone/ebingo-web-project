import axios from "axios";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Members from "../components/Members";
import Navigation from "../components/Navigation";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Cashier = () => {
  const [branchId, setBranchId] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setBranchId(payload.branch_id || null);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    axios
      .post(`${API_URL}/auth/logout`)
      .then(() => {
        Cookies.remove("accessToken");
        window.location.href = "/";
      })
      .catch((err) => {
        console.error("Logout error:", err);
      });
  };

  return (
    <div className="w-full h-screen">
      <Header fixedBranchId={branchId}/>
      <Navigation triggerRefetch={() => setRefetchKey((prev) => prev + 1)} />
      <Members fixedBranchId={branchId} refetchKey={refetchKey} />

      <button
        onClick={handleLogout}
        className="bg-red-500 absolute top-[51px] px-3 py-2.5 right-0 text-white shadow-md hover:bg-red-600 transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default Cashier;
