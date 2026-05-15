import { useMemo, useState } from "react";
import { Clock3, Inbox, SendHorizontal } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listReceivedProjectRequests,
  listSentProjectRequests,
  updateProjectRequestStatus
} from "../../services/projectrequest.service";
import { formatTimeAgo } from "../../utils/date";

const STATUS_LABELS = {
  PENDING: "Pending review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected"
};

function RequestCard({ request, direction, onStatus }) {
  const profile = direction === "received" ? request.requester : request.owner;
  const canRespond = direction === "received" && request.status === "PENDING";
  const initials = (profile?.fullName || profile?.username || "V").charAt(0).toUpperCase();

  return (
    <article className="request-upgrade-card">
      <div className="request-upgrade-card__topline">
        <span className={`status-pill status-pill--${request.status.toLowerCase()}`}>
          {STATUS_LABELS[request.status] || request.status}
        </span>
        <span className="comment-muted">{formatTimeAgo(request.createdAt)}</span>
      </div>

      <div className="request-upgrade-card__identity">
        <div className="request-upgrade-card__avatar">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt={profile.fullName || profile.username} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <strong>{profile?.fullName || profile?.username || "VCollab member"}</strong>
          <p>{direction === "received" ? "Requested access to your project" : "Project owner"} </p>
        </div>
      </div>

      <div className="request-upgrade-card__body">
        <h4>{request.project?.title || "Untitled project"}</h4>
        <p>{request.message || "No message was included with this request."}</p>
      </div>

      <div className="request-upgrade-card__meta">
        <span>Project ID #{request.project?.id}</span>
        {request.respondedAt && <span>Responded {formatTimeAgo(request.respondedAt)}</span>}
      </div>

      {canRespond && (
        <div className="request-upgrade-card__actions">
          <button className="btn-primary" type="button" onClick={() => onStatus(request.id, "ACCEPTED")}>
            Accept request
          </button>
          <button className="btn-outline" type="button" onClick={() => onStatus(request.id, "REJECTED")}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}

export default function ProjectRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("received");

  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ["project-requests", "sent"],
    queryFn: listSentProjectRequests
  });

  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["project-requests", "received"],
    queryFn: listReceivedProjectRequests
  });

  const summary = useMemo(() => ({
    received: received.length,
    sent: sent.length,
    pending: [...received, ...sent].filter((request) => request.status === "PENDING").length
  }), [received, sent]);

  const handleStatus = async (id, status) => {
    await updateProjectRequestStatus(id, status);
    await queryClient.invalidateQueries({ queryKey: ["project-requests", "received"] });
    await queryClient.invalidateQueries({ queryKey: ["project-requests", "sent"] });
  };

  return (
    <div className="collab-page project-requests-page">
      <section className="collab-page__hero">
        <div>
          <span className="collab-page__eyebrow">VCollab Workflow</span>
          <h2 className="collab-page__title">Project Requests</h2>
        </div>
      </section>

      <section className="collab-stat-grid">
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><Inbox size={18} /></span>
          <div>
            <strong>{summary.received}</strong>
            <span>Incoming</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><SendHorizontal size={18} /></span>
          <div>
            <strong>{summary.sent}</strong>
            <span>Sent</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><Clock3 size={18} /></span>
          <div>
            <strong>{summary.pending}</strong>
            <span>Pending</span>
          </div>
        </article>
      </section>

      <div className="request-toggle" role="tablist" aria-label="Project request views">
        <button
          type="button"
          className={`request-toggle__button ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
          role="tab"
          aria-selected={activeTab === "received"}
        >
          Received
        </button>
        <button
          type="button"
          className={`request-toggle__button ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
          role="tab"
          aria-selected={activeTab === "sent"}
        >
          Sent
        </button>
      </div>

      <div className="requests-board requests-board--toggle">
        {activeTab === "received" && (
        <section className="collab-surface">
          <div className="collab-surface__header">
            <div>
              <h3>Received</h3>
              <p>Requests that need your attention.</p>
            </div>
            <span className="collab-pill">{received.length}</span>
          </div>

          {loadingReceived && <div className="collab-empty-panel slim">Loading received requests...</div>}

          {!loadingReceived && received.length === 0 && (
            <div className="collab-empty-panel slim">
              <h3>No incoming requests</h3>
              <p>When collaborators request access to your projects, they will appear here.</p>
            </div>
          )}

          {!loadingReceived && received.length > 0 && (
            <div className="request-upgrade-grid">
              {received.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  direction="received"
                  onStatus={handleStatus}
                />
              ))}
            </div>
          )}
        </section>
        )}

        {activeTab === "sent" && (
        <section className="collab-surface">
          <div className="collab-surface__header">
            <div>
              <h3>Sent</h3>
              <p>Requests you are currently waiting on.</p>
            </div>
            <span className="collab-pill">{sent.length}</span>
          </div>

          {loadingSent && <div className="collab-empty-panel slim">Loading sent requests...</div>}

          {!loadingSent && sent.length === 0 && (
            <div className="collab-empty-panel slim">
              <h3>No outgoing requests</h3>
              <p>Your sent collaboration requests will stay visible here until owners respond.</p>
            </div>
          )}

          {!loadingSent && sent.length > 0 && (
            <div className="request-upgrade-grid">
              {sent.map((request) => (
                <RequestCard key={request.id} request={request} direction="sent" onStatus={handleStatus} />
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </div>
  );
}
