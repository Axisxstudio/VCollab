import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../validation/auth.schema";
import { requestPasswordReset } from "../../services/auth.service";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import logoImg from "../../assets/logo.png";
import "../../styles/login-modern.css";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await requestPasswordReset(values);
      setMessage("If an account exists, a reset link has been sent.");
    } catch (err) {
      setError("Unable to process the request right now.");
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
          <h1 className="ref-signin-title">Reset your password</h1>
          <p className="login-subtitle">Enter your email and we'll send you a link to get back into your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-modern-form">
          <div className="input-field-group">
            <label htmlFor="email">Email address</label>
            <div className={`input-with-icon-ref ${errors.email ? 'has-error' : ''}`}>
              <div className="icon-circle">
                <Mail size={16} className="input-icon-ref" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email.message}</span>}
          </div>

          {message && <div className="login-success-alert">{message}</div>}
          {error && <div className="login-error-alert">{error}</div>}

          <button className="btn-signin-ref" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending link..." : "Send Reset Link"}
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
