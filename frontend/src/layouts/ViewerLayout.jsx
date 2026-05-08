import MainLayout from "./MainLayout";
import PublicLayout from "./PublicLayout";
import { useAuthStore } from "../store/authStore";

export default function ViewerLayout() {
  const token = useAuthStore((state) => state.token);
  return token ? <MainLayout /> : <PublicLayout />;
}
