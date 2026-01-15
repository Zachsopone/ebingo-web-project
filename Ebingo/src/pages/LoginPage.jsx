import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import Cookies from "js-cookie";


const LoginPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState({
    Username: "",
    Password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {

      const API_URL = import.meta.env.VITE_API_BASE_URL;
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        Username: values.Username,
        Password: values.Password,
      }, { withCredentials: true });

      const { token } = data || {};
      if (!token) {
        throw new Error("No token returned from server");
      }

      // Save token to cookie (1 day)
      Cookies.set("accessToken", token, { expires: 1, sameSite: "Lax" });
      
      // Set default Authorization header so guarded GETs work
      // axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Decode payload safely
      let payload = {};
      try {
        payload = JSON.parse(atob(token.split(".")[1] || ""));
      } catch {
        throw new Error("Invalid token format");
      }

      const role = (payload.role || "").toLowerCase();
      const branchId = payload.branch_id;

      Cookies.set("userRole", role, { expires: 1, sameSite: "Lax" });            
      Cookies.set("userBranchId", branchId, { expires: 1, sameSite: "Lax" });   
      
      // Route by role
      switch (role) {
        case "cashier":
          navigate("/cashier/members", { state: { branchId } });
          break;
        case "guard":
          navigate("/guard", { state: { branchId } });
          break;
        case "kaizen":
          navigate("/kaizen/members");
          break;
        case "superadmin":
          navigate("/superadmin/members");
          break;
        default:
          enqueueSnackbar("Unknown role", { variant: "error" });
          break;
      }
    
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please check your credentials.";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-screen flex justify-center items-center bg-[#F2F0EA] px-4 sm:px-6 md:px-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-evenly border border-black lg:w-1/4 lg:h-2/5 rounded-xl bg-[#A8D5E3] w-full max-w-md sm:max-w-sm md:max-w-lg"
      >
        <label className="mx-4">Username</label>
        <input
          type="text"
          required
          autoComplete="username"
          value={values.Username}
          onChange={(e) => setValues({ ...values, Username: e.target.value })}
          className="outline-none border mx-4 p-2 border-black rounded-md bg-transparent"
        />

        <label className="mx-4">Password</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          value={values.Password}
          onChange={(e) => setValues({ ...values, Password: e.target.value })}
          className="outline-none border mx-4 p-2 border-black rounded-md bg-transparent"
        />

        <div className="flex items-center gap-2 mt-1 ml-4">
          <input
            type="checkbox"
            id="showPass"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="cursor-pointer"
          />
          <label htmlFor="showPass" className="cursor-pointer select-none text-sm">
            Show Password
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="text-[#212121] hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121] duration-300 m-4"
        >
          Login
        </button>
      </form>
    </main>
  );
};

export default LoginPage;