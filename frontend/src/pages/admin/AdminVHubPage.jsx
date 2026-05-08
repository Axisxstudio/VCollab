import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { EyeOff, Lock, Loader2, MessageCircle, Save, Shield } from "lucide-react";
import { routes } from "../../config/routes";
import {
  getAdminVHubSettings,
  getAdminVHubSummary,
  hideAdminVHubThread,
  listAdminVHubThreads,
  lockAdminVHubThread,
  updateAdminVHubSettings
} from "../../services/vhub.service";
import "../../styles/vhub.css";

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
      <div className="live-status-badge">V Hub control center</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>V Hub social messaging</h1>
          <p className="admin-page-description">
            Control the public landing-page V Hub, review thread health, and moderate visitor conversations from one screen.
          </p>
        </div>
      </div>

      <section className="vhub-admin-summary-grid">
        <article className="vhub-admin-stat-card">
          <span>Feature mode</span>
          <strong>{summary?.mode || settingsForm.mode}</strong>
        </article>
        <article className="vhub-admin-stat-card">
          <span>Total threads</span>
          <strong>{summary?.threadCount ?? 0}</strong>
        </article>
        <article className="vhub-admin-stat-card">
          <span>Open threads</span>
          <strong>{summary?.openThreadCount ?? 0}</strong>
        </article>
        <article className="vhub-admin-stat-card">
          <span>Solved threads</span>
          <strong>{summary?.solvedThreadCount ?? 0}</strong>
        </article>
        <article className="vhub-admin-stat-card">
          <span>Total replies</span>
          <strong>{summary?.replyCount ?? 0}</strong>
        </article>
        <article className="vhub-admin-stat-card">
          <span>Hidden / locked</span>
          <strong>{summary?.hiddenThreadCount ?? 0} / {summary?.lockedThreadCount ?? 0}</strong>
        </article>
      </section>

      <section className="card vhub-admin-settings">
        <div className="vhub-panel-header vhub-panel-header--compact">
          <div>
            <span className="vhub-panel-eyebrow">Admin settings</span>
            <h2>Feature mode and limits</h2>
          </div>
        </div>

        <div className="vhub-admin-settings-grid">
          <label>
            <span>Feature mode</span>
            <select value={settingsForm.mode} onChange={(event) => setSettingsForm((current) => ({ ...current, mode: event.target.value }))}>
              {MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Max title length</span>
            <input
              type="number"
              min="20"
              value={settingsForm.maxTitleLength}
              onChange={(event) => setSettingsForm((current) => ({ ...current, maxTitleLength: Number(event.target.value) }))}
            />
          </label>

          <label>
            <span>Max body length</span>
            <input
              type="number"
              min="100"
              value={settingsForm.maxBodyLength}
              onChange={(event) => setSettingsForm((current) => ({ ...current, maxBodyLength: Number(event.target.value) }))}
            />
          </label>

          <label>
            <span>Rate limit per hour</span>
            <input
              type="number"
              min="1"
              value={settingsForm.rateLimitPerHour}
              onChange={(event) => setSettingsForm((current) => ({ ...current, rateLimitPerHour: Number(event.target.value) }))}
            />
          </label>

          <label className="vhub-checkbox">
            <input
              type="checkbox"
              checked={settingsForm.allowGuestView}
              onChange={(event) => setSettingsForm((current) => ({ ...current, allowGuestView: event.target.checked }))}
            />
            <span>Allow public visitor access</span>
          </label>

          <label className="vhub-checkbox">
            <input
              type="checkbox"
              checked={settingsForm.allowAttachments}
              onChange={(event) => setSettingsForm((current) => ({ ...current, allowAttachments: event.target.checked }))}
            />
            <span>Allow attachments</span>
          </label>
        </div>

        <button type="button" className="vhub-primary-btn" onClick={handleSaveSettings} disabled={busyAction === "save-settings"}>
          {busyAction === "save-settings" ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          Save V Hub settings
        </button>
      </section>

      <section className="card vhub-admin-settings">
        <div className="vhub-panel-header vhub-panel-header--compact">
          <div>
            <span className="vhub-panel-eyebrow">Moderation queue</span>
            <h2>Community threads</h2>
          </div>
        </div>

        <div className="vhub-admin-filters">
          <input
            type="text"
            placeholder="Search thread title, body, or author"
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="SOLVED">Solved</option>
          </select>
          <select value={filters.hidden} onChange={(event) => setFilters((current) => ({ ...current, hidden: event.target.value }))}>
            <option value="">All visibility</option>
            <option value="true">Hidden only</option>
            <option value="false">Visible only</option>
          </select>
          <select value={filters.locked} onChange={(event) => setFilters((current) => ({ ...current, locked: event.target.value }))}>
            <option value="">All lock states</option>
            <option value="true">Locked only</option>
            <option value="false">Unlocked only</option>
          </select>
        </div>

        {isLoading && (
          <div className="vhub-empty-state small">
            <Loader2 size={18} className="spin" />
            <p>Loading moderation threads...</p>
          </div>
        )}

        {!isLoading && threads.length === 0 && (
          <div className="vhub-empty-state small">
            <p>No V Hub threads match the current moderation filters.</p>
          </div>
        )}

        <div className="vhub-admin-thread-list">
          {threads.map((thread) => (
            <article key={thread.id} className="vhub-admin-thread-card">
              <div className="vhub-thread-card__meta">
                <span className="vhub-type-badge">{thread.threadType}</span>
                <span className={`vhub-status-pill ${thread.status === "SOLVED" ? "success" : "neutral"}`}>{thread.status}</span>
                {thread.hidden && <span className="vhub-status-pill warning"><Shield size={12} /> Hidden</span>}
                {thread.locked && <span className="vhub-status-pill neutral"><Lock size={12} /> Locked</span>}
              </div>
              <h3>{thread.title}</h3>
              <p>{thread.bodyPreview}</p>
              <div className="vhub-admin-thread-meta">
                <span>{getAuthorLabel(thread.author)}</span>
                <span>{thread.replyCount} replies</span>
                <span>{thread.participantCount} participants</span>
              </div>
              <div className="vhub-admin-thread-actions">
                <Link to={`${routes.vHub}?thread=${thread.id}`} className="vhub-secondary-btn">
                  <MessageCircle size={15} />
                  Open thread
                </Link>
                <button
                  type="button"
                  className="vhub-secondary-btn"
                  onClick={() => handleToggleLock(thread)}
                  disabled={busyAction === `lock-${thread.id}`}
                >
                  <Lock size={15} />
                  {thread.locked ? "Unlock" : "Lock"}
                </button>
                <button
                  type="button"
                  className="vhub-danger-btn"
                  onClick={() => handleToggleHidden(thread)}
                  disabled={busyAction === `hide-${thread.id}`}
                >
                  <EyeOff size={15} />
                  {thread.hidden ? "Unhide" : "Hide"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
