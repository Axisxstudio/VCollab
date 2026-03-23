import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Folder,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  FileText,
  Search,
  Settings,
  AlertTriangle,
  User,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import NotificationBell from "../components/notifications/NotificationBell";
import RealtimeNotificationToaster from "../components/notifications/RealtimeNotificationToaster";
import SettingsPopup from "../components/settings/SettingsPopup";
import { roles } from "../config/constants";
import { routes } from "../config/routes";
import { useAuthStore } from "../store/authStore";
import { formatRole } from "../utils/discovery";
import logoImg from "../assets/logo.png";
import { searchWorkspace } from "../services/search.service";
import { useDebounce } from "../hooks/useDebounce";
import "../styles/app-shell.css";

const APP_LINKS = [
  { to: routes.home, label: "Home", icon: Home, end: true },
  { to: routes.search, label: "Search", icon: Search },
  { to: routes.projects, label: "Projects", icon: Folder },
  { to: routes.posts, label: "Posts", icon: FileText },
  { to: routes.blogs, label: "Blogs", icon: BookOpen },
  { to: routes.requests, label: "Requests", icon: Bell },
  { to: routes.messages, label: "Messages", icon: MessageSquare },
  { to: routes.warnings, label: "Warnings", icon: AlertTriangle }
];

function getInitials(name) {
  if (!name) return "V";
  return name.trim().charAt(0).toUpperCase();
}

export default function MainLayout() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const profilePath = user?.username
    ? routes.profile.replace(":username", user.username)
    : routes.home;
  const isAdmin = user?.role === roles.SUPER_ADMIN;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
  };

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["live-search", debouncedSearch],
    queryFn: () => searchWorkspace({ query: debouncedSearch, size: 3 }),
    enabled: debouncedSearch.length > 1
  });

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`${routes.search}?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const hasResults = searchResults && (
    (searchResults.users && searchResults.users.length > 0) || 
    (searchResults.projects && searchResults.projects.length > 0) || 
    (searchResults.blogs && searchResults.blogs.length > 0) || 
    (searchResults.posts && searchResults.posts.length > 0)
  );

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!searchQuery) {
          setSearchExpanded(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  return (
    <div className={`workspace-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`workspace-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="workspace-sidebar-header">
          <Link to={routes.home} className="workspace-brand">
            <img src={logoImg} alt="VCollab" className="workspace-brand-logo" />
            {!isCollapsed && <span className="workspace-brand-text">VCollab</span>}
          </Link>
          <button 
            type="button" 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="workspace-nav">
          {APP_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `workspace-nav-link ${isActive ? "active" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                {({ isActive }) => (
                  <>
                    <div className="nav-icon-wrapper">
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <NavLink 
              to={routes.adminDashboard} 
              className={({ isActive }) => `workspace-nav-link ${isActive ? "active" : ""}`}
              title={isCollapsed ? "Admin Console" : ""}
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!isCollapsed && <span className="nav-label">Admin Console</span>}
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="workspace-sidebar-footer">
          <NavLink 
            to={profilePath} 
            className={({ isActive }) => `workspace-nav-link profile-link ${isActive ? "active" : ""}`}
            title={isCollapsed ? "Profile" : ""}
          >
            <div className="nav-icon-wrapper profile-avatar-mini">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" />
              ) : (
                <div className="avatar-initials">{getInitials(user?.fullName || user?.username)}</div>
              )}
            </div>
            {!isCollapsed && <span className="nav-label">Profile</span>}
          </NavLink>

          <button 
            type="button" 
            className={`workspace-nav-link more-link ${isSettingsOpen ? "active" : ""}`}
            onMouseEnter={() => setIsSettingsOpen(true)}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title={isCollapsed ? "More" : ""}
          >
            <div className="nav-icon-wrapper">
              <Settings size={24} strokeWidth={isSettingsOpen ? 2.5 : 2} />
            </div>
            {!isCollapsed && <span className="nav-label">Settings</span>}
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-copy">
            <span className="workspace-eyebrow">Signed-in workspace</span>
            <h2>Welcome back, {user?.fullName || user?.username || "collaborator"}</h2>
            <p>Manage projects, posts, blogs, requests, and conversations from one professional side navigation.</p>
          </div>
          <div className="workspace-top-actions">
            <div 
              ref={searchContainerRef}
              className={`workspace-search-expanded ${searchExpanded ? "expanded" : ""}`}
              onMouseEnter={() => setSearchExpanded(true)}
              onMouseLeave={() => {
                const isFocused = document.activeElement === searchInputRef.current;
                if (!searchQuery && !isFocused) {
                  setSearchExpanded(false);
                }
              }}
            >
              <Search size={20} className="search-icon-trigger" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search everything..."
                className="search-input-box"
                value={searchQuery}
                onFocus={() => setSearchExpanded(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />

              {searchQuery && (
                <button 
                  className="search-clear-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <X size={14} />
                </button>
              )}

              {searchExpanded && debouncedSearch.length > 1 && (
                <div className="search-live-dropdown">
                  {isSearching && <div className="search-live-item disabled">Searching...</div>}
                  
                  {!isSearching && !hasResults && (
                    <div className="search-live-item disabled">No results for "{debouncedSearch}"</div>
                  )}

                  {!isSearching && hasResults && searchResults.users?.length > 0 && (
                    <div className="search-live-group">
                      <div className="search-live-label">Users</div>
                      {searchResults.users.map(u => (
                        <Link key={u.id} to={routes.profile.replace(":username", u.username)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <User size={14} /> {u.fullName || u.username}
                        </Link>
                      ))}
                    </div>
                  )}

                  {!isSearching && hasResults && searchResults.projects?.length > 0 && (
                    <div className="search-live-group">
                      <div className="search-live-label">Projects</div>
                      {searchResults.projects.map(p => (
                        <Link key={p.id} to={routes.projectDetail.replace(":id", p.id)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <Folder size={14} /> {p.title || "Untitled Project"}
                        </Link>
                      ))}
                    </div>
                  )}

                  {!isSearching && hasResults && searchResults.posts?.length > 0 && (
                    <div className="search-live-group">
                      <div className="search-live-label">Posts</div>
                      {searchResults.posts.map(po => (
                        <Link key={po.id} to={routes.postDetail.replace(":id", po.id)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <FileText size={14} /> {po.title || "Untitled Post"}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  <Link 
                    to={`${routes.search}?q=${encodeURIComponent(debouncedSearch)}`} 
                    className="search-live-item view-all"
                    onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}
                  >
                    View all results for "{debouncedSearch}"
                  </Link>
                </div>
              )}
            </div>
            
            <NotificationBell size={18} />
            
            <div 
              className="user-nav-container"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
              style={{ position: 'relative' }}
            >
              <Link to={profilePath} className="icon-btn-pro admin-avatar-btn">
                <div className="admin-user-nav-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user?.fullName || user?.username || "Collaborator"} />
                  ) : (
                    getInitials(user?.fullName || user?.username)
                  )}
                </div>
              </Link>

              {showDropdown && (
                <div className="user-nav-dropdown">
                  <div className="dropdown-header">
                    <strong>{user?.fullName || user?.username}</strong>
                    <span>@{user?.username}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to={profilePath} className="dropdown-item">
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to={routes.settings} className="dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="workspace-content">
          <div className="workspace-container">
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPopup 
            isCollapsed={isCollapsed} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>

      <RealtimeNotificationToaster />
    </div>
  );
}
