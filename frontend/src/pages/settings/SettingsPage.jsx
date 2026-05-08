import { useState } from "react";
import { 
  Bookmark, 
  Archive, 
  Activity, 
  Trash2, 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  ShieldCheck,
  ChevronRight,
  UserCircle,
  HelpCircle,
  History,
  Layout,
  FileText,
  MessageSquare,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { routes } from "../../config/routes";

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my-activity");
  const [contentFilter, setContentFilter] = useState("All");

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
  };

  const menuGroups = [
    {
      label: "How you use VCollab",
      items: [
        { id: "saved", label: "Saved", icon: Bookmark, description: "Manage your bookmarked projects and posts" },
        { id: "archived", label: "Archived", icon: Archive, description: "View and restore your hidden projects" },
        { id: "my-activity", label: "My Activity", icon: Activity, description: "Track your interactions and history" },
      ]
    },
    {
      label: "Your account",
      items: [
        { id: "recycle-bin", label: "Recycle Bin", icon: Trash2, description: "Recently deleted content" },
        { id: "account", label: "Account Center", icon: UserCircle, description: "Security, login, and personal details" },
      ]
    }
  ];

  const bottomItems = [
    { id: "help", label: "Help Center", icon: HelpCircle },
    { id: "logout", label: "Log out", icon: LogOut, color: "var(--color-error)", action: handleLogout }
  ];

  const filterToggles = [
    { id: "All", label: "All", icon: Layers },
    { id: "Projects", label: "Projects", icon: Layout },
    { id: "Blogs", label: "Blogs", icon: FileText },
    { id: "Posts", label: "Posts", icon: MessageSquare },
  ];

  // Mock data for "Activity"
  const mockActivities = [
    { id: 1, type: "Projects", title: "Titan AI Platform", date: "2 hours ago", status: "Active" },
    { id: 2, type: "Posts", title: "Update on Sprint 4", date: "5 hours ago", status: "Published" },
    { id: 3, type: "Blogs", title: "Future of Agentic AI", date: "Yesterday", status: "Draft" },
    { id: 4, type: "Projects", title: "VCollab Frontend Hub", date: "3 days ago", status: "Active" },
    { id: 5, type: "Posts", title: "Happy Coding!", date: "1 week ago", status: "Archived" },
  ];

  const filteredActivities = contentFilter === "All" 
    ? mockActivities 
    : mockActivities.filter(a => a.type === contentFilter);

  const activeInfo = [...menuGroups.flatMap(g => g.items), ...bottomItems].find(i => i.id === activeTab);
  const showFilters = ["my-activity", "saved", "archived", "recycle-bin"].includes(activeTab);

  const getIcon = (type) => {
    if (type === "Projects") return <Layout size={16} />;
    if (type === "Blogs") return <FileText size={16} />;
    return <MessageSquare size={16} />;
  };

  return (
    <div className="section">
      <div className="discovery-results-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ padding: "4px 10px", background: "var(--color-primary-light)", color: "var(--color-primary)", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>USER HUB</span>
        </div>
        <h2 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-0.02em" }}>Settings & Activity</h2>
        <p className="profile-meta">Experience the power of complete control over your collaboration history.</p>
      </div>

      <div className="split" style={{ gridTemplateColumns: "320px 1fr", gap: "32px", marginTop: "40px" }}>
        {/* Sidebar Navigation */}
        <aside className="social-sidebar-left" style={{ position: "sticky", top: "100px" }}>
          <div className="card" style={{ padding: "12px", borderRadius: "24px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
            <div className="settings-user-info" style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                 <div style={{ 
                    width: "52px", 
                    height: "52px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)", 
                    color: "#fff", 
                    display: "grid", 
                    placeItems: "center", 
                    fontWeight: "900",
                    fontSize: "1.25rem",
                    boxShadow: "0 10px 15px -3px rgba(24, 119, 242, 0.3)"
                 }}>
                    {user?.fullName?.charAt(0) || "V"}
                 </div>
                 <div>
                    <strong style={{ display: "block", fontSize: "1.1rem", color: "#0f172a" }}>{user?.fullName}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>@{user?.username}</span>
                 </div>
              </div>
            </div>

            {menuGroups.map((group, idx) => (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", padding: "0 16px", marginBottom: "12px", display: "block", fontWeight: "800" }}>{group.label}</span>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`share-action-item ${activeTab === item.id ? "active-setting-tab" : ""}`}
                    style={{ 
                      width: "100%", 
                      justifyContent: "space-between", 
                      padding: "12px 16px",
                      background: activeTab === item.id ? "var(--color-primary-light)" : "transparent",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      color: activeTab === item.id ? "var(--color-primary)" : "#475569",
                      transition: "all 0.2s",
                      marginBottom: "4px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <item.icon size={20} style={{ opacity: activeTab === item.id ? 1 : 0.7 }} />
                      <span style={{ fontWeight: activeTab === item.id ? "700" : "600", fontSize: "0.95rem" }}>{item.label}</span>
                    </div>
                    <ChevronRight size={16} style={{ opacity: activeTab === item.id ? 1 : 0.3 }} />
                  </button>
                ))}
              </div>
            ))}

            <div style={{ margin: "16px 0", borderTop: "1px solid #f1f5f9" }} />
            
            {bottomItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action ? item.action : () => setActiveTab(item.id)}
                className="share-action-item"
                style={{ 
                  width: "100%", 
                  justifyContent: "flex-start", 
                  padding: "12px 16px",
                  background: activeTab === item.id ? "var(--color-primary-light)" : "transparent",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  color: item.color || (activeTab === item.id ? "var(--color-primary)" : "#475569")
                }}
              >
                <item.icon size={20} style={{ marginRight: "12px", opacity: 0.7 }} />
                <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="card" style={{ padding: "48px", borderRadius: "24px", minHeight: "750px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.03)" }}>
          <div style={{ maxWidth: "850px" }}>
            <div style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "grid", placeItems: "center", marginBottom: "20px" }}>
                    {activeInfo?.icon && <activeInfo.icon size={32} />}
                    </div>
                    <h3 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "8px", color: "#0f172a" }}>{activeInfo?.label}</h3>
                    <p style={{ color: "#64748b", fontSize: "1.1rem", fontWeight: "500", maxWidth: "450px" }}>{activeInfo?.description || "Configure your preferences and account security."}</p>
                </div>
                
                {showFilters && (
                    <div style={{ 
                    display: "flex", 
                    background: "#f8fafc", 
                    padding: "6px", 
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                    }}>
                    {filterToggles.map((f) => (
                        <button
                        key={f.id}
                        onClick={() => setContentFilter(f.id)}
                        style={{
                            padding: "10px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "0.9rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            background: contentFilter === f.id ? "#fff" : "transparent",
                            color: contentFilter === f.id ? "var(--color-primary)" : "#64748b",
                            boxShadow: contentFilter === f.id ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        >
                        <f.icon size={18} />
                        {f.label}
                        </button>
                    ))}
                    </div>
                )}
              </div>
            </div>

            {activeTab === "my-activity" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredActivities.length > 0 ? (
                        filteredActivities.map((activity) => (
                            <div key={activity.id} className="activity-item-pro" style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "space-between", 
                                padding: "20px", 
                                background: "#fff", 
                                borderRadius: "20px", 
                                border: "1px solid #f1f5f9",
                                cursor: "pointer"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                    <div style={{ 
                                        width: "48px", 
                                        height: "48px", 
                                        borderRadius: "12px", 
                                        background: "#f1f5f9", 
                                        display: "grid", 
                                        placeItems: "center", 
                                        color: "var(--color-primary)" 
                                    }}>
                                        {getIcon(activity.type)}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--color-primary)", textTransform: "uppercase" }}>{activity.type.slice(0, -1)}</span>
                                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }}></span>
                                            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>{activity.date}</span>
                                        </div>
                                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "4px 0 0", color: "#1e293b" }}>{activity.title}</h4>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ 
                                        padding: "4px 12px", 
                                        borderRadius: "20px", 
                                        fontSize: "0.75rem", 
                                        fontWeight: "700", 
                                        background: activity.status === 'Archived' ? '#f1f5f9' : '#ecfdf5',
                                        color: activity.status === 'Archived' ? '#64748b' : '#10b981',
                                        border: `1px solid ${activity.status === 'Archived' ? '#e2e8f0' : '#d1fae5'}`
                                    }}>{activity.status}</span>
                                    <ChevronRight size={18} color="#cbd5e1" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: "center", padding: "80px 40px" }}>
                            <div style={{ opacity: 0.1, marginBottom: "20px" }}>
                                <History size={80} />
                            </div>
                            <h4 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b" }}>No {contentFilter.toLowerCase()} found</h4>
                            <p style={{ color: "#64748b", maxWidth: "320px", margin: "8px auto 0" }}>Refine your filter or check back later after contributing to the platform.</p>
                        </div>
                    )}
                    
                    <button className="btn-outline" style={{ marginTop: "20px", width: "100%", padding: "16px", borderRadius: "16px", fontWeight: "700", color: "#64748b" }}>
                        Load More Activity
                    </button>
                </div>
            ) : (
                <div className="settings-content-placeholder" style={{ 
                    borderRadius: "24px",
                    padding: "80px 40px",
                    textAlign: "center",
                    background: "#fcfdfe",
                    border: "2px dashed #f1f5f9"
                    }}>
                    <div style={{ opacity: 0.2, marginBottom: "24px" }}>
                        <History size={72} />
                    </div>
                    <h4 style={{ fontSize: "1.5rem", marginBottom: "12px", fontWeight: "900", color: "#1e293b" }}>
                        {contentFilter === "All" ? "No content history yet" : `No ${contentFilter.toLowerCase()} found`}
                    </h4>
                    <p style={{ color: "#64748b", fontSize: "1.1rem", fontWeight: "500", maxWidth: "400px", margin: "0 auto", lineHeight: "1.6" }}>
                        {contentFilter === "All" 
                        ? `Your ${activeInfo?.label.toLowerCase()} is currently empty. Start interacting with the platform to see items here.`
                        : `You haven't added or saved any ${contentFilter.toLowerCase()} in your ${activeInfo?.label.toLowerCase()} yet.`}
                    </p>
                    
                    <button className="btn-primary" style={{ marginTop: "32px", padding: "14px 40px", borderRadius: "16px", fontSize: "1rem", fontWeight: "800" }}>
                        Explore Collaboration
                    </button>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
