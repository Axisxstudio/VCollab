import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BookOpenText,
  CirclePlus,
  FileDown,
  FolderKanban,
  NotebookTabs,
  ShieldAlert,
  TriangleAlert,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import {
  getAdminDashboardSummary,
  listAdminReports,
  listAdminWarnings
} from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const QUICK_ACTIONS = [
  {
    title: "Create project",
    description: "Publish a new project with one or more images from the admin workspace.",
    to: routes.projectCreate,
    icon: FolderKanban
  },
  {
    title: "Create post",
    description: "Share announcements or updates with rich media and immediate visibility.",
    to: routes.postCreate,
    icon: NotebookTabs
  },
  {
    title: "Create blog",
    description: "Draft a professional article with cover media and additional attachments.",
    to: routes.blogCreate,
    icon: BookOpenText
  },
  {
    title: "Export records",
    description: "Download PDF records for audits, moderation reviews, and reporting.",
    to: routes.adminExports,
    icon: FileDown
  }
];

export default function AdminDashboardPage() {
  useFeedUpdates({
    queryKeys: [["admin", "summary"], ["admin", "reports", "preview"], ["admin", "warnings", "preview"]]
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: getAdminDashboardSummary,
    refetchInterval: 15000
  });

  const { data: reportsData } = useQuery({
    queryKey: ["admin", "reports", "preview"],
    queryFn: () => listAdminReports({ page: 0, size: 5, sort: "createdAt,desc" }),
    refetchInterval: 15000
  });

  const { data: warningsData } = useQuery({
    queryKey: ["admin", "warnings", "preview"],
    queryFn: () => listAdminWarnings({ page: 0, size: 5, sort: "createdAt,desc" }),
    refetchInterval: 15000
  });

  const activityItems = useMemo(() => {
    const reports = (reportsData?.content || []).map((item) => ({
      id: `report-${item.id}`,
      type: "Report",
      title: item.reason || "Content report",
      description: `${item.contentType} #${item.contentId}`,
      status: item.status,
      createdAt: item.createdAt,
      link: routes.adminReports
    }));

    const warnings = (warningsData?.content || []).map((item) => ({
      id: `warning-${item.id}`,
      type: "Warning",
      title: item.title || "User warning",
      description: item.target?.username ? `@${item.target.username}` : "User account",
      status: item.status,
      createdAt: item.createdAt,
      link: routes.adminWarnings
    }));

    return [...reports, ...warnings]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 8);
  }, [reportsData, warningsData]);

  const summaryCards = [
    {
      key: "users",
      label: "Platform users",
      value: summary?.totalUsers ?? 0,
      helper: `${summary?.activeUsers ?? 0} active · ${summary?.suspendedUsers ?? 0} suspended`,
      icon: Users,
      tone: "primary"
    },
    {
      key: "projects",
      label: "Projects",
      value: summary?.totalProjects ?? 0,
      helper: "All tracked project records",
      icon: FolderKanban,
      tone: "secondary"
    },
    {
      key: "content",
      label: "Posts and blogs",
      value: (summary?.totalPosts ?? 0) + (summary?.totalBlogs ?? 0),
      helper: `${summary?.totalPosts ?? 0} posts · ${summary?.totalBlogs ?? 0} blogs`,
      icon: NotebookTabs,
      tone: "accent"
    },
    {
      key: "moderation",
      label: "Open moderation items",
      value: (summary?.pendingReports ?? 0) + (summary?.openWarnings ?? 0),
      helper: `${summary?.pendingReports ?? 0} reports · ${summary?.openWarnings ?? 0} warnings`,
      icon: ShieldAlert,
      tone: "warning"
    }
  ];

  if (isLoading) {
    return (
      <div className="summary-card-pro admin-state-card">
        <Activity className="stream-icon-glow" style={{ marginBottom: "20px" }} />
        <p>Loading live administrative data...</p>
      </div>
    );
  }

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Live administrative overview</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>Operational snapshot</h1>
          <p className="admin-page-description">
            Monitor users, published content, moderation load, and exports from a clean real-time dashboard.
          </p>
        </div>
        <div className="header-btn-group">
          <Link to={routes.adminExports} className="btn-glass">
            <FileDown size={16} />
            Export Center
          </Link>
          <Link to={routes.adminUsers} className="btn-glow-danger admin-primary-link">
            <CirclePlus size={16} />
            Manage Users
          </Link>
        </div>
      </div>

      <div className="admin-card-grid-pro admin-summary-grid-pro">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.key} className={`summary-card-pro summary-card-pro--${card.tone}`}>
              <div className="card-value-row">
                <div>
                  <span className="card-label-pro">{card.label}</span>
                  <strong className="card-value-pro">{card.value}</strong>
                </div>
                <div className={`card-icon-box ${card.tone}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="card-trend-pro">
                <span className="trend-percent trend-percent--neutral">Updated automatically</span>
                <span className="trend-meta">{card.helper}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="stream-section-pro admin-dashboard-grid">
        <section className="stream-card-pro">
          <div className="stream-header-pro">
            <div className="stream-title-box">
              <Activity className="stream-icon-glow" size={24} />
              <div>
                <h3>Recent administrative activity</h3>
                <span className="stream-meta-label">Reports and warnings sorted by latest action</span>
              </div>
            </div>
            <Link to={routes.adminAuditLogs} className="btn-glass admin-inline-link">
              View audit logs
            </Link>
          </div>

          <div className="stream-list-pro">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <Link key={item.id} to={item.link} className="stream-item-pro admin-activity-link">
                  <div className="stream-item-info">
                    <span className="stream-item-title">{item.title}</span>
                    <span className="stream-item-sub">
                      {item.type} · {item.description}
                    </span>
                  </div>
                  <div className="admin-activity-meta">
                    <span className={`status-pill ${item.type === "Warning" ? "status-inactive" : "status-active"}`}>
                      {item.status}
                    </span>
                    <span className="stream-meta-label">{formatDate(item.createdAt)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="admin-empty-state">
                <TriangleAlert size={20} />
                <span>No reports or warnings need attention right now.</span>
              </div>
            )}
          </div>
        </section>

        <section className="stream-card-pro admin-dashboard-side-panel">
          <div className="stream-header-pro">
            <div className="stream-title-box">
              <ShieldAlert className="stream-icon-glow" size={24} />
              <div>
                <h3>Quick actions</h3>
                <span className="stream-meta-label">Create, review, and export from one place</span>
              </div>
            </div>
          </div>

          <div className="admin-quick-action-grid">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="admin-quick-action-card">
                  <div className="card-icon-box secondary">
                    <Icon size={20} />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
