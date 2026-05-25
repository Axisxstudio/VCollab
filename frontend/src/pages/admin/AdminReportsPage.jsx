import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Info,
  MessageSquareText,
  RotateCcw,
  ShieldAlert,
  ShieldOff,
  User,
  Trash2
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import {
  deleteAdminReport,
  listAdminReports,
  updateAdminReportStatus,
  deleteAdminProject,
  deleteAdminPost,
  deleteAdminBlog,
  updateAdminUserStatus,
  createAdminWarning
} from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";
import "../../styles/admin-table.css";

const REPORT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTION_TAKEN", label: "Action Taken" },
  { value: "DISMISSED", label: "Dismissed" }
];

const STATUS_TONE = {
  PENDING: "warning",
  REVIEWED: "",
  ACTION_TAKEN: "success",
  DISMISSED: "danger"
};

const PAGE_SIZE = 15;

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [detailReport, setDetailReport] = useState(null);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageForm, setMessageForm] = useState({ title: "Report Update", message: "" });
  const [messageFeedback, setMessageFeedback] = useState("");

  const params = useMemo(() => {
    const next = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
    if (statusFilter) next.status = statusFilter;
    return next;
  }, [page, statusFilter]);

  const queryKey = ["admin", "reports", statusFilter, page];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listAdminReports(params),
    refetchInterval: 15000
  });

  const reports = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || reports.length;

  const handleStatusChange = async (report, newStatus) => {
    setBusyId(report.id);
    setBusyAction("status");
    try {
      await updateAdminReportStatus(report.id, { status: newStatus, adminNote: report.adminNote || "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  };

  const handleBlockContent = async (report) => {
    const confirmed = window.confirm(`Are you sure you want to block/remove ${report.contentType} #${report.contentId}?`);
    if (!confirmed) return;
    
    setBusyId(report.id);
    setBusyAction("block");
    try {
      if (report.contentType === "PROJECT") await deleteAdminProject(report.contentId);
      else if (report.contentType === "POST") await deleteAdminPost(report.contentId);
      else if (report.contentType === "BLOG") await deleteAdminBlog(report.contentId);
      else if (report.contentType === "USER") await updateAdminUserStatus(report.contentId, { suspended: true });
      
      // Auto-update report status
      await updateAdminReportStatus(report.id, { status: "ACTION_TAKEN", adminNote: "Content blocked automatically." });
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      alert("Content blocked successfully.");
    } catch (error) {
      alert("Failed to block content. It may already be removed.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) return;
    setBusyId(messageTarget.reporter.id);
    setBusyAction("msg");
    setMessageFeedback("");
    try {
      await createAdminWarning({
        targetUserId: messageTarget.reporter.id,
        title: messageForm.title,
        message: messageForm.message,
        reason: "Report Resolution Update",
        contentType: messageTarget.contentType,
        contentId: messageTarget.contentId
      });
      setMessageFeedback("Message sent to reporter successfully.");
      setMessageForm({ title: "Report Update", message: "" });
      setTimeout(() => setMessageTarget(null), 2000);
    } catch (error) {
      setMessageFeedback("Failed to send message.");
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  };

  const handleDelete = async (report) => {
    const confirmed = window.confirm(`Move report #${report.id} to the recycle bin?`);
    if (!confirmed) return;
    setBusyId(report.id);
    setBusyAction("delete");
    try {
      await deleteAdminReport(report.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyId(null);
      setBusyAction("");
    }
  };

  return (
    <div className="admin-pro-stack admin-page-stack">

      {/* Filter */}
      <section className="card admin-filter-panel">
        <div className="admin-filter-grid">
          <div style={{ position: "relative" }}>
            <Filter className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={statusFilter} style={{ paddingLeft: "40px" }} onChange={(event) => { setPage(0); setStatusFilter(event.target.value); }}>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Message Reporter Panel */}
      {messageTarget && (
        <section className="card admin-warning-panel">
          <div className="project-actions admin-warning-panel__header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="card-icon-box warning"><MessageSquareText size={22} /></div>
              <div>
                <h3>Message Reporter (@{messageTarget.reporter?.username})</h3>
                <p className="profile-meta">Thank the reporter or provide an update regarding {messageTarget.contentType.toLowerCase()} #{messageTarget.contentId}.</p>
              </div>
            </div>
            <button type="button" className="btn-glass" onClick={() => setMessageTarget(null)}>Close</button>
          </div>
          <div className="admin-warning-form" style={{ marginTop: "24px" }}>
            <input type="text" value={messageForm.title} placeholder="Message subject" onChange={(event) => setMessageForm((previous) => ({ ...previous, title: event.target.value }))} />
            <textarea rows="3" value={messageForm.message} placeholder="Write a message to the reporter..." onChange={(event) => setMessageForm((previous) => ({ ...previous, message: event.target.value }))} />
            <div className="admin-warning-panel__actions">
              <button type="button" className="btn-glow-danger" onClick={handleSendMessage} disabled={busyId === messageTarget.reporter.id}>
                {busyId === messageTarget.reporter.id ? "Sending..." : "Send Message"}
              </button>
              {messageFeedback && <span className="trend-meta admin-feedback-text">{messageFeedback}</span>}
            </div>
          </div>
        </section>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <AlertCircle className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Analyzing community feedback...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Failed to sync reports database.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Reason</th>
                <th>Reporting Content</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-empty">
                      <CheckCircle size={36} />
                      No pending reports discovered.
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const tone = STATUS_TONE[report.status] || "";

                  return (
                    <tr key={report.id}>
                      {/* ID */}
                      <td><span className="admin-table-mono">#{report.id}</span></td>

                      {/* Reporter */}
                      <td style={{ fontSize: "0.82rem", color: "#6b7f95", minWidth: 140 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <User size={13} />
                          {report.reporter?.fullName || report.reporter?.username || "Unknown"}
                        </span>
                        {report.reporter?.username && <div style={{ marginTop: 2, marginLeft: 18, fontSize: "0.75rem" }}>@{report.reporter.username}</div>}
                      </td>

                      {/* Reason */}
                      <td>
                        <span className={`admin-table-badge admin-table-badge--${tone || "warning"}`}>
                          <Info size={11} />{report.reason}
                        </span>
                      </td>

                      {/* Reporting Content */}
                      <td style={{ minWidth: 180 }}>
                        <div className="admin-table-title">{report.contentType} <span className="admin-table-mono" style={{ padding: "1px 4px", fontSize: "0.7rem", marginLeft: 4 }}>#{report.contentId}</span></div>
                        {report.description && (
                          <div className="admin-table-sub" style={{ maxWidth: 220, whiteSpace: "normal", marginTop: 4 }}>
                            {report.description}
                          </div>
                        )}
                      </td>

                      {/* Submitted */}
                      <td style={{ whiteSpace: "nowrap", color: "#788fa5", fontSize: "0.78rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} />{formatDate(report.createdAt)}</span>
                      </td>

                      {/* Status Dropdown inside the table, directly editable */}
                      <td>
                        <select 
                          value={report.status} 
                          onChange={(e) => handleStatusChange(report, e.target.value)}
                          disabled={busyId === report.id && busyAction === "status"}
                          style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: "8px", border: "1px solid #d7e0ea" }}
                        >
                          {REPORT_STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Action */}
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-icon-btn" onClick={() => setDetailReport(report)} title="View details" aria-label="View">
                            <Eye size={15} />
                          </button>
                          <button type="button" className="admin-icon-btn admin-icon-btn--primary" onClick={() => setMessageTarget(report)} title="Message reporter" aria-label="Message reporter">
                            <MessageSquareText size={15} />
                          </button>
                          <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleBlockContent(report)} disabled={busyId === report.id} title="Block reported content" aria-label="Block content">
                            {busyId === report.id && busyAction === "block" ? <RotateCcw size={15} className="spin" /> : <ShieldOff size={15} />}
                          </button>
                          <button type="button" className="admin-icon-btn" style={{ color: "#aab5c2" }} onClick={() => handleDelete(report)} disabled={busyId === report.id} title="Move report to bin" aria-label="Move to bin">
                            {busyId === report.id && busyAction === "delete" ? <RotateCcw size={15} className="spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-table-pagination">
              <span className="admin-table-pagination__meta">Page {page + 1} of {totalPages} · {totalElements} reports</span>
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

      {detailReport && <AdminEntryDetailModal entryType="REPORT" item={detailReport} onClose={() => setDetailReport(null)} />}
    </div>
  );
}
