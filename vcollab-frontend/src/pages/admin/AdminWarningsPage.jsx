import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  Eye,
  Filter,
  Info,
  Layers,
  RotateCcw,
  ShieldAlert,
  Trash2,
  User
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { deleteAdminWarning, listAdminWarnings } from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";
import "../../styles/admin-table.css";

const WARNING_STATUS_OPTIONS = [
  { value: "", label: "All warnings" },
  { value: "SENT", label: "Open warnings" },
  { value: "ACKNOWLEDGED", label: "Acknowledged warnings" }
];

const PAGE_SIZE = 15;

export default function AdminWarningsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [detailWarning, setDetailWarning] = useState(null);

  const params = useMemo(() => {
    const next = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
    if (statusFilter) next.status = statusFilter;
    return next;
  }, [page, statusFilter]);

  const queryKey = ["admin", "warnings", statusFilter, page];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listAdminWarnings(params),
    refetchInterval: 15000
  });

  const warnings = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || warnings.length;

  const handleDelete = async (warning) => {
    const confirmed = window.confirm(`Move warning #${warning.id} to the recycle bin?`);
    if (!confirmed) return;
    setBusyId(warning.id);
    try {
      await deleteAdminWarning(warning.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "warnings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Professional Conduct History</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>Warnings Log</h1>
          <p className="admin-page-description">Track all warnings issued to users, their acknowledgement status, and related content references.</p>
        </div>
      </div>

      {/* Filter */}
      <section className="card admin-filter-panel">
        <div className="admin-filter-grid">
          <div style={{ position: "relative" }}>
            <Filter className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={statusFilter} style={{ paddingLeft: "40px" }} onChange={(event) => { setPage(0); setStatusFilter(event.target.value); }}>
              {WARNING_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <Bell className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Syncing notification records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Unable to retrieve warning records.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Target User</th>
                <th>Reason</th>
                <th>Related Content</th>
                <th>Sent</th>
                <th>Acknowledged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warnings.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-empty">
                      <CheckCircle size={36} />
                      No warnings discovered in active transmission logs.
                    </div>
                  </td>
                </tr>
              ) : (
                warnings.map((warning) => (
                  <tr key={warning.id}>
                    {/* ID */}
                    <td><span className="admin-table-mono">#{warning.id}</span></td>

                    {/* Title + message */}
                    <td style={{ minWidth: 200 }}>
                      <div className="admin-table-title">{warning.title}</div>
                      <div className="admin-table-sub" style={{ maxWidth: 220, whiteSpace: "normal", marginTop: 2 }}>
                        {warning.message}
                      </div>
                    </td>

                    {/* Target user */}
                    <td style={{ fontSize: "0.82rem", color: "#6b7f95" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <User size={13} />
                        {warning.target?.fullName || warning.target?.username || "—"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td>
                      <span className="admin-table-badge admin-table-badge--warning">
                        <Info size={11} />{warning.reason || "Policy violation"}
                      </span>
                    </td>

                    {/* Related content */}
                    <td>
                      {warning.contentType
                        ? <span className="admin-table-badge"><Layers size={11} />{warning.contentType} #{warning.contentId}</span>
                        : <span style={{ color: "#aab5c2" }}>—</span>}
                    </td>

                    {/* Sent */}
                    <td style={{ whiteSpace: "nowrap", color: "#788fa5", fontSize: "0.78rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} />{formatDate(warning.createdAt)}</span>
                    </td>

                    {/* Acknowledged */}
                    <td>
                      {warning.acknowledgedAt
                        ? <span className="status-pill status-active" style={{ fontSize: "0.72rem" }}><CheckCircle size={11} />{formatDate(warning.acknowledgedAt)}</span>
                        : <span className="status-pill status-inactive" style={{ fontSize: "0.72rem" }}>Awaiting receipt</span>}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-icon-btn" onClick={() => setDetailWarning(warning)} title="View" aria-label="View">
                          <Eye size={15} />
                        </button>
                        <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDelete(warning)} disabled={busyId === warning.id} title="Move to bin" aria-label="Move to bin">
                          {busyId === warning.id ? <RotateCcw size={15} className="spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-table-pagination">
              <span className="admin-table-pagination__meta">Page {page + 1} of {totalPages} · {totalElements} warnings</span>
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

      {detailWarning && <AdminEntryDetailModal entryType="WARNING" item={detailWarning} onClose={() => setDetailWarning(null)} />}
    </div>
  );
}
