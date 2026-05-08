import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Layout, 
  Plus, 
  Edit3, 
  Search, 
  Eye, 
  EyeOff, 
  Power, 
  Hash, 
  Type, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  Layers,
  Settings2,
  Database,
  Monitor,
  PenTool,
  MessageSquare
} from "lucide-react";
import {
  createAdminCmsBlock,
  listAdminCmsBlocks,
  updateAdminCmsBlock
} from "../../services/admin.service";
import { formatDate, truncateText } from "../../utils/discovery";

const initialForm = {
  sectionKey: "LANDING_INFO",
  title: "",
  subtitle: "",
  body: "",
  badge: "",
  ctaLabel: "",
  ctaUrl: "",
  themeTone: "brand",
  displayOrder: 0,
  active: true,
  publicVisible: true
};

export default function AdminCmsBlocksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    sectionKey: "",
    active: "",
    publicVisible: ""
  });
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const params = {
    page,
    size: 12,
    sort: "displayOrder,asc"
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.sectionKey.trim()) params.sectionKey = filters.sectionKey.trim();
  if (filters.active) params.active = filters.active === "true";
  if (filters.publicVisible) params.publicVisible = filters.publicVisible === "true";

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin",
      "cms-blocks",
      filters.search,
      filters.sectionKey,
      filters.active,
      filters.publicVisible,
      page
    ],
    queryFn: () => listAdminCmsBlocks(params)
  });

  const blocks = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setFeedback("");
  };

  const startEdit = (block) => {
    setEditingId(block.id);
    setForm({
      sectionKey: block.sectionKey || "LANDING_INFO",
      title: block.title || "",
      subtitle: block.subtitle || "",
      body: block.body || "",
      badge: block.badge || "",
      ctaLabel: block.ctaLabel || "",
      ctaUrl: block.ctaUrl || "",
      themeTone: block.themeTone || "brand",
      displayOrder: block.displayOrder || 0,
      active: block.active,
      publicVisible: block.publicVisible
    });
    setFeedback("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    const payload = {
      ...form,
      sectionKey: form.sectionKey.trim().toUpperCase().replace(/\s+/g, "_"),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      body: form.body.trim(),
      badge: form.badge.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaUrl: form.ctaUrl.trim(),
      themeTone: form.themeTone.trim(),
      displayOrder: Number(form.displayOrder) || 0
    };

    try {
      if (editingId) {
        await updateAdminCmsBlock(editingId, payload);
        setFeedback("CMS block deployment successful.");
      } else {
        await createAdminCmsBlock(payload);
        setFeedback("New functional block initialized.");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms-blocks"] });
      await queryClient.invalidateQueries({ queryKey: ["landing-overview"] });
      // Keep edit mode for a moment or reset
      if (!editingId) resetForm();
    } catch (error) {
      setFeedback(error?.response?.data?.message || "Internal system error during deployment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Content Engine & CMS Architecture</div>
      
      <div className="command-center-header">
        <h1>Page Builder</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: editingId ? 'rgba(255, 59, 92, 0.1)' : 'rgba(0, 209, 255, 0.1)', color: editingId ? '#ff3b5c' : '#00d1ff' }}>
            {editingId ? "MODIFICATION MODE" : "CREATION MODE"}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        <div className="admin-pro-stack" style={{ gap: '32px' }}>
          <section className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div className="card-icon-box" style={{ width: '40px', height: '40px' }}>
                <Edit3 size={20} color="var(--admin-accent-secondary)" />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{editingId ? "Modify Existing Core" : "Initialize New Functional Block"}</h3>
                <p className="stream-meta-label">Deploy interactive content modules across the platform facade.</p>
              </div>
            </div>

            <form className="admin-cms-pro-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group-pro">
                  <label>Section Index Key</label>
                  <div style={{ position: 'relative' }}>
                    <Database className="admin-search-icon" size={16} />
                    <input
                      type="text"
                      style={{ paddingLeft: '40px' }}
                      value={form.sectionKey}
                      placeholder="e.g. LANDING_HERO"
                      onChange={(event) => handleFormChange("sectionKey", event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group-pro">
                  <label>Component Badge</label>
                  <div style={{ position: 'relative' }}>
                    <Layers className="admin-search-icon" size={16} />
                    <input
                      type="text"
                      style={{ paddingLeft: '40px' }}
                      value={form.badge}
                      placeholder="e.g. New / Hot"
                      onChange={(event) => handleFormChange("badge", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group-pro">
                <label>Primary Title</label>
                <div style={{ position: 'relative' }}>
                  <Type className="admin-search-icon" size={16} />
                  <input
                    type="text"
                    style={{ paddingLeft: '40px' }}
                    value={form.title}
                    placeholder="Enter main heading..."
                    onChange={(event) => handleFormChange("title", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-pro">
                <label>Context Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  placeholder="Supporting secondary text..."
                  onChange={(event) => handleFormChange("subtitle", event.target.value)}
                />
              </div>

              <div className="form-group-pro">
                <label>Core Body Content</label>
                <textarea
                  rows="6"
                  value={form.body}
                  placeholder="Describe the functional highlight or informative content here..."
                  onChange={(event) => handleFormChange("body", event.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr 120px 120px', gap: '16px', alignItems: 'end' }}>
                <div className="form-group-pro">
                  <label>Action Label</label>
                  <input
                    type="text"
                    value={form.ctaLabel}
                    placeholder="Button text"
                    onChange={(event) => handleFormChange("ctaLabel", event.target.value)}
                  />
                </div>
                <div className="form-group-pro">
                  <label>Redirect URI</label>
                  <input
                    type="text"
                    value={form.ctaUrl}
                    placeholder="/explore..."
                    onChange={(event) => handleFormChange("ctaUrl", event.target.value)}
                  />
                </div>
                <div className="form-group-pro">
                  <label>Sequence</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(event) => handleFormChange("displayOrder", event.target.value)}
                  />
                </div>
                <div className="form-group-pro">
                  <label>Tone</label>
                  <input
                    type="text"
                    value={form.themeTone}
                    placeholder="brand"
                    onChange={(event) => handleFormChange("themeTone", event.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => handleFormChange("active", event.target.checked)}
                  />
                  Operational Status
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.publicVisible}
                    onChange={(event) => handleFormChange("publicVisible", event.target.checked)}
                  />
                  Public Routing
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="submit" className="btn-glow-danger" style={{ flex: 1, justifyContent: 'center', background: editingId ? 'var(--admin-accent-primary)' : '#00d1ff' }}>
                  <Save size={18} style={{ marginRight: '8px' }} />
                  {submitting ? "SYNCRONIZING..." : editingId ? "COMMIT UPDATE" : "DEPOY BLOCK"}
                </button>
                <button type="button" className="btn-glass" onClick={resetForm} disabled={submitting}>
                  <RotateCcw size={18} style={{ marginRight: '8px' }} />
                  RESET ARCHIVE
                </button>
              </div>

              {feedback && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '0.85rem', textAlign: 'center' }}>
                  {feedback}
                </div>
              )}
            </form>
          </section>

          <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Operational Block Database</h3>
                <p className="stream-meta-label">Total active modules in production environment.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search className="admin-search-icon" size={16} />
                  <input
                    type="text"
                    className="admin-search-input"
                    value={filters.search}
                    placeholder="Query ID/Title..."
                    onChange={(event) => handleFilterChange("search", event.target.value)}
                    style={{ width: '180px', paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </div>

            <div className="stream-list-pro">
              {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Database size={40} color="#00d1ff" className="spin" style={{ margin: '0 auto 16px' }} />
                  <p>Querying CMS core...</p>
                </div>
              ) : blocks.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Monitor size={40} color="var(--admin-text-dim)" style={{ margin: '0 auto 16px' }} />
                  <p>No functional blocks found in this sector.</p>
                </div>
              ) : (
                blocks.map((block) => (
                  <article key={block.id} className="stream-item-pro" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span className="feed-badge" style={{ fontSize: '0.65rem' }}>#{block.sectionKey}</span>
                          <h4 style={{ margin: 0 }}>{block.title}</h4>
                          <span className="stream-meta-label">ORD: {block.displayOrder}</span>
                        </div>
                        <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--admin-text-dim)' }}>
                          {truncateText(block.body, 140)}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div className={`status-pill ${block.active ? "status-active" : "status-inactive"}`} style={{ fontSize: '0.6rem' }}>
                            <Power size={10} style={{ marginRight: '4px' }} />
                            {block.active ? "ACTIVE" : "OFFLINE"}
                          </div>
                          <div className={`status-pill ${block.publicVisible ? "status-reviewed" : "status-dismissed"}`} style={{ fontSize: '0.6rem' }}>
                            {block.publicVisible ? <Eye size={10} style={{ marginRight: '4px' }} /> : <EyeOff size={10} style={{ marginRight: '4px' }} />}
                            {block.publicVisible ? "PUBLIC" : "DRAFT"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-glass" style={{ padding: '8px' }} onClick={() => startEdit(block)}>
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="discovery-pagination" style={{ padding: '16px' }}>
                <button
                  type="button"
                  className="btn-glass"
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  disabled={page === 0}
                >
                  Prev
                </button>
                <span className="stream-meta-label">Sector {page + 1}/{totalPages}</span>
                <button
                  type="button"
                  className="btn-glass"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="admin-pro-stack" style={{ gap: '24px' }}>
          <section className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={18} color="#00d1ff" />
              Live Filters
            </h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group-pro">
                <label>Section Index</label>
                <input
                  type="text"
                  value={filters.sectionKey}
                  placeholder="Filter by key..."
                  onChange={(event) => handleFilterChange("sectionKey", event.target.value)}
                />
              </div>
              <div className="form-group-pro">
                <label>Activity State</label>
                <select value={filters.active} onChange={(event) => handleFilterChange("active", event.target.value)}>
                  <option value="">All States</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-group-pro">
                <label>Visibility Protocol</label>
                <select
                  value={filters.publicVisible}
                  onChange={(event) => handleFilterChange("publicVisible", event.target.value)}
                >
                  <option value="">All Protocols</option>
                  <option value="true">Public Only</option>
                  <option value="false">Private Only</option>
                </select>
              </div>
            </div>
          </section>

          <div className="summary-card-pro" style={{ padding: '24px', borderLeft: '4px solid #ffb800' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <PenTool size={20} color="#ffb800" />
              <h5 style={{ margin: 0 }}>Content Strategy</h5>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-dim)', lineHeight: '1.4' }}>
              CMS blocks are atomic units of information. Use <strong>LANDING_INFO</strong> keys for general highlights and <strong>FOOTER_NOTICE</strong> for legals.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
