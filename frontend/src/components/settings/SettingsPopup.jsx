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

export default function SettingsPopup({ isOpen, isCollapsed, onClose }) {
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
        { id: "saved", label: "Saved Items", icon: Bookmark, path: `${routes.settings}?tab=saved` },
        { id: "archived", label: "Archived Content", icon: Archive, path: `${routes.settings}?tab=archived` },
        { id: "my-activity", label: "My Activity", icon: Activity, path: `${routes.settings}?tab=activity` },
      ]
    },
    {
      label: "YOUR ACCOUNT",
      items: [
        { id: "recycle-bin", label: "Recycle Bin", icon: Trash2, path: `${routes.settings}?tab=recycle` },
        { id: "account", label: "Account Center", icon: UserCircle, path: routes.profileEdit },
      ]
    }
  ];

  return (
    <div 
      className="settings-popup-overlay"
      onMouseLeave={onClose}
      style={{
        position: "fixed",
        left: isCollapsed ? "75px" : "245px",
        bottom: "80px",
        zIndex: 2000,
        padding: "10px",
        transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, x: -15 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.92, x: -10 }}
        transition={{ duration: 0.22 }}
        className="card settings-popup-card"
        style={{
          width: "300px",
          padding: "12px 0",
          borderRadius: "18px",
          boxShadow: "0 25px 60px -10px rgba(0,0,0,0.22), 0 0 1px 1px rgba(0,0,0,0.02)",
          border: "1px solid rgba(0,0,0,0.06)",
          background: "#ffffff"
        }}
      >
        <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "14px", 
              background: "linear-gradient(135deg, #1877f2, #0d5bb5)", 
              color: "#fff", 
              display: "grid", 
              placeItems: "center", 
              fontWeight: "700",
              fontSize: "1.25rem",
              boxShadow: "0 4px 12px rgba(24, 119, 242, 0.25)"
            }}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "V"}
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ 
                display: "block", 
                fontSize: "1.05rem", 
                color: "#0f172a", 
                whiteSpace: "nowrap", 
                overflow: "hidden", 
                textOverflow: "ellipsis" 
              }}>
                {user?.fullName || user?.username}
              </strong>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>@{user?.username}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px" }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: "12px" }}>
              <span style={{ 
                fontSize: "0.65rem", 
                fontWeight: "800", 
                color: "#94a3b8", 
                padding: "10px 16px 6px", 
                display: "block",
                letterSpacing: "0.1em"
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
                    color: "#334155",
                    borderRadius: "10px",
                    margin: "2px 4px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  className="settings-popup-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <item.icon size={18} className="item-icon" />
                    <span style={{ fontSize: "0.92rem", fontWeight: "600" }}>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="chevron" opacity={0.3} />
                </Link>
              ))}
            </div>
          ))}

          <div style={{ margin: "10px 12px", borderTop: "1px solid #f1f5f9" }} />
          
          <div style={{ padding: "4px 8px" }}>
            <button
              type="button"
              onClick={() => { navigate(routes.settings); onClose(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#475569",
                borderRadius: "10px",
                transition: "background 0.2s"
              }}
              className="settings-popup-secondary"
            >
              <HelpCircle size={18} />
              <span style={{ fontSize: "0.92rem", fontWeight: "600" }}>Help Center</span>
            </button>
            <button
              type="button"
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
                color: "#ef4444",
                borderRadius: "10px",
                transition: "all 0.2s"
              }}
              className="settings-popup-danger"
            >
              <LogOut size={18} />
              <span style={{ fontSize: "0.92rem", fontWeight: "700" }}>Log out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
