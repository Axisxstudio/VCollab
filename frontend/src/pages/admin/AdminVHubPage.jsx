import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { 
  EyeOff, Lock, Loader2, MessageCircle, Save, Shield, 
  Settings, Layers, CheckCircle, MessageSquare, Filter, Search, User 
} from "lucide-react";
import { routes } from "../../config/routes";
import {
  getAdminVHubSettings,
  getAdminVHubSummary,
  hideAdminVHubThread,
  listAdminVHubThreads,
  lockAdminVHubThread,
  updateAdminVHubSettings
} from "../../services/vhub.service";
import "../../styles/vhub.css"; // Optional, we are relying more on app-shell.css for admin styles now

const MODES = ["DISABLED", "READ_ONLY", "ENABLED"];

function getAuthorLabel(author) {
  if (!author) return "Visitor";
  return author.displayName || author.fullName || author.username || "Visitor";
}

export default function AdminVHubPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: "", status: "", hidden: "", locked: "" });
  const [settingsForm, setSettingsForm] = useState({
    mode: "ENABLED",
    allowGuestView: false,
    allowAttachments: false,
    maxTitleLength: 180,
    maxBodyLength: 5000,
    rateLimitPerHour: 10
  });
  const [busyAction, setBusyAction] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["admin", "v-hub", "settings"],
    queryFn: getAdminVHubSettings
  });

  const { data: summary } = useQuery({
    queryKey: ["admin", "v-hub", "summary"],
    queryFn: getAdminVHubSummary,
    refetchInterval: 15000
  });

  const params = useMemo(() => {
    const next = { page: 0, size: 20, sort: "lastActivityAt,desc" };
    if (filters.q.trim()) next.q = filters.q.trim();
    if (filters.status) next.status = filters.status;
    if (filters.hidden) next.hidden = filters.hidden;
    if (filters.locked) next.locked = filters.locked;
    return next;
  }, [filters]);

  const { data: threadPage, isLoading } = useQuery({
    queryKey: ["admin", "v-hub", "threads", params.q || "", params.status || "", params.hidden || "", params.locked || ""],
    queryFn: () => listAdminVHubThreads(params),
    refetchInterval: 15000
  });

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      mode: settings.mode,
      allowGuestView: settings.allowGuestView,
      allowAttachments: settings.allowAttachments,
      maxTitleLength: settings.maxTitleLength,
      maxBodyLength: settings.maxBodyLength,
      rateLimitPerHour: settings.rateLimitPerHour
    });
  }, [settings]);

  const threads = threadPage?.content || [];

  const handleSaveSettings = async () => {
    setBusyAction("save-settings");
    try {
      await updateAdminVHubSettings(settingsForm);
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "settings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "settings"] });
      toast.success("V Hub settings updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update V Hub settings.");
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleLock = async (thread) => {
    setBusyAction(`lock-${thread.id}`);
    try {
      await lockAdminVHubThread(thread.id, {
        value: !thread.locked,
        note: thread.locked ? "Unlocked from admin panel" : "Locked from admin panel"
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "threads"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "summary"] });
      toast.success(`Thread ${thread.locked ? "unlocked" : "locked"}.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update lock state.");
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleHidden = async (thread) => {
    setBusyAction(`hide-${thread.id}`);
    try {
      await hideAdminVHubThread(thread.id, {
        value: !thread.hidden,
        note: thread.hidden ? "Restored from admin panel" : "Hidden from admin panel"
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "threads"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "summary"] });
      toast.success(`Thread ${thread.hidden ? "restored" : "hidden"}.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update visibility.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="admin-pro-stack admin-page-stack">

      {/* Summary Cards */}
      <section className="admin-summary-grid">
        <div className="summary-card-pro summary-card-pro--primary">
          <div className="card-icon-box"><Settings size={22} /></div>
          <div className="card-data-col">
            <span className="trend-meta">Feature Mode</span>
            <h3>{summary?.mode || settingsForm.mode}</h3>
          </div>
        </div>
        <div className="summary-card-pro summary-card-pro--secondary">
          <div className="card-icon-box"><Layers size={22} /></div>
          <div className="card-data-col">
            <span className="trend-meta">Total Threads</span>
            <h3>{summary?.threadCount ?? 0}</h3>
          </div>
        </div>
        <div className="summary-card-pro summary-card-pro--accent">
          <div className="card-icon-box"><CheckCircle size={22} /></div>
          <div className="card-data-col">
            <span className="trend-meta">Solved Threads</span>
            <h3>{summary?.solvedThreadCount ?? 0}</h3>
          </div>
        </div>
        <div className="summary-card-pro summary-card-pro--warning">
          <div className="card-icon-box"><Shield size={22} /></div>
          <div className="card-data-col">
            <span className="trend-meta">Hidden / Locked</span>
            <h3>{summary?.hiddenThreadCount ?? 0} / {summary?.lockedThreadCount ?? 0}</h3>
          </div>
        </div>
      </section>

      {/* Configuration Settings */}
      <section className="card admin-filter-panel" style={{ padding: "24px" }}>
        <div className="project-actions" style={{ marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>VHub Configuration</h2>
            <p className="profile-meta" style={{ marginTop: "4px" }}>Manage feature access and rate limits</p>
          </div>
          <button 
            type="button" 
            className="btn-glow-primary" 
            onClick={handleSaveSettings} 
            disabled={busyAction === "save-settings"}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {busyAction === "save-settings" ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Save Settings
          </button>
        </div>

        <div className="admin-filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Feature mode</label>
            <select value={settingsForm.mode} onChange={(e) => setSettingsForm((cur) => ({ ...cur, mode: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              {MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Max title length</label>
            <input type="number" min="20" value={settingsForm.maxTitleLength} onChange={(e) => setSettingsForm((cur) => ({ ...cur, maxTitleLength: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Max body length</label>
            <input type="number" min="100" value={settingsForm.maxBodyLength} onChange={(e) => setSettingsForm((cur) => ({ ...cur, maxBodyLength: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
          </div>

          <div className="input-field-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Rate limit (per hr)</label>
            <input type="number" min="1" value={settingsForm.rateLimitPerHour} onChange={(e) => setSettingsForm((cur) => ({ ...cur, rateLimitPerHour: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "var(--ink)" }}>
            <input type="checkbox" checked={settingsForm.allowGuestView} onChange={(e) => setSettingsForm((cur) => ({ ...cur, allowGuestView: e.target.checked }))} style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
            Allow public visitor access
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "var(--ink)" }}>
            <input type="checkbox" checked={settingsForm.allowAttachments} onChange={(e) => setSettingsForm((cur) => ({ ...cur, allowAttachments: e.target.checked }))} style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
            Allow attachments
          </label>
        </div>
      </section>

      {/* Moderation Queue Filters */}
      <section className="card admin-filter-panel">
        <div style={{ padding: "0 0 16px 0" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Moderation Queue</h2>
        </div>
        <div className="admin-filter-grid">
          <div style={{ position: "relative" }}>
            <Search className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <input type="text" placeholder="Search threads..." value={filters.q} onChange={(e) => setFilters((cur) => ({ ...cur, q: e.target.value }))} style={{ paddingLeft: "40px", width: "100%" }} />
          </div>
          <div style={{ position: "relative" }}>
            <Filter className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={filters.status} onChange={(e) => setFilters((cur) => ({ ...cur, status: e.target.value }))} style={{ paddingLeft: "40px", width: "100%" }}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="SOLVED">Solved</option>
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <EyeOff className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={filters.hidden} onChange={(e) => setFilters((cur) => ({ ...cur, hidden: e.target.value }))} style={{ paddingLeft: "40px", width: "100%" }}>
              <option value="">All visibility</option>
              <option value="true">Hidden only</option>
              <option value="false">Visible only</option>
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <Lock className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={filters.locked} onChange={(e) => setFilters((cur) => ({ ...cur, locked: e.target.value }))} style={{ paddingLeft: "40px", width: "100%" }}>
              <option value="">All lock states</option>
              <option value="true">Locked only</option>
              <option value="false">Unlocked only</option>
            </select>
          </div>
        </div>
      </section>

      {/* Threads Table */}
      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <Loader2 className="stream-icon-glow spin" style={{ marginBottom: "20px" }} />
          <p>Loading moderation queue...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thread</th>
                <th>Author</th>
                <th>Status</th>
                <th>Meta</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-table-empty">
                      <CheckCircle size={36} />
                      No threads match the current filters.
                    </div>
                  </td>
                </tr>
              ) : (
                threads.map((thread) => (
                  <tr key={thread.id}>
                    {/* Thread Info */}
                    <td style={{ minWidth: 260 }}>
                      <div className="admin-table-title">{thread.title}</div>
                      <div className="admin-table-sub" style={{ maxWidth: 300, whiteSpace: "normal", marginTop: 4 }}>
                        {thread.bodyPreview}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: "6px" }}>
                        <span className="admin-table-mono" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>{thread.threadType}</span>
                        {thread.hidden && <span className="admin-table-badge admin-table-badge--danger" style={{ padding: "2px 6px", fontSize: "0.65rem" }}><Shield size={10}/> Hidden</span>}
                        {thread.locked && <span className="admin-table-badge admin-table-badge--warning" style={{ padding: "2px 6px", fontSize: "0.65rem" }}><Lock size={10}/> Locked</span>}
                      </div>
                    </td>

                    {/* Author */}
                    <td style={{ fontSize: "0.82rem", color: "#6b7f95", minWidth: 140 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <User size={13} />
                        {getAuthorLabel(thread.author)}
                      </span>
                      {thread.author?.username && <div style={{ marginTop: 2, marginLeft: 18, fontSize: "0.75rem" }}>@{thread.author.username}</div>}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`admin-table-badge admin-table-badge--${thread.status === "SOLVED" ? "success" : "primary"}`}>
                        {thread.status}
                      </span>
                    </td>

                    {/* Meta */}
                    <td style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 120 }}>
                      <div><MessageSquare size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/> {thread.replyCount} replies</div>
                      <div style={{ marginTop: 4 }}><User size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/> {thread.participantCount} users</div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-table-actions">
                        <Link to={`${routes.vHub}?thread=${thread.id}`} className="admin-icon-btn" title="View thread" aria-label="View">
                          <MessageCircle size={15} />
                        </Link>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => handleToggleLock(thread)}
                          disabled={busyAction === `lock-${thread.id}`}
                          title={thread.locked ? "Unlock thread" : "Lock thread"}
                          aria-label="Toggle lock"
                        >
                          {busyAction === `lock-${thread.id}` ? <Loader2 size={15} className="spin" /> : <Lock size={15} color={thread.locked ? "#f59e0b" : undefined} />}
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => handleToggleHidden(thread)}
                          disabled={busyAction === `hide-${thread.id}`}
                          title={thread.hidden ? "Unhide thread" : "Hide thread"}
                          aria-label="Toggle hidden"
                        >
                          {busyAction === `hide-${thread.id}` ? <Loader2 size={15} className="spin" /> : <EyeOff size={15} color={thread.hidden ? "#ef4444" : undefined} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
