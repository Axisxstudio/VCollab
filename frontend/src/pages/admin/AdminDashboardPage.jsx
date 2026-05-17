import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BookOpenText,
  CirclePlus,
  FileDown,
  FolderKanban,
  History,
  LayoutTemplate,
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
import "../../styles/admin-dashboard.css";
import { formatDate } from "../../utils/discovery";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const QUICK_CREATE_ACTIONS = [
  {
    title: "Create project",
    description: "Publish a new project record",
    to: routes.projectCreate,
    icon: FolderKanban
  },
  {
    title: "Create post",
    description: "Share a platform update",
    to: routes.postCreate,
    icon: NotebookTabs
  },
  {
    title: "Create blog",
    description: "Draft a new long-form article",
    to: routes.blogCreate,
    icon: BookOpenText
  }
];

const DASHBOARD_ACTIONS = [
  {
    title: "Exports",
    to: routes.adminExports,
    icon: FileDown
  },
  {
    title: "Users",
    to: routes.adminUsers,
    icon: Users
  },
  {
    title: "Audit",
    to: routes.adminAuditLogs,
    icon: History
  },
  {
    title: "CMS",
    to: routes.adminCmsBlocks,
    icon: LayoutTemplate
  }
];

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export default function AdminDashboardPage() {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const quickCreateRef = useRef(null);

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
      .slice(0, 6);
  }, [reportsData, warningsData]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target)) {
        setQuickCreateOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setQuickCreateOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const summaryCards = [
    {
      key: "users",
      label: "Platform users",
      value: summary?.totalUsers ?? 0,
      helper: `${summary?.activeUsers ?? 0} active / ${summary?.suspendedUsers ?? 0} suspended`,
      icon: Users,
      tone: "primary",
      to: routes.adminUsers
    },
    {
      key: "projects",
      label: "Projects",
      value: summary?.totalProjects ?? 0,
      helper: "All tracked project records",
      icon: FolderKanban,
      tone: "secondary",
      to: routes.adminProjects
    },
    {
      key: "content",
      label: "Posts and blogs",
      value: (summary?.totalPosts ?? 0) + (summary?.totalBlogs ?? 0),
      helper: `${summary?.totalPosts ?? 0} posts / ${summary?.totalBlogs ?? 0} blogs`,
      icon: NotebookTabs,
      tone: "accent",
      to: routes.adminPosts
    },
    {
      key: "moderation",
      label: "Open moderation items",
      value: (summary?.pendingReports ?? 0) + (summary?.openWarnings ?? 0),
      helper: `${summary?.pendingReports ?? 0} reports · ${summary?.openWarnings ?? 0} warnings`,
      icon: ShieldAlert,
      tone: "warning",
      to: routes.adminReports
    }
  ];

  const focusCards = [
    {
      key: "pendingReports",
      label: "Pending reports",
      value: summary?.pendingReports ?? 0,
      helper: "Needs review",
      icon: ShieldAlert,
      tone: "warning",
      to: routes.adminReports
    },
    {
      key: "openWarnings",
      label: "Open warnings",
      value: summary?.openWarnings ?? 0,
      helper: "User follow-up",
      icon: TriangleAlert,
      tone: "accent",
      to: routes.adminWarnings
    },
    {
      key: "activeUsers",
      label: "Active users",
      value: summary?.activeUsers ?? 0,
      helper: "Accounts in good standing",
      icon: Users,
      tone: "primary",
      to: routes.adminUsers
    },
    {
      key: "suspendedUsers",
      label: "Suspended users",
      value: summary?.suspendedUsers ?? 0,
      helper: "Restricted access",
      icon: Activity,
      tone: "secondary",
      to: routes.adminUsers
    }
  ];

  if (isLoading) {
    return (
      <div className="admin-dashboard-panel admin-dashboard-state-card">
        <Activity className="stream-icon-glow" style={{ marginBottom: "20px" }} />
        <p>Loading live administrative data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-v2 admin-pro-stack admin-page-stack">
      <section className="admin-dashboard-masthead">
        <div className="admin-dashboard-masthead__copy">
          <span className="admin-dashboard-kicker">Compact command center</span>
          <h1>Operational snapshot</h1>
        </div>

        <div className="admin-dashboard-masthead__signals">
          <span className="admin-dashboard-signal-pill">
            <Activity size={14} />
            Auto refresh every 15s
          </span>
          <span className="admin-dashboard-signal-pill">
            <ShieldAlert size={14} />
            Moderation queues in view
          </span>
        </div>
      </section>

      <section className="admin-dashboard-stat-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.key} className={`admin-dashboard-stat-card admin-dashboard-stat-card--${card.tone}`}>
              <div className="admin-dashboard-stat-card__top">
                <span className="admin-dashboard-stat-card__label">{card.label}</span>
                <Link
                  to={card.to}
                  className="admin-dashboard-icon-button admin-dashboard-icon-button--ghost"
                  title={`Open ${card.label}`}
                  aria-label={`Open ${card.label}`}
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="admin-dashboard-stat-card__value-row">
                <strong className="admin-dashboard-stat-card__value">{formatCount(card.value)}</strong>
                <span className={`admin-dashboard-stat-card__icon admin-dashboard-stat-card__icon--${card.tone}`}>
                  <Icon size={18} />
                </span>
              </div>

              <p className="admin-dashboard-stat-card__helper">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <div className="admin-dashboard-layout">
        <section className="admin-dashboard-panel admin-dashboard-panel--activity">
          <div className="admin-dashboard-panel__header">
            <div className="admin-dashboard-panel__title-block">
              <span className="admin-dashboard-panel__eyebrow">Recent signals</span>
            </div>

            <Link
              to={routes.adminAuditLogs}
              className="admin-dashboard-icon-button admin-dashboard-icon-button--ghost"
              title="View audit logs"
              aria-label="View audit logs"
            >
              <History size={18} />
            </Link>
          </div>

          <div className="admin-dashboard-activity-list">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <Link key={item.id} to={item.link} className="admin-dashboard-activity-item">
                  <div className="admin-dashboard-activity-item__lead">
                    <span
                      className={`admin-dashboard-activity-item__icon admin-dashboard-activity-item__icon--${item.type.toLowerCase()}`}
                    >
                      {item.type === "Warning" ? <TriangleAlert size={16} /> : <ShieldAlert size={16} />}
                    </span>

                    <div className="admin-dashboard-activity-item__copy">
                      <span className="admin-dashboard-activity-item__title">{item.title}</span>
                      <span className="admin-dashboard-activity-item__sub">{item.type}</span>
                      <span className="admin-dashboard-activity-item__description">{item.description}</span>
                    </div>
                  </div>

                  <div className="admin-dashboard-activity-item__meta">
                    <span className={`admin-dashboard-status-chip ${item.type === "Warning" ? "warning" : "report"}`}>
                      {item.status}
                    </span>
                    <span className="admin-dashboard-activity-item__date">{formatDate(item.createdAt)}</span>
                    <span className="admin-dashboard-activity-item__jump">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="admin-dashboard-empty-state">
                <TriangleAlert size={20} />
                <span>No reports or warnings need attention right now.</span>
              </div>
            )}
          </div>
        </section>

        <div className="admin-dashboard-side-stack">
          <section className="admin-dashboard-panel admin-dashboard-panel--actions">
            <div className="admin-dashboard-panel__header">
              <div className="admin-dashboard-panel__title-block">
                <span className="admin-dashboard-panel__eyebrow">Quick actions</span>
              </div>
            </div>

            <div className="admin-dashboard-action-row">
              <div
                ref={quickCreateRef}
                className={`admin-dashboard-create-dock ${quickCreateOpen ? "is-open" : ""}`}
                onMouseEnter={() => setQuickCreateOpen(true)}
                onMouseLeave={() => setQuickCreateOpen(false)}
                onFocus={() => setQuickCreateOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setQuickCreateOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  className="admin-dashboard-icon-button admin-dashboard-icon-button--primary"
                  aria-haspopup="menu"
                  aria-expanded={quickCreateOpen}
                  aria-label="Open create content options"
                  title="Create content"
                  onClick={() => setQuickCreateOpen((previous) => !previous)}
                >
                  <CirclePlus size={18} />
                  <span className="admin-dashboard-sr-only">Create content</span>
                </button>

                <div className="admin-dashboard-create-menu" role="menu" aria-label="Create content options">
                  {QUICK_CREATE_ACTIONS.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="admin-dashboard-create-option"
                        role="menuitem"
                        onClick={() => setQuickCreateOpen(false)}
                      >
                        <span className="admin-dashboard-create-option__icon">
                          <Icon size={16} />
                        </span>
                        <span className="admin-dashboard-create-option__copy">
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {DASHBOARD_ACTIONS.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="admin-dashboard-utility-link"
                    title={item.title}
                    aria-label={item.title}
                  >
                    <span className="admin-dashboard-icon-button admin-dashboard-icon-button--ghost">
                      <Icon size={18} />
                    </span>
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__header">
              <div className="admin-dashboard-panel__title-block">
                <span className="admin-dashboard-panel__eyebrow">Priority counters</span>
              </div>
            </div>

            <div className="admin-dashboard-focus-grid">
              {focusCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`admin-dashboard-focus-card admin-dashboard-focus-card--${item.tone}`}
                  >
                    <span className={`admin-dashboard-focus-card__icon admin-dashboard-focus-card__icon--${item.tone}`}>
                      <Icon size={16} />
                    </span>
                    <strong>{formatCount(item.value)}</strong>
                    <span>{item.label}</span>
                    <small>{item.helper}</small>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
