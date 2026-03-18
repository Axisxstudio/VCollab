import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpenText,
  FolderKanban,
  House,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  NotebookTabs,
  Search,
  Settings,
  TriangleAlert,
  Users,
  X
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import NotificationBell from "../components/notifications/NotificationBell";
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
  { to: routes.home, label: "Home", icon: House, end: true },
  { to: routes.search, label: "Search", icon: Search },
  { to: routes.projects, label: "Projects", icon: FolderKanban },
  { to: routes.posts, label: "Posts", icon: NotebookTabs },
  { to: routes.blogs, label: "Blogs", icon: BookOpenText },
  { to: routes.requests, label: "Requests", icon: Bell },
  { to: routes.messages, label: "Messages", icon: MessageSquareMore },
  { to: routes.warnings, label: "Warnings", icon: TriangleAlert },
  { to: routes.settings, label: "Settings", icon: Settings }
];

function getInitials(name) {
  return (name || "V").trim().charAt(0).toUpperCase();
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

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

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
    searchResults.users?.length > 0 || 
    searchResults.projects?.length > 0 || 
    searchResults.blogs?.length > 0 || 
    searchResults.posts?.length > 0
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
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link to={routes.home} className="workspace-brand">
          <img src={logoImg} alt="VCollab" className="workspace-brand-logo" />
          <div className="workspace-brand-col">
            <strong>VCollab</strong>
            <span>Workspace</span>
          </div>
        </Link>

        <div className="workspace-user-card">
          <div className="workspace-avatar">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.fullName || user.username || "User"} />
            ) : (
              <span>{getInitials(user?.fullName || user?.username)}</span>
            )}
          </div>
          <div className="workspace-user-meta">
            <strong>{user?.fullName || user?.username || "VCollab User"}</strong>
            <span>@{user?.username || "workspace"}</span>
            <div className="workspace-role-chip">{formatRole(user?.role)}</div>
          </div>
        </div>

        <nav className="workspace-nav" style={{ position: 'relative' }}>
          {APP_LINKS.map((item) => {
            const Icon = item.icon;
            const isSettingsLink = item.to === routes.settings;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `workspace-nav-link ${isActive ? "active" : ""}`}
                onMouseEnter={isSettingsLink ? () => setIsSettingsOpen(true) : undefined}
                onMouseLeave={isSettingsLink ? (e) => {
                  // Small delay to check if they moved into the popup
                  setTimeout(() => {
                    // We don't have an easy way to check current mouse position without more state
                    // but move into the popup will be handled by the popup's own onMouseLeave
                  }, 100);
                } : undefined}
                onClick={isSettingsLink ? (e) => {
                  e.preventDefault();
                  setIsSettingsOpen(!isSettingsOpen);
                } : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {isAdmin && (
            <NavLink to={routes.adminDashboard} className={({ isActive }) => `workspace-nav-link ${isActive ? "active" : ""}`}>
              <LayoutDashboard size={18} />
              <span>Admin Console</span>
            </NavLink>
          )}
        </nav>

        <div className="workspace-sidebar-footer">
          <Link to={routes.profileEdit} className="btn-outline">Edit Profile</Link>
          <button type="button" className="btn-outline" onClick={handleLogout}>Log Out</button>
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
                    <div className="search-live-item disabled">No quick results found.</div>
                  )}

                  {searchResults?.users?.length > 0 && (
                    <div className="search-live-section">
                      <div className="search-live-label">Users</div>
                      {searchResults.users.map(u => (
                        <Link key={u.id} to={routes.profile.replace(":username", u.username)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <Users size={14} /> {u.fullName || u.username}
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults?.projects?.length > 0 && (
                    <div className="search-live-section">
                      <div className="search-live-label">Projects</div>
                      {searchResults.projects.map(p => (
                        <Link key={p.id} to={routes.projectDetail.replace(":id", p.id)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <FolderKanban size={14} /> {p.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults?.blogs?.length > 0 && (
                    <div className="search-live-section">
                      <div className="search-live-label">Blogs</div>
                      {searchResults.blogs.map(b => (
                        <Link key={b.id} to={routes.blogDetail.replace(":id", b.id)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <BookOpenText size={14} /> {b.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults?.posts?.length > 0 && (
                    <div className="search-live-section">
                      <div className="search-live-label">Posts</div>
                      {searchResults.posts.map(po => (
                        <Link key={po.id} to={routes.postDetail.replace(":id", po.id)} className="search-live-item" onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}>
                          <NotebookTabs size={14} /> {po.title || "Untitled Post"}
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
                    <Users size={16} />
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
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
