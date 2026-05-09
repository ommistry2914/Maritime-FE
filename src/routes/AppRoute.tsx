import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoute";
import { useEffect, useState } from "react";
import SuperAdminRoutes from "./SuperAdminRoute";
import AdminRoutes from "./AdminRoute";
import UserRoutes from "./UserRoute";
import { useAppSelector } from "@/slice/hook";
import { fetchCurrentUser } from "@/slice/auth.slice";
import { useAppDispatch } from "@/slice/hook";

function AppRoutes() {
  const user = useAppSelector((state) => state.auth.user);
  const initialized = useAppSelector((state) => state.auth.initialized);
  const dispatch = useAppDispatch();
  const [navigateRoute, setNavigateRoute] = useState("/login");

  useEffect(() => {
    if (!initialized) dispatch(fetchCurrentUser());
  }, [dispatch, initialized]);
  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "superAdmin":
        setNavigateRoute("/admin-management");
        break;
      case "admin":
        setNavigateRoute("/adminDashboard");
        break;
      case "crew":
      case "user":
        setNavigateRoute("/userDashboard");
        break;
      default:
        setNavigateRoute("/login");
    }
  }, [user]);

  const renderRoleRoutes = () => {
    if (!user) return null;

    switch (user.role) {
      case "superAdmin":
        return SuperAdminRoutes();
      case "admin":
        return AdminRoutes();
      case "crew":
      case "user":
        return UserRoutes();
      default:
        return null;
    }
  };

  const isAuthenticated = Boolean(user);
  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading maritime console...</div>;
  }
  return (
    <Routes>
      {isAuthenticated ? (
        <>
          {renderRoleRoutes()}
          {/* Redirect any unknown route to correct dashboard */}
          <Route path="*" element={<Navigate to={navigateRoute} replace />} />
        </>
      ) : (
        <>
          {PublicRoutes()}
          {/* Redirect all unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default AppRoutes;
