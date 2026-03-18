import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { routes } from "../config/routes";
import { useAuthStore } from "../store/authStore";
import logoImg from "../assets/logo.png";
import "../styles/app-shell.css";

const NAV_LINKS = [
  { label: "Projects", path: routes.projects },
  { label: "Posts",    path: routes.posts },
  { label: "Blogs",   path: routes.blogs },
  { label: "About",   path: "#about" },
];

export default function PublicLayout() {
  const token = useAuthStore((state) => state.token);
  const [scrolled, setScrolled]     = useState(false);
  const [activeSection, setActive]  = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const isLanding = location.pathname === routes.landing;

  /* scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* active-section highlight */
  useEffect(() => {
    if (!isLanding) return;
    const ids = NAV_LINKS.filter(l => l.path.startsWith("#")).map((l) => l.path.slice(1));
    const obs = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      o.observe(el);
      obs.push(o);
    });
    return () => obs.forEach((o) => o.disconnect());
  }, [isLanding]);

  /* smooth scroll */
  const handleAnchor = useCallback((e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(href.slice(1));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
  }, []);

  /* close mobile on outside click */
  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mobileOpen]);

  return (
    <div>
      <header className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
        <div className="container lp-nav-inner">
          {/* Brand */}
          <Link to={routes.landing} className="lp-brand">
            <img src={logoImg} alt="VCollab" className="lp-brand-logo" />
            <span className="lp-brand-mark">VCollab</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="lp-nav-links">
            {NAV_LINKS.map(({ label, path }) => {
              const isHash = path.startsWith("#");
              if (isHash) {
                return (
                  <a
                    key={path}
                    href={path}
                    className={`lp-nav-link${activeSection === path.slice(1) ? " lp-nav-link--active" : ""}`}
                    onClick={(e) => isLanding ? handleAnchor(e, path) : null}
                  >
                    {label}
                  </a>
                );
              }
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `lp-nav-link${isActive ? " lp-nav-link--active" : ""}`}
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="lp-nav-actions">
            {token ? (
              <Link to={routes.home} className="lp-btn-filled">Go to Workspace</Link>
            ) : (
              <>
                <Link to={routes.login}    className="lp-btn-outline">Sign In</Link>
                <Link to={routes.register} className="lp-btn-filled">Create Free Account</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lp-hamburger"
            aria-label="Toggle menu"
            onClick={(e) => { e.stopPropagation(); setMobileOpen((v) => !v); }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        <div
          className={`lp-mobile-drawer${mobileOpen ? " lp-mobile-drawer--open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {NAV_LINKS.map(({ label, path }) => {
            const isHash = path.startsWith("#");
            if (isHash) {
              return (
                <a
                  key={path}
                  href={path}
                  className={`lp-mobile-link${activeSection === path.slice(1) ? " lp-mobile-link--active" : ""}`}
                  onClick={(e) => { if (isLanding) handleAnchor(e, path); else setMobileOpen(false); }}
                >
                  {label}
                </a>
              );
            }
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `lp-mobile-link${isActive ? " lp-mobile-link--active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </NavLink>
            );
          })}
          <div className="lp-mobile-cta">
            {token ? (
              <Link to={routes.home} className="lp-btn-filled" onClick={() => setMobileOpen(false)}>Go to Workspace</Link>
            ) : (
              <>
                <Link to={routes.login}    className="lp-btn-outline" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to={routes.register} className="lp-btn-filled"  onClick={() => setMobileOpen(false)}>Create Free Account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={isLanding ? "" : "public-page-wrap"}><Outlet /></main>
    </div>
  );
}
