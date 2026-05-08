import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Tag, 
  Power, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Settings2,
  Lock,
  Database
} from "lucide-react";
import { listAllCategories, toggleCategory } from "../../services/admin.service";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listAllCategories
  });

  const handleToggle = async (cat) => {
    setBusyId(cat.id);
    try {
      await toggleCategory(cat.id, !cat.active);
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="summary-card-pro" style={{ textAlign: 'center', padding: '100px' }}>
        <Database className="stream-icon-glow" style={{ marginBottom: '20px' }} />
        <p>Verifying category metadata...</p>
      </div>
    );
  }

  return (
    <div className="admin-pro-stack">
      <div className="live-status-badge">Taxonomy & Meta Governance</div>
      
      <div className="command-center-header">
        <h1>Internal Categories</h1>
        <div className="discovery-results-meta">
          <span className="trend-percent" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
            {data.length} Global Classes
          </span>
        </div>
      </div>

      <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings2 size={20} color="#00d1ff" />
            Class Management
          </h3>
          <p className="stream-meta-label" style={{ marginTop: '4px' }}>
            Control reusable discovery categories that appear throughout platform creation flows.
          </p>
        </div>
        
        <div className="stream-list-pro">
          <div className="stream-item-pro" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 24px', fontWeight: 800, fontSize: '0.7rem', color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 120px', gap: '20px', width: '100%' }}>
              <div>Class Name</div>
              <div>Sector</div>
              <div>Status</div>
              <div>Security</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
          </div>
          
          {data.map((cat) => (
            <div key={cat.id} className="stream-item-pro" style={{ padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 120px', gap: '20px', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="card-icon-box" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 209, 255, 0.1)' }}>
                    <Tag size={16} color="#00d1ff" />
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>{cat.name}</strong>
                </div>
                <div>
                  <span className="feed-badge" style={{ fontSize: '0.65rem' }}>{cat.type}</span>
                </div>
                <div>
                  <div className={`status-pill ${cat.active ? "status-active" : "status-inactive"}`} style={{ fontSize: '0.65rem' }}>
                    {cat.active ? "Operational" : "Offline"}
                  </div>
                </div>
                <div>
                  {cat.systemDefault ? (
                    <span className="stream-meta-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffb800' }}>
                      <Lock size={12} />
                      Immutable
                    </span>
                  ) : (
                    <span className="stream-meta-label">Custom Entity</span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn-glass"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    type="button"
                    onClick={() => handleToggle(cat)}
                    disabled={busyId === cat.id}
                  >
                    {busyId === cat.id ? <Activity size={12} className="spin" /> : (cat.active ? "Deactivate" : "Activate")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
