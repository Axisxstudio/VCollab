import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { routes } from "../config/routes";

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to={routes.login} state={{ from: location }} replace />;
  }
  return <Outlet />;
}
