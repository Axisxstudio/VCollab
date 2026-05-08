import { Outlet, Link } from "react-router-dom";
import { routes } from "../config/routes";
import logoImg from "../assets/logo.png";
import "../styles/app-shell.css";

export default function AuthLayout() {
  return (
    <div className="auth-full-page-wrapper">
      <Outlet />
    </div>
  );
}
