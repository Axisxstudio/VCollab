import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../validation/auth.schema";
import { resetPassword } from "../../services/auth.service";
import { Lock, Key, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import logoImg from "../../assets/logo.png";
import "../../styles/login-modern.css";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await resetPassword(values);
      setMessage("Password updated. You can now sign in.");
    } catch (err) {
      setError("Reset failed. Please try again.");
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
          <h1 className="ref-signin-title">Create new password</h1>
          <p className="login-subtitle">Almost there. Choose a secure password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-modern-form">
          <div className="input-field-group">
            <label htmlFor="token">Reset token</label>
            <div className={`input-with-icon-ref ${errors.token ? 'has-error' : ''}`}>
              <div className="icon-circle">
                <Key size={16} className="input-icon-ref" />
              </div>
              <input
                id="token"
                type="text"
                placeholder="Enter reset token"
                {...register("token")}
              />
            </div>
            {errors.token && <span className="error-msg">{errors.token.message}</span>}
          </div>

          <div className="input-field-group">
            <label htmlFor="password">New password</label>
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
            {errors.password && <span className="error-msg">{errors.password.message}</span>}
          </div>

          {message && <div className="login-success-alert">{message}</div>}
          {error && <div className="login-error-alert">{error}</div>}

          <button className="btn-signin-ref" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>

          <div className="back-to-login">
            <Link to={routes.login} className="link-back">
              <ArrowLeft size={16} />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
