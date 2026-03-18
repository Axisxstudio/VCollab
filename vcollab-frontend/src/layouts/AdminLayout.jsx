import { useEffect, useState } from "react";
import {
  Bell,
  BookOpenText,
  ChevronDown,
  CirclePlus,
  Database,
  FileDown,
  FolderKanban,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  NotebookTabs,
  Search,
  Settings,
  ShieldAlert,
  Tags,
  Trash2,
  TriangleAlert,
  Users
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
      { to: routes.adminCmsBlocks, label: "CMS Blocks", icon: LayoutTemplate }
    ]
  },
  {
    label: "Governance",
    links: [
      { to: routes.adminUsers, label: "Users", icon: Users },
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
    <div className="workspace-shell admin-shell">
      <aside className="admin-sidebar-pro">
        <Link to={routes.adminDashboard} className="workspace-brand-pro">
          <img src={logoImg} alt="VCollab" className="admin-brand-logo" />
          <div className="brand-text-pro">
            <strong>VCollab Admin</strong>
            <span>Operations Console</span>
          </div>
        </Link>

        <Link to={getProfilePath(user?.username)} className="admin-sidebar-profile-card">
          <div className="admin-user-nav-avatar admin-user-nav-avatar--large">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user?.fullName || user?.username || "Administrator"} />
            ) : (
              getInitials(user?.fullName || user?.username)
            )}
          </div>
          <div className="admin-sidebar-profile-copy">
            <strong>{user?.fullName || user?.username || "Admin User"}</strong>
            <span>@{user?.username || "admin"}</span>
            <small>Super administrator access</small>
          </div>
          <ChevronDown size={16} />
        </Link>

        <nav className="admin-nav-pro">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <span className="admin-nav-label">{group.label}</span>
              {group.links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `admin-nav-link-pro ${isActive ? "active" : ""}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer-pro">
          <Link to={routes.adminExports} className="admin-sidebar-secondary-link">
            <Database size={16} />
            Export records and reports
          </Link>
          <button type="button" className="btn-terminate" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
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
              <div className="admin-header-shortcuts">
                {QUICK_CREATE_LINKS.map((item) => (
                  <Link key={item.to} to={item.to} className="admin-quick-action-link">
                    <CirclePlus size={16} />
                    {item.label}
                  </Link>
                ))}
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
