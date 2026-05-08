import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, User, Mail, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validation/auth.schema";
import { register as registerUser, checkUsernameAvailability } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { routes } from "../../config/routes";
import { roles } from "../../config/constants";
import logoImg from "../../assets/logo.png";
import "../../styles/login-modern.css";
import "./auth-enhancements.css";

export default function RegisterPage() {
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ 
    resolver: zodResolver(registerSchema),
    mode: "onChange"
  });

  const username = watch("username");
  const password = watch("password");

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const isAvailable = await checkUsernameAvailability(username);
        setUsernameStatus(isAvailable ? "available" : "taken");
      } catch (err) {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setStrengthLabel("");
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    setPasswordStrength(score);
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    setStrengthLabel(labels[score]);
  }, [password]);

  const onSubmit = async (values) => {
    if (usernameStatus === "taken") {
      setError("Username is already taken.");
      return;
    }
    
    setError(null);
    try {
      const data = await registerUser(values);
      setAuth(data.token, data.user);
      navigate(routes.home);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.message === "Network Error"
          ? "Cannot reach backend API. Make sure backend is running on http://localhost:3000."
          : "Registration failed. Please try again.");
      setError(message);
    }
  };

  return (
    <div className="login-modern-container">
      <div className="login-card-glass register-card-wide">
        <div className="login-brand-header">
          <div className="brand-logo-inline">
            <img src={logoImg} alt="VCollab" className="login-v-logo-ref" />
            <span className="brand-name-text">VCollab</span>
          </div>
          <h1 className="ref-signin-title">Create your account</h1>
          <p className="login-subtitle">Join the VCollab community and start collaborating today.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-modern-form register-grid-form">
          <div className="form-row-split">
            <div className="input-field-group">
              <label htmlFor="fullName">Full name</label>
              <div className={`input-with-icon-ref ${errors.fullName ? 'has-error' : ''}`}>
                <div className="icon-circle">
                  <User size={16} className="input-icon-ref" />
                </div>
                <input id="fullName" type="text" {...register("fullName")} placeholder="John Doe" />
              </div>
              {errors.fullName && <span className="error-msg">{errors.fullName.message}</span>}
            </div>

            <div className="input-field-group">
              <label htmlFor="username">Username</label>
              <div className={`input-with-icon-ref ${errors.username || usernameStatus === "taken" ? 'has-error' : ''}`}>
                <div className="icon-circle">
                  {usernameStatus === "checking" ? <Loader2 size={16} className="input-icon-ref spin" /> : <User size={16} className="input-icon-ref" />}
                </div>
                <input id="username" type="text" {...register("username")} placeholder="unique_id" />
                {usernameStatus === "available" && <CheckCircle2 size={18} className="status-icon-ref success-icon" />}
                {usernameStatus === "taken" && <XCircle size={18} className="status-icon-ref error-icon" />}
              </div>
              {errors.username && <span className="error-msg">{errors.username.message}</span>}
              {usernameStatus === "taken" && <span className="error-msg">Username already taken</span>}
            </div>
          </div>

          <div className="form-row-split">
            <div className="input-field-group">
              <label htmlFor="email">Email</label>
              <div className={`input-with-icon-ref ${errors.email ? 'has-error' : ''}`}>
                <div className="icon-circle">
                  <Mail size={16} className="input-icon-ref" />
                </div>
                <input id="email" type="email" {...register("email")} placeholder="you@example.com" />
              </div>
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
            </div>

            <div className="input-field-group">
              <label htmlFor="role">Role</label>
              <div className={`input-with-icon-ref ${errors.role ? 'has-error' : ''}`}>
                <div className="icon-circle">
                  <ShieldCheck size={16} className="input-icon-ref" />
                </div>
                <select id="role" {...register("role")} defaultValue={roles.STUDENT}>
                  <option value={roles.STUDENT}>Student</option>
                  <option value={roles.INDUSTRIAL_EXPERT}>Industrial Expert</option>
                  <option value={roles.SOFTWARE_ENGINEER}>Software Engineer</option>
                </select>
              </div>
              {errors.role && <span className="error-msg">{errors.role.message}</span>}
            </div>
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
                placeholder="••••••••"
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
            {password && (
              <div className={`password-strength-container strength-${passwordStrength}`}>
                <div className="password-strength-meter">
                  <div className="password-strength-bar"></div>
                </div>
                <div className="password-strength-text">
                  <span>Security scale</span>
                  <span className={`strength-${passwordStrength}-text`}>{strengthLabel}</span>
                </div>
              </div>
            )}
            {errors.password && <span className="error-msg">{errors.password.message}</span>}
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <button className="btn-signin-ref" disabled={isSubmitting || usernameStatus === "taken"} type="submit">
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="login-footer-text">
            Already have an account? <Link to={routes.login}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

