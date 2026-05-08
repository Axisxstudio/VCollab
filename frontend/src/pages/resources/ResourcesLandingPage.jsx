import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Search,
  Sparkles,
  Upload,
  ArrowLeft,
  LayoutGrid,
  ChevronRight,
  FileText,
  BookOpen,
  Presentation,
  FlaskConical,
  BookMarked,
  Users,
  Database,
  X,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/seo/SEO";
import ResourceDiscoveryModal from "../../components/resources/ResourceDiscoveryModal";
import { routes } from "../../config/routes";
import { getResourcesOverview } from "../../services/resource.service";
import { useAuthStore } from "../../store/authStore";
import "./resources.css";

const CATEGORIES = [
  { key: "all", label: "All", color: null },
  { key: "past-papers", label: "Past Papers", color: "#ef4444" },
  { key: "notes", label: "Notes", color: "#10b981" },
  { key: "slides", label: "Slides", color: "#f59e0b" },
  { key: "books", label: "Books", color: "#3b82f6" },
  { key: "lab-reports", label: "Lab Reports", color: "#8b5cf6" },
];

const FILE_TYPE_COLORS = {
  "Past Papers": { bg: "rgba(239,68,68,0.1)", color: "#ef4444", icon: FileText },
  Notes: { bg: "rgba(16,185,129,0.1)", color: "#10b981", icon: BookMarked },
  Slides: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", icon: Presentation },
  Books: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", icon: BookOpen },
  "Lab Reports": { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6", icon: FlaskConical },
};

function getFileStyle(categoryName) {
  return FILE_TYPE_COLORS[categoryName] || { bg: "#f1f5f9", color: "#64748b", icon: FileText };
}

export default function ResourcesLandingPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const heroRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["resources", "overview"],
    queryFn: getResourcesOverview,
    staleTime: 30000,
  });

  const [activeInstitution, setActiveInstitution] = useState(null);

  // Sticky search on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsSearchSticky(heroBottom < 60);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`${routes.resourceExplore}?search=${encodeURIComponent(searchValue.trim())}`);
  };

  const handleClearSearch = () => setSearchValue("");

  const stats = [
    { icon: Database, value: data?.totalResources ?? "—", label: "Resources" },
    { icon: Building2, value: data?.institutions?.length ?? "—", label: "Institutions" },
    { icon: Users, value: data?.totalContributors ?? "—", label: "Contributors" },
  ];

  return (
    <div className="rl2-shell">
      <SEO
        title="Resources | VCollab"
        description="Find and share academic resources including past papers, notes, slides and more."
      />

      {/* Sticky Search Bar */}
      <div className={`rl2-sticky-search ${isSearchSticky ? "rl2-sticky-search--visible" : ""}`}>
        <div className="rl2-sticky-inner">
          <form className="rl2-sticky-form" onSubmit={handleSearchSubmit}>
            <Search size={18} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search resources..."
            />
            {searchValue && (
              <button type="button" className="rl2-clear-btn" onClick={handleClearSearch}>
                <X size={16} />
              </button>
            )}
            <button type="submit" className="rl2-sticky-submit">Search</button>
          </form>
        </div>
      </div>

      {/* Top Nav Bar */}
      <header className="rl2-topbar">
        <div className="rl2-container">
          <Link to="/" className="rl2-back-link">
            <ArrowLeft size={17} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="rl2-hero" ref={heroRef}>
        <div className="rl2-container rl2-hero__inner">
          <span className="rl2-badge">
            <Sparkles size={13} />
            Public Academic Library
          </span>
          <h1 className="rl2-hero__title">Find your study materials<br />in seconds</h1>
          <p className="rl2-hero__subtitle">
            Thousands of past papers, notes, slides & more — shared by students, for students.
          </p>

          <form className="rl2-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={20} className="rl2-search-icon" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search resources, subjects or universities..."
              autoComplete="off"
            />
            {searchValue && (
              <button type="button" className="rl2-search-clear" onClick={handleClearSearch}>
                <X size={18} />
              </button>
            )}
            <button type="submit" className="rl2-search-submit">
              <ArrowRight size={20} />
            </button>
          </form>

          {/* CTA Buttons */}
          <div className="rl2-hero__actions">
            <button className="rl2-btn rl2-btn--primary" onClick={() => navigate(routes.resourceExplore)}>
              <LayoutGrid size={18} />
              Browse All Resources
            </button>
            <Link
              to={token ? routes.resourceManage : routes.login}
              className="rl2-btn rl2-btn--ghost"
            >
              <Upload size={18} />
              {token ? "My Library" : "Upload Material"}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="rl2-stats-strip">
        <div className="rl2-container">
          <div className="rl2-stats-row">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rl2-stat-item">
                <Icon size={18} className="rl2-stat-icon" />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter Chips */}
      <section className="rl2-categories">
        <div className="rl2-container">
          <div className="rl2-chip-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`rl2-chip ${activeCategory === cat.key ? "rl2-chip--active" : ""}`}
                style={
                  activeCategory === cat.key && cat.color
                    ? { background: cat.color, borderColor: cat.color, color: "#fff" }
                    : {}
                }
                onClick={() => {
                  setActiveCategory(cat.key);
                  if (cat.key !== "all") {
                    navigate(`${routes.resourceExplore}?category=${encodeURIComponent(cat.label)}`);
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="rl2-container rl2-main">

        {/* Popular Institutions */}
        <section className="rl2-section">
          <div className="rl2-section__head">
            <h2>Popular Institutions</h2>
            <Link to={routes.resourceExplore} className="rl2-view-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="rl2-institutions-grid">
            {isLoading
              ? [...Array(6)].map((_, i) => <div key={i} className="rl2-skeleton" />)
              : (data?.institutions || []).slice(0, 6).map((inst) => (
                  <button
                    key={inst.id}
                    className="rl2-inst-card"
                    onClick={() => setActiveInstitution(inst)}
                  >
                    <div className="rl2-inst-icon">
                      <Building2 size={20} />
                    </div>
                    <div className="rl2-inst-info">
                      <span className="rl2-inst-name">{inst.name}</span>
                    </div>
                    <span className="rl2-inst-count">{inst.resourceCount}</span>
                    <ChevronRight size={16} className="rl2-inst-arrow" />
                  </button>
                ))}
          </div>
        </section>

        {/* Recently Added */}
        <section className="rl2-section">
          <div className="rl2-section__head">
            <h2>Recently Added</h2>
          </div>

          <div className="rl2-recent-list">
            {isLoading
              ? [...Array(4)].map((_, i) => <div key={i} className="rl2-skeleton rl2-skeleton--row" />)
              : (data?.recentResources || []).slice(0, 5).map((res) => {
                  const style = getFileStyle(res.categoryName);
                  const Icon = style.icon;
                  return (
                    <div
                      key={res.id}
                      className="rl2-recent-row"
                      onClick={() => navigate(routes.resourceExplore)}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className="rl2-file-icon"
                        style={{ background: style.bg, color: style.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="rl2-file-info">
                        <strong className="rl2-file-name">{res.displayName}</strong>
                        <span className="rl2-file-meta">
                          {res.institutionName}
                          <span
                            className="rl2-cat-badge"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {res.categoryName}
                          </span>
                        </span>
                      </div>
                      <ArrowRight size={16} className="rl2-row-arrow" />
                    </div>
                  );
                })}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {activeInstitution && (
          <ResourceDiscoveryModal
            institution={activeInstitution}
            onClose={() => setActiveInstitution(null)}
          />
        )}
      </AnimatePresence>

      <footer className="rl2-footer">
        <div className="rl2-container">
          <p>© 2026 VCollab · Academic resources, for everyone.</p>
        </div>
      </footer>
    </div>
  );
}
