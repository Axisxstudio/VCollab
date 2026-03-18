import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { roles } from "../config/constants";
import { routes } from "../config/routes";

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={routes.login} replace />;
  }
  if (user.role !== roles.SUPER_ADMIN) {
    return <Navigate to={routes.home} replace />;
  }
  return <Outlet />;
}
