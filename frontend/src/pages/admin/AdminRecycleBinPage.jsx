import { useMemo, useState } from "react";
import { Trash2, Folder, MessageSquare, BookOpen, Users, ShieldAlert, Bell, MessageCircle, MessagesSquare } from "lucide-react";
import AdminContentManager from "../../components/admin/AdminContentManager";
import AdminRecycleRecordList from "../../components/admin/AdminRecycleRecordList";
import {
  deleteAdminBlog,
  deleteAdminPost,
  deleteAdminProject,
  listAdminBlogs,
  listAdminPosts,
  listAdminProjects,
  restoreAdminBlog,
  restoreAdminPost,
  restoreAdminProject,
  updateAdminBlogModeration,
  updateAdminPostModeration,
  updateAdminProjectModeration
} from "../../services/admin.service";

const RECYCLE_TABS = [
  {
    kind: "content",
    value: "PROJECT",
    label: "Projects",
    icon: Folder,
    listFn: listAdminProjects,
    updateFn: updateAdminProjectModeration,
    deleteFn: deleteAdminProject,
    restoreFn: restoreAdminProject
  },
  {
    kind: "content",
    value: "POST",
    label: "Posts",
    icon: MessageSquare,
    listFn: listAdminPosts,
    updateFn: updateAdminPostModeration,
    deleteFn: deleteAdminPost,
    restoreFn: restoreAdminPost
  },
  {
    kind: "content",
    value: "BLOG",
    label: "Blogs",
    icon: BookOpen,
    listFn: listAdminBlogs,
    updateFn: updateAdminBlogModeration,
    deleteFn: deleteAdminBlog,
    restoreFn: restoreAdminBlog
  },
  {
    kind: "record",
    value: "USER",
    label: "Users",
    icon: Users
  },
  {
    kind: "record",
    value: "REPORT",
    label: "Reports",
    icon: ShieldAlert
  },
  {
    kind: "record",
    value: "WARNING",
    label: "Warnings",
    icon: ShieldAlert
  },
  {
    kind: "record",
    value: "MESSAGE",
    label: "Messages",
    icon: MessagesSquare
  },
  {
    kind: "record",
    value: "NOTIFICATION",
    label: "Notifications",
    icon: Bell
  },
  {
    kind: "record",
    value: "COMMENT",
    label: "Comments",
    icon: MessageCircle
  }
];

export default function AdminRecycleBinPage() {
  const [activeTab, setActiveTab] = useState(RECYCLE_TABS[0].value);
  const currentTab = useMemo(
    () => RECYCLE_TABS.find((tab) => tab.value === activeTab) || RECYCLE_TABS[0],
    [activeTab]
  );

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Asset Decommissioning Registry</div>
      
      <div className="command-center-header">
        <h1>Recycle Bin</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(255, 59, 92, 0.1)', color: '#ff3b5c' }}>
            Retention Storage
          </span>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '32px' }}>
        <div style={{ padding: '24px 24px 0', borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Trash2 size={20} color="var(--admin-accent-primary)" />
            <h3 style={{ margin: 0 }}>Storage Sectors</h3>
          </div>
          <p className="stream-meta-label">Review decommissioned content before permanent extraction.</p>
          
          <div className="admin-tab-row" style={{ marginTop: '24px', border: 'none', gap: '8px' }}>
            {RECYCLE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`admin-pro-nav-item ${activeTab === tab.value ? "active" : ""}`}
                  style={{ 
                    background: activeTab === tab.value ? 'rgba(255, 59, 92, 0.1)' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.value ? '2px solid var(--admin-accent-primary)' : '2px solid transparent',
                    borderRadius: '8px 8px 0 0',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: activeTab === tab.value ? 'var(--admin-accent-primary)' : 'var(--admin-text-dim)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 700
                  }}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {currentTab.kind === "content" ? (
        <AdminContentManager
          key={currentTab.value}
          title={`${currentTab.label} Archive`}
          description="Only soft-deleted content appears here. Restore carefully so visibility and active-state rules stay consistent."
          contentType={currentTab.value}
          queryKeyPrefix={["admin", "recycle-bin", currentTab.value.toLowerCase()]}
          listFn={currentTab.listFn}
          updateFn={currentTab.updateFn}
          deleteFn={currentTab.deleteFn}
          restoreFn={currentTab.restoreFn}
          deletedMode
        />
      ) : (
        <AdminRecycleRecordList
          key={currentTab.value}
          entityType={currentTab.value}
          title={`${currentTab.label} Archive`}
          description="Deleted operational records remain recoverable here so moderation and collaboration history stay auditable."
        />
      )}
    </div>
  );
}
