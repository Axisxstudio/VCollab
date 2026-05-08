import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../validation/auth.schema";
import { login } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { routes } from "../../config/routes";
import { roles } from "../../config/constants";
import logoImg from "../../assets/logo.png";
import "../../styles/login-modern.css";

export default function LoginPage() {
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false
    }
  });
  const rememberMe = watch("rememberMe");

  const onSubmit = async (values) => {
    setError(null);
    try {
      const { rememberMe: shouldRemember, ...credentials } = values;
      const data = await login(credentials);
      setAuth(data.token, data.user, { rememberMe: shouldRemember });

      if (data.user.role === roles.SUPER_ADMIN) {
        navigate(routes.adminDashboard, { replace: true });
      } else {
        const from = location.state?.from;
        const destination = from?.pathname
          ? `${from.pathname}${from.search || ""}${from.hash || ""}`
          : routes.home;
        navigate(destination, { replace: true });
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed. Please check your credentials.";
      setError(message);
    }
  };

  return (
    <div className="login-modern-container">
      <div className="login-card-glass">
        <div className="login-brand-header">
          <div className="brand-logo-inline">
            <img src={logoImg} alt="VCollab" className="login-v-logo-ref" />
            <span className="brand-name-text">VCollab</span>
          </div>
          <h1 className="ref-signin-title">Sign in to VCollab</h1>
          <p className="login-subtitle">Welcome back. Enter your credentials to access your workspace.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-modern-form">
          <div className="input-field-group">
            <label htmlFor="identifier">Email or username</label>
            <div className={`input-with-icon-ref ${errors.identifier ? 'has-error' : ''}`}>
              <div className="icon-circle">
                <Mail size={16} className="input-icon-ref" />
              </div>
              <input
                id="identifier"
                type="text"
                placeholder="VTNV or you@example.com"
                autoComplete="username"
                {...register("identifier")}
              />
            </div>
            {errors.identifier && <span className="error-msg">{errors.identifier.message}</span>}
          </div>

          <div className="input-field-group">
            <label htmlFor="password">Password</label>
            <div className={`input-with-icon-ref ${errors.password ? 'has-error' : ''}`}>
              <div className="icon-circle">
                <Lock size={16} className="input-icon-ref" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                className="toggle-password-ref"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-msg">{errors.password.message}</span>}
          </div>

          <div className="login-options-row">
            <label className="remember-me-ref">
              <input type="checkbox" {...register("rememberMe")} />
              <span className="checkbox-custom"></span>
              <span className={rememberMe ? "remember-me-ref__label is-checked" : "remember-me-ref__label"}>
                Remember me
              </span>
            </label>
            <Link to={routes.forgotPassword} className="link-forgot-ref">Forgot password?</Link>
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <button className="btn-signin-ref" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-divider-ref">
            <span>or</span>
          </div>

          <button type="button" className="btn-sso-ref btn-google-ref">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-icon-svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="login-footer-text">
            New to VCollab? <Link to={routes.register}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
