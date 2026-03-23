import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acknowledgeWarning, listWarnings } from "../../services/warning.service";
import { formatTimeAgo } from "../../utils/date";

function WarningCard({ warning, onAcknowledge }) {
  const initials = (warning.target?.fullName || warning.target?.username || "V").charAt(0).toUpperCase();
  const acknowledged = warning.status === "ACKNOWLEDGED";

  return (
    <article className={`warning-upgrade-card ${acknowledged ? "is-acknowledged" : "is-active"}`}>
      <div className="warning-upgrade-card__topline">
        <span className={`status-pill ${acknowledged ? "status-pill--acknowledged" : "status-pill--warning"}`}>
          {acknowledged ? "Acknowledged" : "Requires review"}
        </span>
        <span className="comment-muted">{formatTimeAgo(warning.createdAt)}</span>
      </div>

      <div className="warning-upgrade-card__identity">
        <div className="warning-upgrade-card__avatar">
          {warning.target?.profileImage ? (
            <img src={warning.target.profileImage} alt={warning.target.fullName || warning.target.username} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <strong>{warning.title}</strong>
          <p>{warning.contentType ? `${warning.contentType} reference` : "Account guidance"}</p>
        </div>
      </div>

      <div className="warning-upgrade-card__body">
        <p>{warning.message}</p>
        {warning.reason && (
          <div className="warning-upgrade-card__reason">
            <span>Reason</span>
            <strong>{warning.reason}</strong>
          </div>
        )}
      </div>

      <div className="warning-upgrade-card__footer">
        <span>
          {acknowledged && warning.acknowledgedAt
            ? `Acknowledged ${formatTimeAgo(warning.acknowledgedAt)}`
            : "Review and acknowledge to confirm you have seen this guidance."}
        </span>

        {!acknowledged && (
          <button className="btn-primary" type="button" onClick={() => onAcknowledge(warning.id)}>
            Acknowledge
          </button>
        )}
      </div>
    </article>
  );
}

export default function WarningsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["warnings"],
    queryFn: () => listWarnings({ page: 0, size: 20, sort: "createdAt,desc" })
  });

  const warnings = data?.content || [];
  const activeWarnings = warnings.filter((warning) => warning.status !== "ACKNOWLEDGED");
  const acknowledgedWarnings = warnings.filter((warning) => warning.status === "ACKNOWLEDGED");

  const handleAck = async (id) => {
    await acknowledgeWarning(id);
    await queryClient.invalidateQueries({ queryKey: ["warnings"] });
  };

  return (
    <div className="collab-page">
      <section className="collab-page__hero warning-hero">
        <div>
          <span className="collab-page__eyebrow">Moderation center</span>
          <h2 className="collab-page__title">Warnings & Alerts</h2>
          <p className="collab-page__subtitle">
            Review policy guidance, account alerts, and moderation notes in one clear place.
          </p>
        </div>
      </section>

      <section className="collab-stat-grid">
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><ShieldAlert size={18} /></span>
          <div>
            <strong>{warnings.length}</strong>
            <span>Total warnings</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>{activeWarnings.length}</strong>
            <span>Needs review</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><CheckCircle2 size={18} /></span>
          <div>
            <strong>{acknowledgedWarnings.length}</strong>
            <span>Acknowledged</span>
          </div>
        </article>
      </section>

      {isLoading && <div className="collab-empty-panel">Loading warnings...</div>}

      {!isLoading && warnings.length === 0 && (
        <div className="collab-empty-panel">
          <h3>No warnings at this time</h3>
          <p>Your account currently has no active moderation notes.</p>
        </div>
      )}

      {!isLoading && warnings.length > 0 && (
        <div className="warning-upgrade-grid">
          {warnings.map((warning) => (
            <WarningCard key={warning.id} warning={warning} onAcknowledge={handleAck} />
          ))}
        </div>
      )}
    </div>
  );
}
