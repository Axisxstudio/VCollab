import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Folder,
  LibraryBig,
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
  ChevronRight,
  Menu
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
  { to: routes.resourceManage, label: "Resources", icon: LibraryBig },
  { to: routes.projects, label: "Projects", icon: Folder },
  { to: routes.posts, label: "Posts", icon: FileText },
  { to: routes.blogs, label: "Blogs", icon: BookOpen },
  { to: routes.requests, label: "Requests", icon: Bell },
  { to: routes.messages, label: "Messages", icon: MessageSquare },
  { to: routes.warnings, label: "Warnings", icon: AlertTriangle },
  { to: routes.settings, label: "Settings", icon: Settings }
];

function getInitials(name) {
  if (!name) return "V";
  return name.trim().charAt(0).toUpperCase();
}

export default function MainLayout() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const userDropdownRef = useRef(null);
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    setShowDropdown(false);
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const contentRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 20);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className={`workspace-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`workspace-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="workspace-sidebar-header">
          <Link to={routes.home} className="workspace-brand">
            <div className="sidebar-brand-glow">
              <img src={logoImg} alt="VCollab" className="workspace-brand-logo" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="sidebar-brand-copy">
                <span className="workspace-brand-text">VCollab</span>
              </div>
            )}
          </Link>
          <button 
            type="button" 
            className="sidebar-toggle-btn desktop-toggle-btn" 
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
          </button>
          {isMobileOpen && (
            <button 
              type="button" 
              className="sidebar-toggle-btn mobile-close-btn" 
              onClick={() => setIsMobileOpen(false)}
              style={{ display: 'flex', marginLeft: 'auto' }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          )}
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
                onClick={() => setIsMobileOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <div className="nav-icon-wrapper">
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {(!isCollapsed || isMobileOpen) && <span className="nav-label">{item.label}</span>}
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
              onClick={() => setIsMobileOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {(!isCollapsed || isMobileOpen) && <span className="nav-label">Admin Console</span>}
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="workspace-sidebar-footer">
          {(!isCollapsed || isMobileOpen) ? (
            <Link to={profilePath} className="sidebar-user-glass-card" onClick={() => setIsMobileOpen(false)}>
              <div className="user-glass-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">{getInitials(user?.fullName || user?.username)}</div>
                )}
              </div>
              <div className="user-glass-info">
                <span className="user-glass-name">{user?.fullName || user?.username}</span>
                <span className="user-glass-handle">@{user?.username}</span>
              </div>
            </Link>
          ) : (
            <NavLink 
              to={profilePath} 
              className={({ isActive }) => `workspace-nav-link more-link ${isActive ? "active" : ""}`}
              title="Profile"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="nav-icon-wrapper profile-avatar-mini">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" />
                ) : (
                  <div className="avatar-initials">{getInitials(user?.fullName || user?.username)}</div>
                )}
              </div>
            </NavLink>
          )}
        </div>
      </aside>

      {isMobileOpen && (
        <div className="mobile-overlay mobile-open" onClick={() => setIsMobileOpen(false)} />
      )}

      <div className="workspace-main">
        <header className={`workspace-topbar ${isScrolled ? "scrolled" : ""}`}>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <div className="workspace-topbar-copy">
            <h2>Welcome back, <span className="user-name-gradient">{user?.fullName || user?.username || "collaborator"}</span></h2>
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

              {searchExpanded && (
                <button 
                  type="button"
                  className="search-close-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    setSearchExpanded(false);
                  }}
                >
                  <X size={18} />
                </button>
              )}

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
              ref={userDropdownRef}
              className="user-nav-container"
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                className="icon-btn-pro admin-avatar-btn"
                onClick={() => setShowDropdown((current) => !current)}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={showDropdown}
              >
                <div className="admin-user-nav-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user?.fullName || user?.username || "Collaborator"} />
                  ) : (
                    getInitials(user?.fullName || user?.username)
                  )}
                </div>
              </button>

              {showDropdown && (
                <div className="user-nav-dropdown" role="menu">
                  <div className="dropdown-header">
                    <strong>{user?.fullName || user?.username}</strong>
                    <span>@{user?.username}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to={profilePath} className="dropdown-item" onClick={() => setShowDropdown(false)} role="menuitem">
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to={routes.settings} className="dropdown-item" onClick={() => setShowDropdown(false)} role="menuitem">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-item dropdown-item--danger" onClick={handleLogout} role="menuitem">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main ref={contentRef} className="workspace-content">
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
