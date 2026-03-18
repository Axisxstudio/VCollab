import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  BookOpenText,
  Briefcase,
  Calendar,
  Eye,
  ExternalLink,
  FileDown,
  Mail,
  NotebookTabs,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  User,
  UserPlus,
  Users as UsersIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { roles } from "../../config/constants";
import { routes } from "../../config/routes";
import {
  createAdminWarning,
  deleteAdminUser,
  downloadAdminPdfExport,
  listAdminUsers,
  updateAdminUserStatus
} from "../../services/admin.service";
import { register as createUserAccount } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { formatDate, formatRole } from "../../utils/discovery";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: roles.STUDENT, label: "Student" },
  { value: roles.INDUSTRIAL_EXPERT, label: "Industrial Expert" },
  { value: roles.SOFTWARE_ENGINEER, label: "Software Engineer" }
];

const STATUS_OPTIONS = [
  { value: "", label: "All account states" },
  { value: "true", label: "Active only" },
  { value: "false", label: "Inactive only" }
];

const SUSPENSION_OPTIONS = [
  { value: "", label: "All suspension states" },
  { value: "true", label: "Suspended only" },
  { value: "false", label: "Not suspended" }
];

const CONTENT_TYPES = [
  { value: "", label: "No related content" },
  { value: "PROJECT", label: "Project" },
  { value: "POST", label: "Post" },
  { value: "BLOG", label: "Blog" }
];

const PAGE_SIZE = 12;

function getInitials(name) {
  return (name || "V").trim().slice(0, 2).toUpperCase();
}

function getProfilePath(username) {
  return routes.profile.replace(":username", username || "");
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    active: "",
    suspended: ""
  });
  const [page, setPage] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [detailUser, setDetailUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFeedback, setCreateFeedback] = useState("");
  const [createForm, setCreateForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: roles.STUDENT
  });
  const [warningForm, setWarningForm] = useState({
    title: "",
    message: "",
    reason: "",
    contentType: "",
    contentId: ""
  });
  const [warningFeedback, setWarningFeedback] = useState("");

  const params = useMemo(() => {
    const next = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
    if (filters.search.trim()) next.search = filters.search.trim();
    if (filters.role) next.role = filters.role;
    if (filters.active) next.active = filters.active;
    if (filters.suspended) next.suspended = filters.suspended;
    return next;
  }, [filters, page]);

  const queryKey = [
    "admin",
    "users",
    params.search || "",
    params.role || "",
    params.active || "",
    params.suspended || "",
    page
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listAdminUsers(params),
    refetchInterval: 15000
  });

  const users = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || users.length;

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleStatusUpdate = async (userId, payload, busyKey) => {
    setBusyAction(busyKey);
    try {
      await updateAdminUserStatus(userId, payload);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete @${user.username}? This removes the account from the active platform view.`);
    if (!confirmed) {
      return;
    }

    setBusyAction(`delete-${user.id}`);
    try {
      await deleteAdminUser(user.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyAction("");
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.fullName || !createForm.username || !createForm.email || !createForm.password) {
      setCreateFeedback("Please complete all user account fields.");
      return;
    }

    setBusyAction("create-user");
    setCreateFeedback("");

    try {
      await createUserAccount(createForm);
      setCreateFeedback("User account created successfully.");
      setCreateForm({
        fullName: "",
        username: "",
        email: "",
        password: "",
        role: roles.STUDENT
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } catch (error) {
      setCreateFeedback(error?.response?.data?.message || "Unable to create the user account.");
    } finally {
      setBusyAction("");
    }
  };

  const handleWarningSubmit = async () => {
    if (!selectedUser) return;
    setBusyAction(`warn-${selectedUser.id}`);
    setWarningFeedback("");

    try {
      await createAdminWarning({
        targetUserId: selectedUser.id,
        title: warningForm.title,
        message: warningForm.message,
        reason: warningForm.reason || undefined,
        contentType: warningForm.contentType || undefined,
        contentId: warningForm.contentId ? Number(warningForm.contentId) : undefined
      });
      setWarningFeedback("Warning sent successfully.");
      setWarningForm({
        title: "",
        message: "",
        reason: "",
        contentType: "",
        contentId: ""
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "warnings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } catch (error) {
      setWarningFeedback(error?.response?.data?.message || "Unable to send warning.");
    } finally {
      setBusyAction("");
    }
  };

  const handleExportUser = async (user) => {
    setBusyAction(`export-${user.id}`);
    try {
      await downloadAdminPdfExport("users", { id: user.id });
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Live user administration</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>User management</h1>
          <p className="admin-page-description">
            Create user accounts, review activity counts, open public profiles, export records, and moderate access from one screen.
          </p>
        </div>
        <div className="header-btn-group">
          <button type="button" className="btn-glass" onClick={() => setShowCreateForm((previous) => !previous)}>
            <UserPlus size={16} />
            {showCreateForm ? "Hide Create Form" : "Create User"}
          </button>
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
              placeholder="Search by full name, username, or email"
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <select value={filters.role} onChange={(event) => handleFilterChange("role", event.target.value)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={filters.active} onChange={(event) => handleFilterChange("active", event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={filters.suspended} onChange={(event) => handleFilterChange("suspended", event.target.value)}>
            {SUSPENSION_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {showCreateForm && (
        <section className="card admin-create-user-panel">
          <div className="project-actions admin-warning-panel__header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="card-icon-box secondary">
                <UserPlus size={22} />
              </div>
              <div>
                <h3>Create user account</h3>
                <p className="profile-meta">Admins can onboard students, industrial experts, and software engineers directly from here.</p>
              </div>
            </div>
          </div>

          <div className="admin-warning-form" style={{ marginTop: "24px" }}>
            <div className="admin-filter-grid" style={{ marginTop: 0 }}>
              <input
                type="text"
                value={createForm.fullName}
                placeholder="Full name"
                onChange={(event) => setCreateForm((previous) => ({ ...previous, fullName: event.target.value }))}
              />
              <input
                type="text"
                value={createForm.username}
                placeholder="Username"
                onChange={(event) => setCreateForm((previous) => ({ ...previous, username: event.target.value }))}
              />
              <input
                type="email"
                value={createForm.email}
                placeholder="Email address"
                onChange={(event) => setCreateForm((previous) => ({ ...previous, email: event.target.value }))}
              />
              <input
                type="password"
                value={createForm.password}
                placeholder="Temporary password"
                onChange={(event) => setCreateForm((previous) => ({ ...previous, password: event.target.value }))}
              />
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm((previous) => ({ ...previous, role: event.target.value }))}
              >
                <option value={roles.STUDENT}>Student</option>
                <option value={roles.INDUSTRIAL_EXPERT}>Industrial Expert</option>
                <option value={roles.SOFTWARE_ENGINEER}>Software Engineer</option>
              </select>
            </div>
            <div className="admin-warning-panel__actions">
              <button type="button" className="btn-glow-danger" onClick={handleCreateUser} disabled={busyAction === "create-user"}>
                {busyAction === "create-user" ? "Creating user..." : "Create User Account"}
              </button>
              {createFeedback && <span className="trend-meta admin-feedback-text">{createFeedback}</span>}
            </div>
          </div>
        </section>
      )}

      {selectedUser && (
        <section className="card admin-warning-panel">
          <div className="project-actions admin-warning-panel__header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="card-icon-box warning">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3>Send warning to @{selectedUser.username}</h3>
                <p className="profile-meta">This warning will be delivered to the selected user and can reference related content when needed.</p>
              </div>
            </div>
            <button type="button" className="btn-glass" onClick={() => setSelectedUser(null)}>
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
              placeholder="Write a clear explanation for the user"
              onChange={(event) => setWarningForm((previous) => ({ ...previous, message: event.target.value }))}
            />
            <div className="admin-filter-grid" style={{ marginTop: 0 }}>
              <input
                type="text"
                value={warningForm.reason}
                placeholder="Reason or policy reference"
                onChange={(event) => setWarningForm((previous) => ({ ...previous, reason: event.target.value }))}
              />
              <select
                value={warningForm.contentType}
                onChange={(event) => setWarningForm((previous) => ({ ...previous, contentType: event.target.value }))}
              >
                {CONTENT_TYPES.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={warningForm.contentId}
                placeholder="Related content ID"
                onChange={(event) => setWarningForm((previous) => ({ ...previous, contentId: event.target.value }))}
              />
            </div>
            <div className="admin-warning-panel__actions">
              <button
                type="button"
                className="btn-glow-danger"
                onClick={handleWarningSubmit}
                disabled={busyAction === `warn-${selectedUser.id}`}
              >
                {busyAction === `warn-${selectedUser.id}` ? "Sending warning..." : "Send Warning"}
              </button>
              {warningFeedback && <span className="trend-meta admin-feedback-text">{warningFeedback}</span>}
            </div>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <UsersIcon className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Loading user records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <AlertTriangle className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>We could not load the user list right now.</p>
        </div>
      ) : (
        <section className="admin-entity-grid admin-user-grid-pro">
          {users.map((user) => {
            const isCurrentUser = currentUser?.id === user.id;
            const isProtected = isCurrentUser || user.role === roles.SUPER_ADMIN;

            return (
              <article key={user.id} className="card admin-user-record-card">
                <div className="admin-user-record-card__header">
                  <Link to={getProfilePath(user.username)} className="admin-owner-link">
                    <div className="admin-owner-link__avatar admin-owner-link__avatar--large">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.fullName || user.username} />
                      ) : (
                        getInitials(user.fullName || user.username)
                      )}
                    </div>
                    <div>
                      <strong>{user.fullName || user.username}</strong>
                      <span>@{user.username}</span>
                    </div>
                  </Link>
                  <span className="feed-badge">{formatRole(user.role)}</span>
                </div>

                <div className="admin-content-record-card__status-row">
                  <span className={`status-pill ${user.active ? "status-active" : "status-inactive"}`}>
                    {user.active ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                    {user.active ? "Active" : "Inactive"}
                  </span>
                  {user.suspended && <span className="status-pill status-inactive">Suspended</span>}
                  {isCurrentUser && <span className="status-pill">Current admin</span>}
                </div>

                <div className="admin-user-record-card__stats">
                  <div>
                    <Briefcase size={14} />
                    <span>{user.projectCount || 0} projects</span>
                  </div>
                  <div>
                    <NotebookTabs size={14} />
                    <span>{user.postCount || 0} posts</span>
                  </div>
                  <div>
                    <BookOpenText size={14} />
                    <span>{user.blogCount || 0} blogs</span>
                  </div>
                  <div>
                    <UsersIcon size={14} />
                    <span>{user.followerCount || 0} followers</span>
                  </div>
                </div>

                <div className="admin-user-record-card__info">
                  <div className="stream-item-sub admin-inline-detail">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                  <div className="stream-item-sub admin-inline-detail">
                    <Calendar size={14} />
                    <span>Joined {formatDate(user.joinedAt)}</span>
                  </div>
                </div>

                <div className="admin-card-actions admin-card-actions--wrap">
                  <Link to={getProfilePath(user.username)} className="btn-glass admin-action-button">
                    <User size={15} />
                    View Profile
                  </Link>
                  <button
                    type="button"
                    className="btn-glass admin-action-button"
                    onClick={() => setDetailUser(user)}
                  >
                    <Eye size={15} />
                    View Entry
                  </button>
                  <button
                    type="button"
                    className="btn-glass admin-action-button"
                    onClick={() => handleExportUser(user)}
                    disabled={busyAction === `export-${user.id}`}
                  >
                    <FileDown size={15} />
                    {busyAction === `export-${user.id}` ? "PDF..." : "PDF"}
                  </button>
                  <button
                    type="button"
                    className="btn-glass admin-action-button"
                    onClick={() => handleStatusUpdate(user.id, { active: !user.active }, `active-${user.id}`)}
                    disabled={isProtected || busyAction === `active-${user.id}`}
                  >
                    {busyAction === `active-${user.id}` ? (
                      <RotateCcw size={15} className="spin" />
                    ) : user.active ? (
                      <ShieldOff size={15} />
                    ) : (
                      <ShieldCheck size={15} />
                    )}
                    {busyAction === `active-${user.id}` ? "Updating..." : user.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="btn-glass admin-action-button"
                    onClick={() => handleStatusUpdate(user.id, { suspended: !user.suspended }, `suspend-${user.id}`)}
                    disabled={isProtected || busyAction === `suspend-${user.id}`}
                  >
                    {busyAction === `suspend-${user.id}` ? (
                      <RotateCcw size={15} className="spin" />
                    ) : user.suspended ? (
                      <RotateCcw size={15} />
                    ) : (
                      <Ban size={15} />
                    )}
                    {busyAction === `suspend-${user.id}` ? "Updating..." : user.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    className="btn-glass admin-action-button"
                    onClick={() => setSelectedUser(user)}
                  >
                    <AlertTriangle size={15} />
                    Warn
                  </button>
                  <button
                    type="button"
                    className="btn-glow-danger admin-action-button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={isProtected || busyAction === `delete-${user.id}`}
                  >
                    {busyAction === `delete-${user.id}` ? (
                      <RotateCcw size={15} className="spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    {busyAction === `delete-${user.id}` ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
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
            Page {page + 1} of {totalPages} · {totalElements} users
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

      {detailUser && <AdminEntryDetailModal entryType="USER" item={detailUser} onClose={() => setDetailUser(null)} />}
    </div>
  );
}
