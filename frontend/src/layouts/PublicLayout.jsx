import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import VHubLauncher from "../components/vhub/VHubLauncher";
import { routes } from "../config/routes";
import { getVHubSettings } from "../services/vhub.service";
import { useAuthStore } from "../store/authStore";
import logoImg from "../assets/logo.png";
import "../styles/app-shell.css";
import "../styles/public-layout.css";

const NAV_LINKS = [
  { label: "Home",     path: routes.landing },
  { label: "Resources", path: routes.resources },
  { label: "Projects", path: routes.projects },
  { label: "Posts",    path: routes.posts },
  { label: "Blogs",    path: routes.blogs },
  { label: "About",    path: routes.about },
];

export default function PublicLayout() {
  const token = useAuthStore((state) => state.token);
  const [scrolled, setScrolled]     = useState(false);
  const [activeSection, setActive]  = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const { data: vHubSettings } = useQuery({
    queryKey: ["v-hub", "settings"],
    queryFn: getVHubSettings,
    staleTime: 30000
  });
  const isLanding = location.pathname === routes.landing;
  const showVHubLauncher = !token && isLanding;
  const isFullBleedPage = [
    routes.landing,
    routes.resources,
    routes.resourceExplore,
    routes.about,
    routes.privacy,
    routes.terms,
    routes.vHub
  ].includes(location.pathname);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("public-nav-open", mobileOpen);

    if (!mobileOpen) {
      return () => document.body.classList.remove("public-nav-open");
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("public-nav-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealSelector = ".reveal-up";

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      mainElement.querySelectorAll(revealSelector).forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    const observedElements = new WeakSet();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    const observeElement = (element, reset = false) => {
      if (!(element instanceof HTMLElement) || !element.matches(revealSelector)) return;
      if (reset) {
        element.classList.remove("is-visible");
      }
      if (observedElements.has(element)) return;
      observedElements.add(element);
      revealObserver.observe(element);
    };

    const scanNode = (node, reset = false) => {
      if (!(node instanceof HTMLElement)) return;
      observeElement(node, reset);
      node.querySelectorAll(revealSelector).forEach((element) => observeElement(element, reset));
    };

    const rafId = window.requestAnimationFrame(() => {
      scanNode(mainElement, true);
    });

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => scanNode(node, true));
      });
    });

    mutationObserver.observe(mainElement, {
      childList: true,
      subtree: true
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      mutationObserver.disconnect();
      revealObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <div>
      <header className={`public-layout-nav${scrolled ? " public-layout-nav--scrolled" : ""}`}>
        <div className="container public-layout-nav__inner">
          {/* Brand */}
          <Link to={routes.landing} className="public-layout-nav__brand">
            <img src={logoImg} alt="VCollab" className="public-layout-nav__brand-logo" />
            <span className="public-layout-nav__brand-mark">VCollab</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="public-layout-nav__links" aria-label="Primary">
            {NAV_LINKS.map(({ label, path }) => {
              const isHash = path.startsWith("#");
              if (isHash) {
                return (
                  <a
                    key={path}
                    href={path}
                    className={`public-layout-nav__link${activeSection === path.slice(1) ? " public-layout-nav__link--active" : ""}`}
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
                  className={({ isActive }) => `public-layout-nav__link${isActive ? " public-layout-nav__link--active" : ""}`}
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="public-layout-nav__actions">
            {token ? (
              <Link to={routes.home} className="public-layout-nav__button public-layout-nav__button--primary">Go to Workspace</Link>
            ) : (
              <>
                <Link to={routes.login} className="public-layout-nav__button public-layout-nav__button--ghost">Sign In</Link>
                <Link to={routes.register} className="public-layout-nav__button public-layout-nav__button--primary">Create Free Account</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="public-layout-nav__hamburger"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="public-layout-mobile-nav"
            onClick={() => setMobileOpen((previous) => !previous)}
          >
            <Menu size={22} />
          </button>
        </div>

        <button
          type="button"
          className={`public-layout-nav__overlay${mobileOpen ? " public-layout-nav__overlay--open" : ""}`}
          aria-label="Close menu"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />

        <div
          id="public-layout-mobile-nav"
          className={`public-layout-nav__drawer${mobileOpen ? " public-layout-nav__drawer--open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          aria-hidden={!mobileOpen}
        >
          <div className="public-layout-nav__drawer-header">
            <Link to={routes.landing} className="public-layout-nav__brand" onClick={() => setMobileOpen(false)}>
              <img src={logoImg} alt="VCollab" className="public-layout-nav__brand-logo" />
              <span className="public-layout-nav__brand-mark">VCollab</span>
            </Link>
            <button
              type="button"
              className="public-layout-nav__close"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="public-layout-nav__drawer-body">
            {NAV_LINKS.map(({ label, path }) => {
              const isHash = path.startsWith("#");
              if (isHash) {
                return (
                  <a
                    key={path}
                    href={path}
                    className={`public-layout-nav__mobile-link${activeSection === path.slice(1) ? " public-layout-nav__mobile-link--active" : ""}`}
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
                  className={({ isActive }) => `public-layout-nav__mobile-link${isActive ? " public-layout-nav__mobile-link--active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </NavLink>
              );
            })}
          </div>

          <div className="public-layout-nav__drawer-actions">
            {token ? (
              <Link
                to={routes.home}
                className="public-layout-nav__button public-layout-nav__button--primary"
                onClick={() => setMobileOpen(false)}
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  to={routes.login}
                  className="public-layout-nav__button public-layout-nav__button--ghost"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to={routes.register}
                  className="public-layout-nav__button public-layout-nav__button--primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={isFullBleedPage ? "" : "public-page-wrap"}><Outlet /></main>
      {showVHubLauncher && <VHubLauncher mode={vHubSettings?.mode} />}
    </div>
  );
}
