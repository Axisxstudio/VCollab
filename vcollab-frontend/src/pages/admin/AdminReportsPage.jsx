import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  AlertCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  ShieldAlert,
  Eye,
  Filter,
  Save,
  User,
  Info,
  Trash2
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { deleteAdminReport, listAdminReports, updateAdminReportStatus } from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";

const REPORT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTION_TAKEN", label: "Action Taken" },
  { value: "DISMISSED", label: "Dismissed" }
];

const PAGE_SIZE = 10;

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [detailReport, setDetailReport] = useState(null);

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

  const handleDraftChange = (id, field, value) => {
    const currentReport = reports.find((item) => item.id === id);
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        status: previous[id]?.status || currentReport?.status || "PENDING",
        adminNote: previous[id]?.adminNote ?? currentReport?.adminNote ?? "",
        [field]: value
      }
    }));
  };

  const handleUpdate = async (report) => {
    const draft = drafts[report.id] || {
      status: report.status,
      adminNote: report.adminNote || ""
    };
    setBusyId(report.id);
    try {
      await updateAdminReportStatus(report.id, {
        status: draft.status,
        adminNote: draft.adminNote
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (report) => {
    const confirmed = window.confirm(`Move report #${report.id} to the recycle bin?`);
    if (!confirmed) {
      return;
    }

    setBusyId(report.id);
    try {
      await deleteAdminReport(report.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Moderation Feedback Loop</div>
      
      <div className="command-center-header">
        <h1>Reports Queue</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(255, 184, 0, 0.1)', color: '#ffb800' }}>
            Awaiting Verification
          </span>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '32px' }}>
        <div className="admin-filter-grid">
          <div style={{ position: 'relative', flex: 2 }}>
            <Filter className="admin-search-icon" size={18} style={{ left: '12px' }} />
            <select 
              value={statusFilter} 
              style={{ paddingLeft: '40px' }}
              onChange={(event) => { setPage(0); setStatusFilter(event.target.value); }}
            >
              {REPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <AlertCircle className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Analyzing community feedback...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Failed to sync reports database.</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <CheckCircle className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>No pending reports discovered.</p>
        </div>
      ) : (
        <section style={{ display: 'grid', gap: '24px' }}>
          {reports.map((report) => {
            const draft = drafts[report.id] || {
              status: report.status,
              adminNote: report.adminNote || ""
            };

            return (
              <article key={report.id} className="card admin-moderation-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border)' }}>
                  <div style={{ padding: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="card-icon-box danger" style={{ width: '40px', height: '40px' }}>
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>{report.contentType} Reference #{report.contentId}</h4>
                          <span className="stream-meta-label">ID: {report.id}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span className={`status-pill status-${report.status?.toLowerCase()}`}>
                          {report.status}
                        </span>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => setDetailReport(report)}
                          title="View report entry"
                          aria-label="View report entry"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                      <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} />
                        <span>Reporter: {report.reporter?.fullName || report.reporter?.username}</span>
                      </div>
                      <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} />
                        <span>Submitted: {formatDate(report.createdAt)}</span>
                      </div>
                      <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-accent-primary)' }}>
                        <Info size={14} />
                        <strong>Reason: {report.reason}</strong>
                      </div>
                    </div>

                    {report.description && (
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{report.description}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ width: '400px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderLeft: '1px solid var(--admin-border)' }}>
                    <h5 className="stream-meta-label" style={{ marginBottom: '16px', color: '#fff' }}>MODERATION PROTOCOL</h5>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <select
                        value={draft.status}
                        onChange={(event) => handleDraftChange(report.id, "status", event.target.value)}
                      >
                        {REPORT_STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows="4"
                        value={draft.adminNote}
                        placeholder="Log internal resolution note..."
                        onChange={(event) => handleDraftChange(report.id, "adminNote", event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-glow-danger"
                        style={{ justifyContent: 'center', gap: '10px' }}
                        onClick={() => handleUpdate(report)}
                        disabled={busyId === report.id}
                      >
                        <Save size={18} />
                        {busyId === report.id ? "COMMITING..." : "COMMIT RESOLUTION"}
                      </button>
                      <button
                        type="button"
                        className="btn-glass"
                        style={{ justifyContent: "center", gap: "10px" }}
                        onClick={() => handleDelete(report)}
                        disabled={busyId === report.id}
                      >
                        <Trash2 size={16} />
                        Move To Bin
                      </button>
                    </div>
                  </div>
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
            Rewind
          </button>
          <span className="stream-meta-label">
            Queue Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages}
          >
            Forward
          </button>
        </div>
      )}

      {detailReport && <AdminEntryDetailModal entryType="REPORT" item={detailReport} onClose={() => setDetailReport(null)} />}
    </div>
  );
}
