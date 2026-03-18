import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Database, 
  Search, 
  Terminal as TerminalIcon, 
  User, 
  Tag, 
  Activity, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Filter
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { listAdminAuditLogs } from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";

const MODULE_OPTIONS = ["", "USER", "PROJECT", "POST", "BLOG", "REPORT", "WARNING", "CATEGORY"];
const ACTION_OPTIONS = [
  "",
  "STATUS_UPDATED",
  "MODERATION_UPDATED",
  "SOFT_DELETED",
  "RESTORED",
  "CREATED",
  "UPDATED",
  "TOGGLED"
];

const PAGE_SIZE = 15;

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState({
    search: "",
    module: "",
    action: ""
  });
  const [page, setPage] = useState(0);
  const [detailLog, setDetailLog] = useState(null);

  const params = {
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc"
  };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.module) params.module = filters.module;
  if (filters.action) params.action = filters.action;

  const queryKey = ["admin", "audit-logs", filters.search, filters.module, filters.action, page];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listAdminAuditLogs(params),
    refetchInterval: 15000
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Sequential Audit Database</div>
      
      <div className="command-center-header">
        <h1>Analytics Base</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00d1ff' }}>
            Live Event Stream
          </span>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '32px' }}>
        <div className="admin-filter-grid">
          <div style={{ position: 'relative', flex: 2 }}>
            <Search className="admin-search-icon" size={18} style={{ left: '12px' }} />
            <input
              type="text"
              className="admin-search-input"
              style={{ paddingLeft: '40px' }}
              value={filters.search}
              placeholder="Search event summary, actor, or target UUID"
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <select value={filters.module} onChange={(event) => handleFilterChange("module", event.target.value)}>
            {MODULE_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? `Module: ${option}` : "All Modules"}
              </option>
            ))}
          </select>
          <select value={filters.action} onChange={(event) => handleFilterChange("action", event.target.value)}>
            {ACTION_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? `Action: ${option}` : "All Actions"}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <Database className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Querying audit records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Audit database connection timeout.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
          <TerminalIcon className="stream-icon-glow" style={{ marginBottom: '20px' }} />
          <p>Zero matching events found in active logs.</p>
        </div>
      ) : (
        <div className="stream-card-pro" style={{ padding: '0' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity size={20} color="var(--admin-accent-primary)" />
              Sequential Log Stream
            </h3>
          </div>
          <div className="stream-list-pro">
            {logs.map((log) => (
              <button
                key={log.id}
                type="button"
                className="stream-item-pro admin-stream-item-button"
                style={{ padding: '24px 32px', width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
                onClick={() => setDetailLog(log)}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div className="card-icon-box" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                    <TerminalIcon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{log.summary || `${log.moduleName} ${log.actionName}`}</strong>
                      <div className="admin-user-status" style={{ gap: '8px' }}>
                        <span className="feed-badge" style={{ fontSize: '0.6rem' }}>{log.moduleName}</span>
                        <span className="status-pill status-active" style={{ fontSize: '0.6rem', background: 'rgba(0, 209, 255, 0.1)', color: '#00d1ff' }}>{log.actionName}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span className="stream-meta-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} />
                        {log.actor?.username || "System Actor"}
                      </span>
                      <span className="stream-meta-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        {formatDate(log.createdAt)}
                      </span>
                      <span className="stream-meta-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={14} />
                        PID: {log.targetType || "N/A"}{log.targetId ? `:${log.targetId}` : ""}
                      </span>
                    </div>
                    {log.metadata && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--admin-accent-primary)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--admin-text-dim)' }}>
                          {log.metadata}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="icon-btn-pro" style={{ width: '32px', height: '32px' }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {detailLog && <AdminEntryDetailModal entryType="AUDIT_LOG" item={detailLog} onClose={() => setDetailLog(null)} />}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={page === 0}
          >
            Rewind Block
          </button>
          <span className="stream-meta-label">
            Block {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages}
          >
            Forward Block
          </button>
        </div>
      )}
    </div>
  );
}
