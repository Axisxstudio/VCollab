import { useState } from "react";
import { 
  FileDown, 
  Users, 
  Folder, 
  MessageSquare, 
  BookOpen, 
  ShieldAlert, 
  AlertTriangle, 
  Trash2, 
  Database,
  Search,
  CheckCircle,
  Activity
} from "lucide-react";
import { downloadAdminPdfExport } from "../../services/admin.service";

const ROLE_OPTIONS = ["", "STUDENT", "INDUSTRIAL_EXPERT", "SOFTWARE_ENGINEER"];
const REPORT_STATUS_OPTIONS = ["", "PENDING", "REVIEWED", "ACTION_TAKEN", "DISMISSED"];
const WARNING_STATUS_OPTIONS = ["", "SENT", "ACKNOWLEDGED"];
const RECYCLE_TYPES = ["", "PROJECT", "POST", "BLOG"];
const AUDIT_MODULES = ["", "USER", "PROJECT", "POST", "BLOG", "REPORT", "WARNING", "CATEGORY"];
const AUDIT_ACTIONS = ["", "STATUS_UPDATED", "MODERATION_UPDATED", "SOFT_DELETED", "RESTORED", "CREATED", "UPDATED", "TOGGLED"];

export default function AdminExportCenterPage() {
  const [busyKey, setBusyKey] = useState("");
  const [feedback, setFeedback] = useState("");
  const [userFilters, setUserFilters] = useState({ search: "", role: "" });
  const [projectFilters, setProjectFilters] = useState({ search: "" });
  const [postFilters, setPostFilters] = useState({ search: "" });
  const [blogFilters, setBlogFilters] = useState({ search: "" });
  const [reportFilters, setReportFilters] = useState({ status: "" });
  const [warningFilters, setWarningFilters] = useState({ status: "" });
  const [recycleFilters, setRecycleFilters] = useState({ contentType: "" });
  const [auditFilters, setAuditFilters] = useState({ module: "", action: "", search: "" });

  const handleDownload = async (key, module, params) => {
    setBusyKey(key);
    setFeedback("");
    try {
      await downloadAdminPdfExport(module, params);
      setFeedback(`PDF export for ${module} completed successfully.`);
    } catch (error) {
      setFeedback(error?.response?.data?.message || "The PDF export could not be completed right now.");
    } finally {
      setBusyKey("");
    }
  };

  const ExportCard = ({ title, icon: Icon, children, onExport, loading, color = "#00d1ff" }) => (
    <article className="card summary-card-pro" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="card-icon-box" style={{ width: '40px', height: '40px', background: `${color}15` }}>
          <Icon size={20} color={color} />
        </div>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </div>
      <div style={{ display: 'grid', gap: '12px', flex: 1 }}>
        {children}
      </div>
      <button
        type="button"
        className="btn-glow-danger"
        style={{ background: color, boxShadow: `0 0 15px ${color}40`, width: '100%', justifyContent: 'center' }}
        onClick={onExport}
        disabled={loading}
      >
        {loading ? <Activity size={16} className="spin" style={{ marginRight: '8px' }} /> : <FileDown size={16} style={{ marginRight: '8px' }} />}
        {loading ? "Preparing PDF..." : "Download PDF"}
      </button>
    </article>
  );

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Data Extraction & Intelligence Reporting</div>
      
      <div className="command-center-header">
        <h1>Export Center</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
            System Integrity Validated
          </span>
        </div>
      </div>

      <section className="card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="stream-meta-label" style={{ margin: 0 }}>
          Generate professional PDF exports for audits, moderation reviews, and offline administrative records.
        </p>
        {feedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.85rem' }}>
            <CheckCircle size={16} />
            {feedback}
          </div>
        )}
      </section>

      <div className="admin-entity-grid">
        <ExportCard 
          title="Entity Registry" 
          icon={Users} 
          color="#00d1ff"
          loading={busyKey === "users"}
          onExport={() => handleDownload("users", "users", userFilters)}
        >
          <input
            type="text"
            value={userFilters.search}
            placeholder="Search entities..."
            onChange={(event) => setUserFilters((p) => ({ ...p, search: event.target.value }))}
          />
          <select
            value={userFilters.role}
            onChange={(event) => setUserFilters((p) => ({ ...p, role: event.target.value }))}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All Protocols"}
              </option>
            ))}
          </select>
        </ExportCard>

        <ExportCard 
          title="Project Database" 
          icon={Folder} 
          color="#ff3b5c"
          loading={busyKey === "projects"}
          onExport={() => handleDownload("projects", "projects", projectFilters)}
        >
          <input
            type="text"
            value={projectFilters.search}
            placeholder="Search cluster..."
            onChange={(event) => setProjectFilters({ search: event.target.value })}
          />
        </ExportCard>

        <ExportCard 
          title="Stream Records" 
          icon={MessageSquare} 
          color="#ffb800"
          loading={busyKey === "posts"}
          onExport={() => handleDownload("posts", "posts", postFilters)}
        >
          <input
            type="text"
            value={postFilters.search}
            placeholder="Search stream..."
            onChange={(event) => setPostFilters({ search: event.target.value })}
          />
        </ExportCard>

        <ExportCard 
          title="Knowledge Base" 
          icon={BookOpen} 
          color="#8b5cf6"
          loading={busyKey === "blogs"}
          onExport={() => handleDownload("blogs", "blogs", blogFilters)}
        >
          <input
            type="text"
            value={blogFilters.search}
            placeholder="Search articles..."
            onChange={(event) => setBlogFilters({ search: event.target.value })}
          />
        </ExportCard>

        <ExportCard 
          title="Feedback Loop" 
          icon={ShieldAlert} 
          color="#f43f5e"
          loading={busyKey === "reports"}
          onExport={() => handleDownload("reports", "reports", reportFilters)}
        >
          <select
            value={reportFilters.status}
            onChange={(event) => setReportFilters({ status: event.target.value })}
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All Priorities"}
              </option>
            ))}
          </select>
        </ExportCard>

        <ExportCard 
          title="Protocol History" 
          icon={AlertTriangle} 
          color="#fb923c"
          loading={busyKey === "warnings"}
          onExport={() => handleDownload("warnings", "warnings", warningFilters)}
        >
          <select
            value={warningFilters.status}
            onChange={(event) => setWarningFilters({ status: event.target.value })}
          >
            {WARNING_STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All Classifications"}
              </option>
            ))}
          </select>
        </ExportCard>

        <ExportCard 
          title="Retention Archive" 
          icon={Trash2} 
          color="#94a3b8"
          loading={busyKey === "recycle-bin"}
          onExport={() => handleDownload("recycle-bin", "recycle-bin", recycleFilters)}
        >
          <select
            value={recycleFilters.contentType}
            onChange={(event) => setRecycleFilters({ contentType: event.target.value })}
          >
            {RECYCLE_TYPES.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All Asset Types"}
              </option>
            ))}
          </select>
        </ExportCard>

        <ExportCard 
          title="Sequential Audit" 
          icon={Database} 
          color="#10b981"
          loading={busyKey === "audit-logs"}
          onExport={() => handleDownload("audit-logs", "audit-logs", auditFilters)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select
              value={auditFilters.module}
              onChange={(event) => setAuditFilters((p) => ({ ...p, module: event.target.value }))}
            >
              {AUDIT_MODULES.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "Module: All"}
                </option>
              ))}
            </select>
            <select
              value={auditFilters.action}
              onChange={(event) => setAuditFilters((p) => ({ ...p, action: event.target.value }))}
            >
              {AUDIT_ACTIONS.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "Action: All"}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={auditFilters.search}
            placeholder="Search audit trail..."
            onChange={(event) => setAuditFilters((p) => ({ ...p, search: event.target.value }))}
          />
        </ExportCard>
      </div>
    </div>
  );
}

