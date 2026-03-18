import { useNavigate, Link } from "react-router-dom";
import { 
  Bookmark, 
  Archive, 
  Activity, 
  Trash2, 
  LogOut, 
  HelpCircle,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { routes } from "../../config/routes";
import { motion } from "framer-motion";

export default function SettingsPopup({ isOpen, onClose }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
    onClose();
  };

  const menuGroups = [
    {
      label: "HOW YOU USE VCOLLAB",
      items: [
        { id: "saved", label: "Saved", icon: Bookmark, path: routes.settings },
        { id: "archived", label: "Archived", icon: Archive, path: routes.settings },
        { id: "my-activity", label: "My Activity", icon: Activity, path: routes.settings },
      ]
    },
    {
      label: "YOUR ACCOUNT",
      items: [
        { id: "recycle-bin", label: "Recycle Bin", icon: Trash2, path: routes.settings },
        { id: "account", label: "Account Center", icon: UserCircle, path: routes.settings },
      ]
    }
  ];

  return (
    <div 
      className="settings-popup-overlay"
      onMouseLeave={onClose}
      style={{
        position: "fixed",
        left: "280px",
        bottom: "80px",
        zIndex: 2000,
        padding: "10px"
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -10 }}
        transition={{ duration: 0.2 }}
        className="card"
        style={{
          width: "320px",
          padding: "12px 0",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff"
        }}
      >
        <div style={{ padding: "8px 16px 16px", borderBottom: "1px solid #f0f2f5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "50%", 
              background: "var(--color-primary)", 
              color: "#fff", 
              display: "grid", 
              placeItems: "center", 
              fontWeight: "bold",
              fontSize: "1.2rem"
            }}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "V"}
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "1rem", color: "#0f172a" }}>{user?.fullName?.toUpperCase() || user?.username?.toUpperCase()}</strong>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>@{user?.username?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px" }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: "12px" }}>
              <span style={{ 
                fontSize: "0.7rem", 
                fontWeight: "700", 
                color: "#94a3b8", 
                padding: "8px 16px", 
                display: "block",
                letterSpacing: "0.05em"
              }}>
                {group.label}
              </span>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    textDecoration: "none",
                    color: item.id === "my-activity" ? "var(--color-primary)" : "#334155",
                    background: item.id === "my-activity" ? "var(--color-primary-light)" : "transparent",
                    borderRadius: "8px",
                    margin: "2px 0",
                    transition: "all 0.2s"
                  }}
                  className="settings-popup-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <item.icon size={18} />
                    <span style={{ fontSize: "0.9rem", fontWeight: item.id === "my-activity" ? "700" : "500" }}>{item.label}</span>
                  </div>
                  <ChevronRight size={14} opacity={0.4} />
                </Link>
              ))}
            </div>
          ))}

          <div style={{ margin: "8px 0", borderTop: "1px solid #f0f2f5" }} />
          
          <div style={{ padding: "4px" }}>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#334155"
              }}
            >
              <HelpCircle size={18} />
              <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>Help Center</span>
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-error)"
              }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>Log out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
