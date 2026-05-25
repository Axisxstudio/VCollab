import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { routes } from "../config/routes";

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={routes.login} replace />;
  }

  return <Outlet />;
}
