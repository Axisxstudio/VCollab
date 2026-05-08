import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpenText,
  ChevronDown,
  CirclePlus,
  Database,
  FileDown,
  FolderKanban,
  LibraryBig,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MessageSquare,
  NotebookTabs,
  Search,
  Settings,
  ShieldAlert,
  Tags,
  Trash2,
  TriangleAlert,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../components/notifications/NotificationBell";
import { routes } from "../config/routes";
import { useAuthStore } from "../store/authStore";
import logoImg from "../assets/logo.png";
import "../styles/app-shell.css";

const NAV_GROUPS = [
  {
    label: "Overview",
    links: [
      { to: routes.adminDashboard, label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: routes.adminAuditLogs, label: "Audit Logs", icon: History }
    ]
  },
  {
    label: "Content",
    links: [
      { to: routes.adminProjects, label: "Projects", icon: FolderKanban },
      { to: routes.adminPosts, label: "Posts", icon: NotebookTabs },
      { to: routes.adminBlogs, label: "Blogs", icon: BookOpenText },
      { to: routes.adminResources, label: "Resources", icon: LibraryBig },
      { to: routes.adminCmsBlocks, label: "CMS Blocks", icon: LayoutTemplate }
    ]
  },
  {
    label: "Governance",
    links: [
      { to: routes.adminUsers, label: "Users", icon: Users },
      { to: routes.adminVHub, label: "V Hub", icon: MessageSquare },
      { to: routes.adminReports, label: "Reports", icon: ShieldAlert },
      { to: routes.adminWarnings, label: "Warnings", icon: TriangleAlert },
      { to: routes.adminCategories, label: "Categories", icon: Tags },
      { to: routes.adminRecycleBin, label: "Recycle Bin", icon: Trash2 },
      { to: routes.adminExports, label: "Export Center", icon: FileDown }
    ]
  }
];

const QUICK_CREATE_LINKS = [
  { to: routes.projectCreate, label: "New Project" },
  { to: routes.postCreate, label: "New Post" },
  { to: routes.blogCreate, label: "New Blog" }
];

const ALL_LINKS = NAV_GROUPS.flatMap((group) => group.links);

function getInitials(name) {
  return (name || "V").trim().slice(0, 2).toUpperCase();
}

function getProfilePath(username) {
  return routes.profile.replace(":username", username || "");
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed-admin") === "true";
  });
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef(null);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed-admin", newState);
  };

  const currentNavItem =
    ALL_LINKS.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    ) || ALL_LINKS[0];

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
  };

  useEffect(() => {
    if (location.pathname !== routes.search) {
      return;
    }
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("q") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setCreateOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setCreateOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      navigate(routes.search);
      return;
    }
    navigate(`${routes.search}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={`workspace-shell admin-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`admin-sidebar-pro ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-toggle-wrapper" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className="sidebar-toggle-btn admin-toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
        </div>

        <Link to={routes.adminDashboard} className="workspace-brand-pro">
          <img src={logoImg} alt="VCollab" className="admin-brand-logo" />
          {!isCollapsed && (
            <div className="brand-text-pro">
              <strong>VCollab Admin</strong>
              <span>Operations Console</span>
            </div>
          )}
        </Link>

        <Link to={getProfilePath(user?.username)} className="admin-sidebar-profile-card">
          <div className="admin-user-nav-avatar admin-user-nav-avatar--large">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user?.fullName || user?.username || "Administrator"} />
            ) : (
              getInitials(user?.fullName || user?.username)
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="admin-sidebar-profile-copy">
                <strong>{user?.fullName || user?.username || "Admin User"}</strong>
                <span>@{user?.username || "admin"}</span>
                <small>Super administrator access</small>
              </div>
              <ChevronDown size={16} />
            </>
          )}
        </Link>

        <nav className="admin-nav-pro">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              {!isCollapsed && <span className="admin-nav-label">{group.label}</span>}
              {group.links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `admin-nav-link-pro ${isActive ? "active" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon size={18} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer-pro">
          {!isCollapsed && (
            <Link to={routes.adminExports} className="admin-sidebar-secondary-link">
              <Database size={16} />
              Export records and reports
            </Link>
          )}
          <button type="button" className="btn-terminate" onClick={handleLogout} title={isCollapsed ? "Log Out" : ""}>
            <LogOut size={18} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      <div className="workspace-main admin-main-panel">
        <header className="admin-topbar-pro">
          <div className="admin-topbar-copy">
            <h2>{currentNavItem.label}</h2>
          </div>

          <div className="admin-topbar-toolbar">
            <form className="admin-search-wrapper" onSubmit={handleSearchSubmit}>
              <Search className="admin-search-icon" size={18} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search contributors, projects, posts, or blogs"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search VCollab"
              />
            </form>

            <div className="admin-header-actions">
              <div
                ref={createRef}
                className={`admin-topbar-create-dock ${createOpen ? "is-open" : ""}`}
                onMouseEnter={() => setCreateOpen(true)}
                onMouseLeave={() => setCreateOpen(false)}
              >
                <button
                  type="button"
                  className="admin-topbar-create-btn"
                  aria-haspopup="menu"
                  aria-expanded={createOpen}
                  aria-label="Create content"
                  title="Create content"
                  onClick={() => setCreateOpen((prev) => !prev)}
                >
                  <CirclePlus size={20} />
                </button>

                <div className="admin-topbar-create-menu" role="menu" aria-label="Create options">
                  {QUICK_CREATE_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="admin-topbar-create-option"
                      role="menuitem"
                      onClick={() => setCreateOpen(false)}
                    >
                      <CirclePlus size={14} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="admin-utility-group">
                <div className="icon-btn-pro">
                  <NotificationBell icon={Bell} size={18} />
                </div>
                <div className="icon-btn-pro">
                  <Settings size={18} />
                </div>
                <Link to={getProfilePath(user?.username)} className="icon-btn-pro admin-avatar-btn">
                  <div className="admin-user-nav-avatar">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user?.fullName || user?.username || "Administrator"} />
                    ) : (
                      getInitials(user?.fullName || user?.username)
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-pro-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
