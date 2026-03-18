import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  Bell, 
  User, 
  Clock, 
  ShieldAlert,
  Eye,
  Filter,
  Info,
  Calendar,
  Layers,
  Trash2
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { deleteAdminWarning, listAdminWarnings } from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";

const WARNING_STATUS_OPTIONS = [
  { value: "", label: "All warnings" },
  { value: "SENT", label: "Open warnings" },
  { value: "ACKNOWLEDGED", label: "Acknowledged warnings" }
];

const PAGE_SIZE = 12;

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

  const handleDelete = async (warning) => {
    const confirmed = window.confirm(`Move warning #${warning.id} to the recycle bin?`);
    if (!confirmed) {
      return;
    }

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
    <div className="admin-pro-stack">
      <div className="live-status-badge">Professional Conduct History</div>
      
      <div className="command-center-header">
        <h1>Warnings Log</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00d1ff' }}>
            Transmission History
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
              {WARNING_STATUS_OPTIONS.map((option) => (
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
          <Bell className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Syncing notification records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Unable to retrieve warning records.</p>
        </div>
      ) : warnings.length === 0 ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <CheckCircle className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>No warnings discovered in active transmission logs.</p>
        </div>
      ) : (
        <div className="admin-entity-grid">
          {warnings.map((warning) => (
            <article key={warning.id} className="card admin-moderation-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="card-icon-box danger" style={{ width: '40px', height: '40px' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{warning.title}</h4>
                    <span className="stream-meta-label">ID: {warning.id}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`status-pill status-${warning.status?.toLowerCase()}`}>
                    {warning.status}
                  </span>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => setDetailWarning(warning)}
                    title="View warning entry"
                    aria-label="View warning entry"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid var(--admin-accent-primary)' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>{warning.message}</p>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} />
                  <span>Target: {warning.target?.fullName || warning.target?.username}</span>
                </div>
                <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={14} />
                  <span>Reason: {warning.reason || "Global Protocol Violation"}</span>
                </div>
                {warning.contentType && (
                  <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} />
                    <span>Rel: {warning.contentType} #{warning.contentId}</span>
                  </div>
                )}
                <div className="stream-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} />
                  <span>Sent: {formatDate(warning.createdAt)}</span>
                </div>
              </div>

              {warning.acknowledgedAt && (
                <div className="status-pill status-active" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', width: 'fit-content' }}>
                  Acknowledged: {formatDate(warning.acknowledgedAt)}
                </div>
              )}
              
              {!warning.acknowledgedAt && (
                <div className="status-pill status-inactive" style={{ width: 'fit-content' }}>
                  Awaiting User Receipt
                </div>
              )}

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-glass"
                  style={{ gap: "10px" }}
                  onClick={() => handleDelete(warning)}
                  disabled={busyId === warning.id}
                >
                  <Trash2 size={16} />
                  {busyId === warning.id ? "Moving..." : "Move To Bin"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={page === 0}
          >
            Previous Log
          </button>
          <span className="stream-meta-label">
            Log Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages}
          >
            Next Log
          </button>
        </div>
      )}

      {detailWarning && <AdminEntryDetailModal entryType="WARNING" item={detailWarning} onClose={() => setDetailWarning(null)} />}
    </div>
  );
}
