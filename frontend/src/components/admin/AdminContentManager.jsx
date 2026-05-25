import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CirclePlus,
  Eye,
  FileDown,
  Filter,
  Folder,
  Globe,
  Heart,
  Layers,
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
import { createAdminWarning, downloadAdminPdfExport } from "../../services/admin.service";
import { routes } from "../../config/routes";
import { formatDate } from "../../utils/discovery";
import useFeedUpdates from "../../websocket/useFeedUpdates";
import "../../styles/admin-table.css";

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

const PAGE_SIZE = 15;

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
  const [detailTarget, setDetailTarget] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null);
  const [warningForm, setWarningForm] = useState({ title: "", message: "", reason: "" });
  const [warningFeedback, setWarningFeedback] = useState("");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  useFeedUpdates({ queryKeys: [queryKeyPrefix, ["admin", "summary"]] });

  const params = useMemo(() => {
    const next = { page, size: PAGE_SIZE, sort: "NEWEST", deleted: deletedMode };
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
    setFilters((previous) => ({ ...previous, [field]: value }));
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
      await downloadAdminPdfExport(
        deletedMode ? "recycle-bin" : EXPORT_MODULES[item.contentType],
        { id: item.id, contentType: deletedMode ? item.contentType : undefined }
      );
    } finally {
      setBusyKey("");
    }
  };

  const handleExportFiltered = async () => {
    setBusyKey("export-filtered");
    try {
      await downloadAdminPdfExport(
        deletedMode ? "recycle-bin" : EXPORT_MODULES[contentType],
        { ...params, contentType: deletedMode ? contentType : undefined }
      );
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
      <div className="command-center-header admin-page-heading" style={{ justifyContent: "flex-end" }}>
        <div className="header-btn-group">
          <button 
            type="button" 
            className={`btn-glass ${isFiltersVisible ? "active" : ""}`}
            onClick={() => setIsFiltersVisible(prev => !prev)}
            title="Toggle filters"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <button type="button" className="btn-glass" onClick={handleExportFiltered} disabled={busyKey === "export-filtered"}>
            <FileDown size={16} />
            <span>{busyKey === "export-filtered" ? "Preparing PDF..." : "Export PDF"}</span>
          </button>
          {!deletedMode && (
            <Link to={createRoute} className="btn-glow-danger admin-primary-link">
              <CirclePlus size={16} />
              <span>{CREATE_LABELS[contentType]}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      {isFiltersVisible && (
        <section className="card admin-filter-panel">
        <div className="admin-filter-grid" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr" }}>
          <div style={{ position: "relative" }}>
            <Search className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <input
              type="text"
              className="admin-search-input"
              style={{ paddingLeft: "40px" }}
              value={filters.search}
              placeholder="Search by title, caption, keywords, or creator username"
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <select value={filters.categoryId} onChange={(event) => handleFilterChange("categoryId", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={filters.visibility} onChange={(event) => handleFilterChange("visibility", event.target.value)}>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={filters.active} onChange={(event) => handleFilterChange("active", event.target.value)}>
            {ACTIVE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </section>
      )}

      {/* Warning panel */}
      {warningTarget && (
        <section className="card admin-warning-panel">
          <div className="project-actions admin-warning-panel__header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="card-icon-box warning"><TriangleAlert size={22} /></div>
              <div>
                <h3>Send warning to @{warningTarget.ownerUsername}</h3>
                <p className="profile-meta">This warning will reference {warningTarget.contentType.toLowerCase()} #{warningTarget.id}.</p>
              </div>
            </div>
            <button type="button" className="btn-glass" onClick={() => setWarningTarget(null)}>Close</button>
          </div>
          <div className="admin-warning-form" style={{ marginTop: "24px" }}>
            <input type="text" value={warningForm.title} placeholder="Warning title" onChange={(event) => setWarningForm((previous) => ({ ...previous, title: event.target.value }))} />
            <textarea rows="4" value={warningForm.message} placeholder="Describe the issue clearly for the creator" onChange={(event) => setWarningForm((previous) => ({ ...previous, message: event.target.value }))} />
            <input type="text" value={warningForm.reason} placeholder="Reason or policy reference" onChange={(event) => setWarningForm((previous) => ({ ...previous, reason: event.target.value }))} />
            <div className="admin-warning-panel__actions">
              <button type="button" className="btn-glow-danger" onClick={handleWarningSubmit} disabled={busyKey === `warning-${warningTarget.id}`}>
                {busyKey === `warning-${warningTarget.id}` ? "Sending warning..." : "Send Warning"}
              </button>
              {warningFeedback && <span className="trend-meta admin-feedback-text">{warningFeedback}</span>}
            </div>
          </div>
        </section>
      )}

      {/* Table */}
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
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Title</th>
                <th>Type</th>
                <th>Visibility</th>
                <th>Status</th>
                <th>Engagement</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="admin-table-empty">
                      <Folder size={36} />
                      No records match the selected filters.
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={`${item.contentType}-${item.id}`}>
                    {/* Owner */}
                    <td>
                      <Link to={getProfilePath(item.ownerUsername)} className="admin-table-avatar" style={{ textDecoration: "none" }}>
                        <div className="admin-table-avatar__img">
                          {item.ownerProfileImage
                            ? <img src={item.ownerProfileImage} alt={item.ownerFullName || item.ownerUsername} />
                            : getInitials(item.ownerFullName || item.ownerUsername)}
                        </div>
                        <div className="admin-table-avatar__copy">
                          <strong>{item.ownerFullName || item.ownerUsername || "Unknown"}</strong>
                          <span>@{item.ownerUsername || "unknown"}</span>
                        </div>
                      </Link>
                    </td>

                    {/* Title */}
                    <td style={{ minWidth: 200 }}>
                      <div className="admin-table-title">{item.title}</div>
                    </td>

                    {/* Type */}
                    <td><span className="admin-table-badge">{item.contentType}</span></td>

                    {/* Visibility */}
                    <td>
                      <span className={`status-pill ${item.visibility === "PUBLIC" ? "status-active" : ""}`}>
                        {item.visibility === "PUBLIC" ? <Globe size={11} /> : <Lock size={11} />}
                        {item.visibility}
                      </span>
                    </td>

                    {/* Active status */}
                    <td>
                      <span className={`status-pill ${item.active ? "status-active" : "status-inactive"}`}>
                        <Power size={11} />
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Engagement */}
                    <td>
                      <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem", color: "#6b7f95" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Heart size={12} />{item.likeCount || 0}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MessageCircle size={12} />{item.commentCount || 0}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Bookmark size={12} />{item.saveCount || 0}</span>
                      </div>
                    </td>

                    {/* Created */}
                    <td style={{ whiteSpace: "nowrap", color: "#788fa5", fontSize: "0.78rem" }}>
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Updated */}
                    <td style={{ whiteSpace: "nowrap", color: "#788fa5", fontSize: "0.78rem" }}>
                      {formatDate(item.updatedAt || item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-table-actions">
                        {!deletedMode && (
                          <>
                            <button type="button" className="admin-icon-btn" onClick={() => setDetailTarget(item)} title="View details" aria-label="View details">
                              <Eye size={15} />
                            </button>
                            <Link to={getEditPath(item)} className="admin-icon-btn" title="Edit" aria-label="Edit">
                              <Pencil size={15} />
                            </Link>
                            <button type="button" className="admin-icon-btn" onClick={() => setWarningTarget(item)} title="Send warning" aria-label="Send warning">
                              <TriangleAlert size={15} />
                            </button>
                            <button type="button" className="admin-icon-btn" onClick={() => handleExportItem(item)} disabled={busyKey === `export-${item.id}`} title="Export PDF" aria-label="Export PDF">
                              {busyKey === `export-${item.id}` ? <RotateCcw size={15} className="spin" /> : <FileDown size={15} />}
                            </button>
                            <button type="button" className="admin-icon-btn" onClick={() => handleToggleVisibility(item)} disabled={busyKey === `visibility-${item.id}`} title={item.visibility === "PUBLIC" ? "Make private" : "Publish"} aria-label="Toggle visibility">
                              {busyKey === `visibility-${item.id}` ? <RotateCcw size={15} className="spin" /> : item.visibility === "PUBLIC" ? <Lock size={15} /> : <Globe size={15} />}
                            </button>
                            <button type="button" className="admin-icon-btn" onClick={() => handleToggleActive(item)} disabled={busyKey === `active-${item.id}`} title={item.active ? "Disable" : "Enable"} aria-label="Toggle active">
                              {busyKey === `active-${item.id}` ? <RotateCcw size={15} className="spin" /> : <Power size={15} />}
                            </button>
                            <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDelete(item)} disabled={busyKey === `delete-${item.id}`} title="Move to recycle bin" aria-label="Delete">
                              {busyKey === `delete-${item.id}` ? <RotateCcw size={15} className="spin" /> : <Trash2 size={15} />}
                            </button>
                          </>
                        )}
                        {deletedMode && (
                          <>
                            <button type="button" className="admin-icon-btn admin-icon-btn--primary" onClick={() => handleRestore(item)} disabled={busyKey === `restore-${item.id}`} title="Restore" aria-label="Restore">
                              {busyKey === `restore-${item.id}` ? <RotateCcw size={15} className="spin" /> : <RotateCcw size={15} />}
                            </button>
                            <button type="button" className="admin-icon-btn" onClick={() => handleExportItem(item)} disabled={busyKey === `export-${item.id}`} title="Export PDF" aria-label="Export PDF">
                              {busyKey === `export-${item.id}` ? <RotateCcw size={15} className="spin" /> : <FileDown size={15} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-table-pagination">
              <span className="admin-table-pagination__meta">
                Page {page + 1} of {totalPages} · {totalElements} records
              </span>
              <div className="admin-table-pagination__btns">
                <button type="button" className="admin-table-pagination__btn" onClick={() => setPage((c) => Math.max(c - 1, 0))} disabled={page === 0}>
                  <ArrowLeft size={14} /> Previous
                </button>
                <button type="button" className="admin-table-pagination__btn" onClick={() => setPage((c) => c + 1)} disabled={page + 1 >= totalPages}>
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailTarget && <AdminContentDetailModal item={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}
