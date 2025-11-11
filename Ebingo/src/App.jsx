// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import { lazy, Suspense } from 'react';
import { Routes, Route} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
const Kaizen = lazy(() => import("./pages/Kaizen"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Cashier = lazy(() => import("./pages/Cashier"));
const Guard = lazy(() => import("./pages/Guard"));
const ProtectedRoute = lazy(() => import("./route/ProtectedRoute"));
const Branches = lazy(() => import("./components/Branches"));
const Users = lazy(() => import("./components/Users"));



function App() {
  return (
    <>
        <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
    </>
  );
}

export default App;
