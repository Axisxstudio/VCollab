import { useEffect, useState } from "react";
import { X, Save, Loader2, User, Mail, Shield, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateAdminUser } from "../../services/admin.service";
import { roles } from "../../config/constants";

export default function AdminUserEditModal({ user, onClose, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    profileImage: "",
    password: "",
    role: roles.STUDENT,
    active: true,
    suspended: false
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        fullName: user.fullName || "",
        profileImage: user.profileImage || "",
        password: "",
        role: user.role || roles.STUDENT,
        active: user.active ?? true,
        suspended: user.suspended ?? false
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        profileImage: form.profileImage,
        role: form.role,
        active: form.active,
        suspended: form.suspended,
      };
      if (form.password) {
        payload.password = form.password;
      }
      await updateAdminUser(user.id, payload);
      toast.success("User profile updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update user");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="admin-detail-modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="admin-detail-modal"
        style={{ maxWidth: "550px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-edit-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="admin-detail-modal__header">
          <div>
            <div className="feed-badges">
              <span className="feed-badge">EDIT PROFILE</span>
            </div>
            <h2 id="admin-user-edit-title">Edit {user.username}</h2>
            <p className="admin-page-description">Update profile details, permissions, or password.</p>
          </div>
          <div className="admin-detail-modal__header-actions">
            <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="admin-detail-modal__body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}><User size={14} style={{ display: "inline", marginBottom: -2 }}/> Username</label>
            <input 
              type="text" 
              required 
              value={form.username} 
              onChange={(e) => setForm({...form, username: e.target.value})} 
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}><Mail size={14} style={{ display: "inline", marginBottom: -2 }}/> Email</label>
            <input 
              type="email" 
              required 
              value={form.email} 
              onChange={(e) => setForm({...form, email: e.target.value})} 
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Full Name</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={(e) => setForm({...form, fullName: e.target.value})} 
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}><ImageIcon size={14} style={{ display: "inline", marginBottom: -2 }}/> Profile Image URL</label>
            <input 
              type="url" 
              value={form.profileImage} 
              onChange={(e) => setForm({...form, profileImage: e.target.value})} 
              placeholder="https://..."
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}><Shield size={14} style={{ display: "inline", marginBottom: -2 }}/> Role</label>
            <select 
              value={form.role} 
              onChange={(e) => setForm({...form, role: e.target.value})}
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value={roles.STUDENT}>Student</option>
              <option value={roles.INDUSTRIAL_EXPERT}>Industrial Expert</option>
              <option value={roles.SOFTWARE_ENGINEER}>Software Engineer</option>
              {user.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
          </div>

          <div className="input-field-group" style={{ padding: "12px", border: "1px dashed #ef4444", borderRadius: "8px", backgroundColor: "#fef2f2", marginBottom: 0 }}>
            <label style={{ color: "#b91c1c", fontSize: "0.85rem", fontWeight: 600 }}>New Password (Leave blank to keep current)</label>
            <input 
              type="password" 
              minLength={6}
              value={form.password} 
              onChange={(e) => setForm({...form, password: e.target.value})} 
              placeholder="••••••••"
              className="admin-input-style"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #fca5a5", marginTop: "6px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "24px", marginTop: "8px", paddingBottom: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "var(--ink)" }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
              Active Account
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "var(--ink)" }}>
              <input type="checkbox" checked={form.suspended} onChange={(e) => setForm({...form, suspended: e.target.checked})} style={{ width: "18px", height: "18px", accentColor: "#ef4444" }} />
              Suspended
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <button type="button" className="btn-glass" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn-glow-primary" disabled={busy} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {busy ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
