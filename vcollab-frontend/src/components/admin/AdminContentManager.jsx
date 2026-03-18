import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bookmark,
  CirclePlus,
  Eye,
  FileDown,
  Folder,
  Globe,
  Heart,
  LayoutGrid,
  Layers,
  List,
  Lock,
  MessageCircle,
  Pencil,
  Power,
  RotateCcw,
  Search,
  Share2,
  Tag,
  Trash2,
  TriangleAlert,
  User
} from "lucide-react";
import AdminContentDetailModal from "./AdminContentDetailModal";
import { listCategories } from "../../services/category.service";
import {
  createAdminWarning,
  downloadAdminPdfExport
} from "../../services/admin.service";
import { routes } from "../../config/routes";
import { formatDate } from "../../utils/discovery";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const VISIBILITY_OPTIONS = [
  { value: "", label: "All visibility" },
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" }
];

const ACTIVE_OPTIONS = [
  { value: "", label: "All states" },
  { value: "true", label: "Active only" },
  { value: "false", label: "Inactive only" }
];

const EDIT_PATHS = {
  PROJECT: routes.projectEdit,
  POST: routes.postEdit,
  BLOG: routes.blogEdit
};

const CREATE_PATHS = {
  PROJECT: routes.projectCreate,
  POST: routes.postCreate,
  BLOG: routes.blogCreate
};

const EXPORT_MODULES = {
  PROJECT: "projects",
  POST: "posts",
  BLOG: "blogs"
};

const CREATE_LABELS = {
  PROJECT: "Create Project",
  POST: "Create Post",
  BLOG: "Create Blog"
};

const PUBLIC_QUERY_KEYS = {
  PROJECT: "projects",
  POST: "posts",
  BLOG: "blogs"
};

const DETAIL_QUERY_KEYS = {
  PROJECT: "project",
  POST: "post",
  BLOG: "blog"
};

const PAGE_SIZE = 12;

function getInitials(name) {
  return (name || "V").trim().slice(0, 2).toUpperCase();
}

function getProfilePath(username) {
  return username ? routes.profile.replace(":username", username) : routes.home;
}

export default function AdminContentManager({
  title,
  description,
  contentType,
  queryKeyPrefix,
  listFn,
  updateFn,
  deleteFn,
  restoreFn,
  deletedMode = false
}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    owner: "",
    categoryId: "",
    visibility: "",
    active: ""
  });
  const [page, setPage] = useState(0);
  const [busyKey, setBusyKey] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") {
      return "grid";
    }
    return window.localStorage.getItem(`admin-content-view:${contentType}`) || "grid";
  });
  const [detailTarget, setDetailTarget] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null);
  const [warningForm, setWarningForm] = useState({
    title: "",
    message: "",
    reason: ""
  });
  const [warningFeedback, setWarningFeedback] = useState("");

  useFeedUpdates({
    queryKeys: [queryKeyPrefix, ["admin", "summary"]]
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`admin-content-view:${contentType}`, viewMode);
    }
  }, [contentType, viewMode]);

  const params = useMemo(() => {
    const next = {
      page,
      size: PAGE_SIZE,
      sort: "createdAt,desc",
      deleted: deletedMode
    };

    if (filters.search.trim()) next.search = filters.search.trim();
    if (filters.owner.trim()) next.owner = filters.owner.trim();
    if (filters.categoryId) next.categoryId = filters.categoryId;
    if (filters.visibility) next.visibility = filters.visibility;
    if (filters.active) next.active = filters.active;

    return next;
  }, [deletedMode, filters, page]);

  const queryKey = [
    ...queryKeyPrefix,
    deletedMode,
    filters.search,
    filters.owner,
    filters.categoryId,
    filters.visibility,
    filters.active,
    page
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listFn(params),
    refetchInterval: 15000
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", contentType],
    queryFn: () => listCategories(contentType)
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || items.length;
  const createRoute = CREATE_PATHS[contentType];

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const invalidateAfterChange = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
    await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    await queryClient.invalidateQueries({ queryKey: [PUBLIC_QUERY_KEYS[contentType]] });
    await queryClient.invalidateQueries({ queryKey: [DETAIL_QUERY_KEYS[contentType]] });
    await queryClient.invalidateQueries({ queryKey: ["admin-content-detail"] });
  };

  const handleToggleVisibility = async (item) => {
    const nextVisibility = item.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setBusyKey(`visibility-${item.id}`);
    try {
      await updateFn(item.id, { visibility: nextVisibility });
      await invalidateAfterChange();
    } finally {
      setBusyKey("");
    }
  };

  const handleToggleActive = async (item) => {
    setBusyKey(`active-${item.id}`);
    try {
      await updateFn(item.id, { active: !item.active });
      await invalidateAfterChange();
    } finally {
      setBusyKey("");
    }
  };

  const handleDelete = async (item) => {
    setBusyKey(`delete-${item.id}`);
    try {
      await deleteFn(item.id);
      await invalidateAfterChange();
    } finally {
      setBusyKey("");
    }
  };

  const handleRestore = async (item) => {
    setBusyKey(`restore-${item.id}`);
    try {
      await restoreFn(item.id);
      await invalidateAfterChange();
    } finally {
      setBusyKey("");
    }
  };

  const handleExportItem = async (item) => {
    setBusyKey(`export-${item.id}`);
    try {
      await downloadAdminPdfExport(deletedMode ? "recycle-bin" : EXPORT_MODULES[item.contentType], {
        id: item.id,
        contentType: deletedMode ? item.contentType : undefined
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleExportFiltered = async () => {
    setBusyKey("export-filtered");
    try {
      await downloadAdminPdfExport(deletedMode ? "recycle-bin" : EXPORT_MODULES[contentType], {
        ...params,
        contentType: deletedMode ? contentType : undefined
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleWarningSubmit = async () => {
    if (!warningTarget) return;
    setBusyKey(`warning-${warningTarget.id}`);
    setWarningFeedback("");

    try {
      await createAdminWarning({
        targetUserId: warningTarget.ownerId,
        title: warningForm.title,
        message: warningForm.message,
        reason: warningForm.reason || undefined,
        contentType: warningTarget.contentType,
        contentId: warningTarget.id
      });
      setWarningFeedback("Warning sent successfully.");
      setWarningForm({ title: "", message: "", reason: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "warnings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } catch (error) {
      setWarningFeedback(error?.response?.data?.message || "Unable to send warning.");
    } finally {
      setBusyKey("");
    }
  };

  const getEditPath = (item) => {
    const pattern = EDIT_PATHS[item.contentType] || routes.home;
    return pattern.replace(":id", item.id);
  };

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Live content administration</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>{title}</h1>
          <p className="admin-page-description">{description}</p>
        </div>
        <div className="header-btn-group">
          <div className="admin-view-toggle" aria-label="Choose view mode">
            <button
              type="button"
              className={`admin-view-toggle__button ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`admin-view-toggle__button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
          <button type="button" className="btn-glass" onClick={handleExportFiltered} disabled={busyKey === "export-filtered"}>
            <FileDown size={16} />
            {busyKey === "export-filtered" ? "Preparing PDF..." : "Export Filtered PDF"}
          </button>
          {!deletedMode && (
            <Link to={createRoute} className="btn-glow-danger admin-primary-link">
              <CirclePlus size={16} />
              {CREATE_LABELS[contentType]}
            </Link>
          )}
        </div>
      </div>

      <section className="card admin-filter-panel">
        <div className="admin-filter-grid">
          <div style={{ position: "relative", gridColumn: "span 2" }}>
            <Search className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <input
              type="text"
              className="admin-search-input"
              style={{ paddingLeft: "40px" }}
              value={filters.search}
              placeholder="Search by title, caption, or keywords"
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <User className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <input
              type="text"
              className="admin-search-input"
              style={{ paddingLeft: "40px" }}
              value={filters.owner}
              placeholder="Filter by creator username"
              onChange={(event) => handleFilterChange("owner", event.target.value)}
            />
          </div>
          <select value={filters.categoryId} onChange={(event) => handleFilterChange("categoryId", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select value={filters.visibility} onChange={(event) => handleFilterChange("visibility", event.target.value)}>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={filters.active} onChange={(event) => handleFilterChange("active", event.target.value)}>
            {ACTIVE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {warningTarget && (
        <section className="card admin-warning-panel">
          <div className="project-actions admin-warning-panel__header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="card-icon-box warning">
                <TriangleAlert size={22} />
              </div>
              <div>
                <h3>Send warning to @{warningTarget.ownerUsername}</h3>
                <p className="profile-meta">
                  This warning will reference {warningTarget.contentType.toLowerCase()} #{warningTarget.id}.
                </p>
              </div>
            </div>
            <button type="button" className="btn-glass" onClick={() => setWarningTarget(null)}>
              Close
            </button>
          </div>

          <div className="admin-warning-form" style={{ marginTop: "24px" }}>
            <input
              type="text"
              value={warningForm.title}
              placeholder="Warning title"
              onChange={(event) => setWarningForm((previous) => ({ ...previous, title: event.target.value }))}
            />
            <textarea
              rows="4"
              value={warningForm.message}
              placeholder="Describe the issue clearly for the creator"
              onChange={(event) => setWarningForm((previous) => ({ ...previous, message: event.target.value }))}
            />
            <input
              type="text"
              value={warningForm.reason}
              placeholder="Reason or policy reference"
              onChange={(event) => setWarningForm((previous) => ({ ...previous, reason: event.target.value }))}
            />
            <div className="admin-warning-panel__actions">
              <button
                type="button"
                className="btn-glow-danger"
                onClick={handleWarningSubmit}
                disabled={busyKey === `warning-${warningTarget.id}`}
              >
                {busyKey === `warning-${warningTarget.id}` ? "Sending warning..." : "Send Warning"}
              </button>
              {warningFeedback && <span className="trend-meta admin-feedback-text">{warningFeedback}</span>}
            </div>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <Layers className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Loading live content records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <TriangleAlert className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>We could not load this content set right now.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="summary-card-pro admin-state-card">
          <Folder className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>No records match the selected filters.</p>
        </div>
      ) : (
        <section className={`admin-entity-grid admin-content-grid-pro admin-content-grid-pro--${viewMode}`}>
          {items.map((item) => (
            <article
              key={`${item.contentType}-${item.id}`}
              className={`card admin-content-record-card admin-content-record-card--${viewMode}`}
            >
              {item.thumbnailUrl ? (
                <div className="admin-content-record-card__media">
                  <img src={item.thumbnailUrl} alt={item.title} />
                </div>
              ) : (
                <div className="admin-content-record-card__placeholder">
                  <Folder size={28} />
                  <span>{item.contentType}</span>
                </div>
              )}

              <div className="admin-content-record-card__body">
                <div className="admin-content-record-card__header">
                  <div>
                    <div className="admin-content-record-card__title-row">
                      <h4>{item.title}</h4>
                      <span className="feed-badge">{item.contentType}</span>
                    </div>
                    <Link to={getProfilePath(item.ownerUsername)} className="admin-owner-link">
                      <div className="admin-owner-link__avatar">
                        {item.ownerProfileImage ? (
                          <img src={item.ownerProfileImage} alt={item.ownerFullName || item.ownerUsername} />
                        ) : (
                          getInitials(item.ownerFullName || item.ownerUsername)
                        )}
                      </div>
                      <div>
                        <strong>{item.ownerFullName || item.ownerUsername || "Unknown user"}</strong>
                        <span>@{item.ownerUsername || "unknown"}</span>
                      </div>
                    </Link>
                  </div>
                </div>

                <p className="admin-content-record-card__excerpt">
                  {item.excerpt || "No content preview available for this record."}
                </p>

                <div className="admin-content-record-card__meta">
                  <span className="status-pill">Created {formatDate(item.createdAt)}</span>
                  <span className="status-pill">Updated {formatDate(item.updatedAt || item.createdAt)}</span>
                  {item.subtype && <span className="status-pill">{item.subtype}</span>}
                  {item.categoryName && <span className="status-pill">{item.categoryName}</span>}
                </div>

                <div className="admin-content-record-card__tags">
                  {item.categoryName && (
                    <span className="status-pill admin-tag-pill">
                      <Folder size={12} />
                      {item.categoryName}
                    </span>
                  )}
                  {item.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="status-pill admin-tag-pill">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="admin-content-record-card__stats">
                  <div>
                    <Heart size={14} />
                    <span>{item.likeCount || 0}</span>
                  </div>
                  <div>
                    <MessageCircle size={14} />
                    <span>{item.commentCount || 0}</span>
                  </div>
                  <div>
                    <Bookmark size={14} />
                    <span>{item.saveCount || 0}</span>
                  </div>
                  <div>
                    <Share2 size={14} />
                    <span>{item.shareCount || 0}</span>
                  </div>
                </div>

                <div className="admin-content-record-card__status-row">
                  <span className={`status-pill ${item.active ? "status-active" : "status-inactive"}`}>
                    <Power size={12} />
                    {item.active ? "Active" : "Inactive"}
                  </span>
                  <span className="status-pill">
                    {item.visibility === "PUBLIC" ? <Globe size={12} /> : <Lock size={12} />}
                    {item.visibility}
                  </span>
                </div>

                <div className="admin-card-toolbar">
                  {!deletedMode && (
                    <>
                      <button
                        type="button"
                        className="btn-glass admin-action-button admin-action-button--view"
                        onClick={() => setDetailTarget(item)}
                      >
                        <Eye size={16} />
                        View details
                      </button>
                      <Link
                        to={getEditPath(item)}
                        className="admin-icon-btn"
                        title="Edit content"
                        aria-label="Edit content"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => setWarningTarget(item)}
                        title="Send warning"
                        aria-label="Send warning"
                      >
                        <TriangleAlert size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => handleExportItem(item)}
                        disabled={busyKey === `export-${item.id}`}
                        title="Export PDF"
                        aria-label="Export PDF"
                      >
                        {busyKey === `export-${item.id}` ? <RotateCcw size={16} className="spin" /> : <FileDown size={16} />}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => handleToggleVisibility(item)}
                        disabled={busyKey === `visibility-${item.id}`}
                        title={item.visibility === "PUBLIC" ? "Make private" : "Publish publicly"}
                        aria-label={item.visibility === "PUBLIC" ? "Make private" : "Publish publicly"}
                      >
                        {busyKey === `visibility-${item.id}` ? (
                          <RotateCcw size={16} className="spin" />
                        ) : item.visibility === "PUBLIC" ? (
                          <Lock size={16} />
                        ) : (
                          <Globe size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => handleToggleActive(item)}
                        disabled={busyKey === `active-${item.id}`}
                        title={item.active ? "Disable content" : "Enable content"}
                        aria-label={item.active ? "Disable content" : "Enable content"}
                      >
                        {busyKey === `active-${item.id}` ? <RotateCcw size={16} className="spin" /> : <Power size={16} />}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--danger"
                        onClick={() => handleDelete(item)}
                        disabled={busyKey === `delete-${item.id}`}
                        title="Move to recycle bin"
                        aria-label="Move to recycle bin"
                      >
                        {busyKey === `delete-${item.id}` ? <RotateCcw size={16} className="spin" /> : <Trash2 size={16} />}
                      </button>
                    </>
                  )}

                  {deletedMode && (
                    <>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--primary"
                        onClick={() => handleRestore(item)}
                        disabled={busyKey === `restore-${item.id}`}
                        title="Restore content"
                        aria-label="Restore content"
                      >
                        {busyKey === `restore-${item.id}` ? <RotateCcw size={16} className="spin" /> : <RotateCcw size={16} />}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => handleExportItem(item)}
                        disabled={busyKey === `export-${item.id}`}
                        title="Export PDF"
                        aria-label="Export PDF"
                      >
                        {busyKey === `export-${item.id}` ? <RotateCcw size={16} className="spin" /> : <FileDown size={16} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="stream-meta-label">
            Page {page + 1} of {totalPages} · {totalElements} records
          </span>
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {detailTarget && <AdminContentDetailModal item={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}
