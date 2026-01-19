import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import Header from "../components/Header";
import Members from "../components/Members";
import Navigation from "../components/Navigation";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [refetchKey, setRefetchKey] = useState(0);
  
  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      enqueueSnackbar("Session expired, please log in again.", { variant: "warning" });
      navigate("/");
    } else {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role.toLowerCase() !== "superadmin" && payload.role.toLowerCase() !== "kaizen") {
          enqueueSnackbar("Unauthorized access", { variant: "error" });
          navigate("/");
        }
      } catch (err) {
        console.error("Token decode error:", err);
        navigate("/");
      }
    }
  }, [enqueueSnackbar, navigate]);

  const handleLogout = () => {
    axios.post(`${API_URL}/auth/logout`)
      .finally(() => {
        Cookies.remove("accessToken"); // only token matters
        window.location.href = "/";
      });
  };

  return (
    <div className="w-full h-screen">
      <Header />
      <Navigation triggerRefetch={() => setRefetchKey(prev => prev + 1)} />
      <Members refetchKey={refetchKey} />
      <button
        onClick={handleLogout}
        className="bg-red-500 absolute top-[51px] px-3 py-2.5 right-0 text-white shadow-md hover:bg-red-600 transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default SuperAdmin;
