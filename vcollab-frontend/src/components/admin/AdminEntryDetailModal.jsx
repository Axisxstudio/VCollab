import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArchiveX,
  Bell,
  BookOpenText,
  Briefcase,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Info,
  Layers,
  Mail,
  MessageSquareText,
  NotebookTabs,
  ShieldAlert,
  Tag,
  UserRound,
  Users,
  X
} from "lucide-react";
import { routes } from "../../config/routes";
import { formatDate, formatRole } from "../../utils/discovery";

const CONTENT_PATHS = {
  PROJECT: routes.projectDetail,
  POST: routes.postDetail,
  BLOG: routes.blogDetail
};

function resolveProfilePath(username) {
  return username ? routes.profile.replace(":username", username) : null;
}

function resolveContentPath(contentType, contentId) {
  const pattern = CONTENT_PATHS[contentType];
  return pattern && contentId ? pattern.replace(":id", contentId) : null;
}

function renderMetaCard(label, icon, value) {
  return (
    <div className="admin-detail-meta-card">
      <div className="admin-detail-meta-card__label">
        {icon}
        {label}
      </div>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function renderCopyBlock(label, icon, content) {
  if (!content) {
    return null;
  }

  return (
    <div className="admin-detail-copy-block">
      <div className="admin-detail-copy-block__label">
        {icon}
        {label}
      </div>
      <p>{content}</p>
    </div>
  );
}

function UserView({ item }) {
  const profilePath = resolveProfilePath(item.username);

  return (
    <>
      <div className="admin-detail-modal__meta-grid">
        {renderMetaCard("Role", <ShieldAlert size={15} />, formatRole(item.role))}
        {renderMetaCard("Email", <Mail size={15} />, item.email)}
        {renderMetaCard("Joined", <CalendarDays size={15} />, formatDate(item.joinedAt))}
        {renderMetaCard("Followers", <Users size={15} />, String(item.followerCount || 0))}
      </div>

      <div className="admin-entry-detail-grid">
        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <Activity size={15} />
            Account status
          </div>
          <div className="admin-entry-detail-badge-list">
            <span className={`status-pill ${item.active ? "status-active" : "status-inactive"}`}>
              {item.active ? "Active" : "Inactive"}
            </span>
            {item.suspended && <span className="status-pill status-inactive">Suspended</span>}
          </div>
        </div>

        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <Layers size={15} />
            Contribution totals
          </div>
          <div className="admin-entry-detail-stat-grid">
            <span><Briefcase size={14} /> {item.projectCount || 0} projects</span>
            <span><NotebookTabs size={14} /> {item.postCount || 0} posts</span>
            <span><BookOpenText size={14} /> {item.blogCount || 0} blogs</span>
          </div>
        </div>
      </div>

      {profilePath && (
        <div className="feed-link-row">
          <Link to={profilePath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open profile
          </Link>
        </div>
      )}
    </>
  );
}

function ReportView({ item }) {
  const reporterPath = resolveProfilePath(item.reporter?.username);
  const contentPath = resolveContentPath(item.contentType, item.contentId);

  return (
    <>
      <div className="admin-detail-modal__meta-grid">
        {renderMetaCard("Status", <ShieldAlert size={15} />, item.status)}
        {renderMetaCard("Reason", <AlertCircle size={15} />, item.reason)}
        {renderMetaCard("Submitted", <CalendarDays size={15} />, formatDate(item.createdAt))}
        {renderMetaCard("Resolved", <Clock3 size={15} />, item.resolvedAt ? formatDate(item.resolvedAt) : "Pending")}
      </div>

      <div className="admin-entry-detail-grid">
        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <UserRound size={15} />
            Reporter
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.reporter?.fullName || item.reporter?.username || "Unknown reporter"}</span>
            <span>@{item.reporter?.username || "unknown"}</span>
          </div>
        </div>

        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <Layers size={15} />
            Related content
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.contentType || "Unknown"} #{item.contentId || "-"}</span>
          </div>
        </div>
      </div>

      {renderCopyBlock("Report description", <MessageSquareText size={15} />, item.description)}
      {renderCopyBlock("Admin note", <Info size={15} />, item.adminNote)}

      <div className="feed-link-row">
        {reporterPath && (
          <Link to={reporterPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open reporter
          </Link>
        )}
        {contentPath && (
          <Link to={contentPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open content
          </Link>
        )}
      </div>
    </>
  );
}

function WarningView({ item }) {
  const targetPath = resolveProfilePath(item.target?.username);
  const contentPath = resolveContentPath(item.contentType, item.contentId);

  return (
    <>
      <div className="admin-detail-modal__meta-grid">
        {renderMetaCard("Status", <Bell size={15} />, item.status)}
        {renderMetaCard("Reason", <AlertTriangle size={15} />, item.reason || "Not specified")}
        {renderMetaCard("Sent", <CalendarDays size={15} />, formatDate(item.createdAt))}
        {renderMetaCard("Acknowledged", <Clock3 size={15} />, item.acknowledgedAt ? formatDate(item.acknowledgedAt) : "Awaiting receipt")}
      </div>

      <div className="admin-entry-detail-grid">
        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <UserRound size={15} />
            Target user
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.target?.fullName || item.target?.username || "Unknown user"}</span>
            <span>@{item.target?.username || "unknown"}</span>
          </div>
        </div>

        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <Layers size={15} />
            Related content
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.contentType ? `${item.contentType} #${item.contentId}` : "No related content"}</span>
          </div>
        </div>
      </div>

      {renderCopyBlock("Warning message", <FileText size={15} />, item.message)}

      <div className="feed-link-row">
        {targetPath && (
          <Link to={targetPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open user
          </Link>
        )}
        {contentPath && (
          <Link to={contentPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open content
          </Link>
        )}
      </div>
    </>
  );
}

function AuditView({ item }) {
  const actorPath = resolveProfilePath(item.actor?.username);
  const contentPath = resolveContentPath(item.targetType, item.targetId);

  return (
    <>
      <div className="admin-detail-modal__meta-grid">
        {renderMetaCard("Module", <Layers size={15} />, item.moduleName)}
        {renderMetaCard("Action", <Activity size={15} />, item.actionName)}
        {renderMetaCard("Time", <CalendarDays size={15} />, formatDate(item.createdAt))}
        {renderMetaCard("Target", <Tag size={15} />, item.targetType ? `${item.targetType}${item.targetId ? ` #${item.targetId}` : ""}` : "N/A")}
      </div>

      <div className="admin-entry-detail-grid">
        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <UserRound size={15} />
            Actor
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.actor?.fullName || item.actor?.username || "System actor"}</span>
            <span>@{item.actor?.username || "system"}</span>
          </div>
        </div>
      </div>

      {renderCopyBlock("Summary", <FileText size={15} />, item.summary)}
      {renderCopyBlock("Metadata", <Info size={15} />, item.metadata)}

      <div className="feed-link-row">
        {actorPath && (
          <Link to={actorPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open actor
          </Link>
        )}
        {contentPath && (
          <Link to={contentPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open target
          </Link>
        )}
      </div>
    </>
  );
}

function RecycleView({ item }) {
  const ownerPath = resolveProfilePath(item.ownerUsername);

  return (
    <>
      <div className="admin-detail-modal__meta-grid">
        {renderMetaCard("Entity", <ArchiveX size={15} />, item.entityType)}
        {renderMetaCard("Status", <ShieldAlert size={15} />, item.status || "Deleted")}
        {renderMetaCard("Created", <CalendarDays size={15} />, formatDate(item.createdAt))}
        {renderMetaCard("Deleted", <Clock3 size={15} />, formatDate(item.deletedAt))}
      </div>

      <div className="admin-entry-detail-grid">
        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <UserRound size={15} />
            Owner
          </div>
          <div className="admin-entry-detail-list">
            <span>{item.ownerFullName || item.ownerUsername || "Unknown owner"}</span>
            <span>@{item.ownerUsername || "system"}</span>
          </div>
        </div>

        <div className="admin-detail-copy-block">
          <div className="admin-detail-copy-block__label">
            <Layers size={15} />
            Labels
          </div>
          <div className="admin-entry-detail-badge-list">
            {item.secondaryLabel && <span className="status-pill">{item.secondaryLabel}</span>}
            {item.tertiaryLabel && <span className="status-pill">{item.tertiaryLabel}</span>}
          </div>
        </div>
      </div>

      {renderCopyBlock("Excerpt", <FileText size={15} />, item.excerpt)}

      {ownerPath && (
        <div className="feed-link-row">
          <Link to={ownerPath} className="btn-glass admin-detail-link">
            <ExternalLink size={16} />
            Open owner
          </Link>
        </div>
      )}
    </>
  );
}

function getTitle(entryType, item) {
  if (entryType === "USER") {
    return item.fullName || item.username || `User #${item.id}`;
  }
  if (entryType === "REPORT") {
    return `Report #${item.id}`;
  }
  if (entryType === "WARNING") {
    return item.title || `Warning #${item.id}`;
  }
  if (entryType === "AUDIT_LOG") {
    return item.summary || `${item.moduleName} ${item.actionName}`;
  }
  return item.title || `${item.entityType} #${item.id}`;
}

function getSubtitle(entryType, item) {
  if (entryType === "USER") {
    return `@${item.username || "unknown"}`;
  }
  if (entryType === "REPORT") {
    return `${item.contentType || "CONTENT"} #${item.contentId || "-"}`;
  }
  if (entryType === "WARNING") {
    return `Targeting ${item.target?.fullName || item.target?.username || "unknown user"}`;
  }
  if (entryType === "AUDIT_LOG") {
    return `Logged ${formatDate(item.createdAt)}`;
  }
  return `Archived ${item.entityType || "record"}`;
}

export default function AdminEntryDetailModal({ entryType, item, onClose }) {
  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div className="admin-detail-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="admin-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-entry-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-detail-modal__header">
          <div>
            <div className="feed-badges">
              <span className="feed-badge">{entryType.replace("_", " ")}</span>
            </div>
            <h2 id="admin-entry-detail-title">{getTitle(entryType, item)}</h2>
            <p className="admin-page-description">{getSubtitle(entryType, item)}</p>
          </div>

          <div className="admin-detail-modal__header-actions">
            <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close details" title="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="admin-detail-modal__body">
          {entryType === "USER" && <UserView item={item} />}
          {entryType === "REPORT" && <ReportView item={item} />}
          {entryType === "WARNING" && <WarningView item={item} />}
          {entryType === "AUDIT_LOG" && <AuditView item={item} />}
          {entryType === "RECYCLE" && <RecycleView item={item} />}
        </div>
      </section>
    </div>
  );
}
