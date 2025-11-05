// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import { Routes, Route} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Kaizen from "./pages/Kaizen";
import SuperAdmin from "./pages/SuperAdmin";
import Cashier from "./pages/Cashier";
import Guard from "./pages/Guard";
import ProtectedRoute from "./route/ProtectedRoute";
import Branches from "./components/Branches";
import Users from "./components/Users";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/kaizen/members"
          element={
            <ProtectedRoute allowedRoles={["kaizen"]}>
              <Kaizen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/members"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/members"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <Cashier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guard"
          element={
            <ProtectedRoute
              allowedRoles={["guard"]}
            >
              <Guard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kaizen/branches"
          element={
            <ProtectedRoute allowedRoles={["kaizen"]}>
              <Branches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/branches"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <Branches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kaizen/users"
          element={
            <ProtectedRoute allowedRoles={["kaizen"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
