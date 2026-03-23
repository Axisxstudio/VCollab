import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Clock,
  Database,
  Eye,
  Filter,
  Search,
  ShieldAlert,
  Tag,
  Terminal as TerminalIcon,
  User
} from "lucide-react";
import AdminEntryDetailModal from "../../components/admin/AdminEntryDetailModal";
import { listAdminAuditLogs } from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";
import "../../styles/admin-table.css";

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

const ACTION_TONE = {
  CREATED: "success",
  RESTORED: "success",
  STATUS_UPDATED: "",
  MODERATION_UPDATED: "",
  UPDATED: "",
  TOGGLED: "",
  SOFT_DELETED: "danger",
  DEFAULT: ""
};

const PAGE_SIZE = 20;

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState({ search: "", module: "", action: "" });
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
  const totalElements = data?.totalElements || logs.length;

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Sequential Audit Database</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>Audit Logs</h1>
          <p className="admin-page-description">
            Full sequential record of all administrative actions — actor, module, action type, target, and timestamp.
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="card admin-filter-panel">
        <div className="admin-filter-grid">
          <div style={{ position: "relative", gridColumn: "span 2" }}>
            <Search className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <input
              type="text" className="admin-search-input" style={{ paddingLeft: "40px" }}
              value={filters.search} placeholder="Search event summary, actor, or target UUID"
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Filter className="admin-search-icon" size={18} style={{ left: "12px" }} />
            <select value={filters.module} style={{ paddingLeft: "40px" }} onChange={(event) => handleFilterChange("module", event.target.value)}>
              {MODULE_OPTIONS.map((option) => (
                <option key={option || "all"} value={option}>{option ? `Module: ${option}` : "All Modules"}</option>
              ))}
            </select>
          </div>
          <select value={filters.action} onChange={(event) => handleFilterChange("action", event.target.value)}>
            {ACTION_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>{option ? `Action: ${option}` : "All Actions"}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Table */}
      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <Database className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Querying audit records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <ShieldAlert className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Audit database connection timeout.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Summary</th>
                <th>Module</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-empty">
                      <TerminalIcon size={36} />
                      Zero matching events found in active logs.
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionTone = ACTION_TONE[log.actionName] || ACTION_TONE.DEFAULT;

                  return (
                    <tr key={log.id}>
                      {/* ID */}
                      <td><span className="admin-table-mono">#{log.id}</span></td>

                      {/* Summary */}
                      <td style={{ minWidth: 220 }}>
                        <div className="admin-table-title">{log.summary || `${log.moduleName} ${log.actionName}`}</div>
                        {log.metadata && (
                          <div className="admin-table-sub" style={{ maxWidth: 240, whiteSpace: "normal", marginTop: 2, fontFamily: "monospace" }}>
                            {log.metadata.length > 80 ? `${log.metadata.slice(0, 80)}…` : log.metadata}
                          </div>
                        )}
                      </td>

                      {/* Module */}
                      <td>
                        <span className="admin-table-badge"><TerminalIcon size={11} />{log.moduleName}</span>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={`admin-table-badge ${actionTone ? `admin-table-badge--${actionTone}` : ""}`}>
                          <Activity size={11} />{log.actionName}
                        </span>
                      </td>

                      {/* Actor */}
                      <td style={{ fontSize: "0.82rem", color: "#6b7f95" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <User size={13} />{log.actor?.username || "System"}
                        </span>
                      </td>

                      {/* Target */}
                      <td>
                        {log.targetType
                          ? <span className="admin-table-badge"><Tag size={11} />{log.targetType}{log.targetId ? ` #${log.targetId}` : ""}</span>
                          : <span style={{ color: "#aab5c2" }}>—</span>}
                      </td>

                      {/* Timestamp */}
                      <td style={{ whiteSpace: "nowrap", color: "#788fa5", fontSize: "0.78rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} />{formatDate(log.createdAt)}</span>
                      </td>

                      {/* View */}
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-icon-btn" onClick={() => setDetailLog(log)} title="View details" aria-label="View details">
                            <Eye size={15} />
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
              <span className="admin-table-pagination__meta">Page {page + 1} of {totalPages} · {totalElements} events</span>
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

      {detailLog && <AdminEntryDetailModal entryType="AUDIT_LOG" item={detailLog} onClose={() => setDetailLog(null)} />}
    </div>
  );
}
