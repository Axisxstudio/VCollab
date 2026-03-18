import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acknowledgeWarning, listWarnings } from "../../services/warning.service";

export default function WarningsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["warnings"],
    queryFn: () => listWarnings({ page: 0, size: 20, sort: "createdAt,desc" })
  });

  const warnings = data?.content || [];

  const handleAck = async (id) => {
    await acknowledgeWarning(id);
    await queryClient.invalidateQueries({ queryKey: ["warnings"] });
  };

  return (
    <div className="section">
      <div className="project-actions">
        <div>
          <h2>Warnings</h2>
          <p className="profile-meta">Review moderation warnings issued to your account.</p>
        </div>
      </div>

      {isLoading && <div className="card">Loading warnings...</div>}
      {!isLoading && warnings.length === 0 && (
        <div className="card">No warnings at this time.</div>
      )}
      {!isLoading && warnings.length > 0 && (
        <div className="notification-list">
          {warnings.map((warning) => (
            <div key={warning.id} className={`card notification-row`}>
              <div className="notification-message">{warning.title}</div>
              <div className="comment-muted">{warning.message}</div>
              <div className="notification-meta">
                <span className="comment-muted">
                  {warning.createdAt ? new Date(warning.createdAt).toLocaleString() : ""}
                </span>
                {warning.status !== "ACKNOWLEDGED" && (
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={() => handleAck(warning.id)}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
