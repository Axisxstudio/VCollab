import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listReceivedProjectRequests,
  listSentProjectRequests,
  updateProjectRequestStatus
} from "../../services/projectrequest.service";

export default function ProjectRequestsPage() {
  const queryClient = useQueryClient();
  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ["project-requests", "sent"],
    queryFn: listSentProjectRequests
  });
  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["project-requests", "received"],
    queryFn: listReceivedProjectRequests
  });

  const handleStatus = async (id, status) => {
    await updateProjectRequestStatus(id, status);
    await queryClient.invalidateQueries({ queryKey: ["project-requests", "received"] });
    await queryClient.invalidateQueries({ queryKey: ["project-requests", "sent"] });
  };

  return (
    <div className="section">
      <div className="project-actions">
        <div>
          <h2>Project Requests</h2>
          <p className="profile-meta">Manage requests you sent or received.</p>
        </div>
      </div>
      <div className="split">
        <div>
          <h3>Received</h3>
          {loadingReceived && <div className="comment-muted">Loading received requests...</div>}
          {!loadingReceived && received.length === 0 && (
            <div className="comment-muted">No incoming requests yet.</div>
          )}
          {!loadingReceived && received.length > 0 && (
            <div className="request-list">
              {received.map((request) => (
                <div key={request.id} className="card">
                  <div className="meta-row">
                    <span>{request.project?.title}</span>
                    <span>Status: {request.status}</span>
                  </div>
                  <p>{request.message || "No message provided."}</p>
                  <div className="meta-row">
                    <span>From: {request.requester?.fullName || request.requester?.username}</span>
                  </div>
                  <div className="action-bar">
                    <button
                      className="btn-outline"
                      type="button"
                      onClick={() => handleStatus(request.id, "ACCEPTED")}
                      disabled={request.status !== "PENDING"}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-outline"
                      type="button"
                      onClick={() => handleStatus(request.id, "REJECTED")}
                      disabled={request.status !== "PENDING"}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Sent</h3>
          {loadingSent && <div className="comment-muted">Loading sent requests...</div>}
          {!loadingSent && sent.length === 0 && (
            <div className="comment-muted">You have not sent any requests yet.</div>
          )}
          {!loadingSent && sent.length > 0 && (
            <div className="request-list">
              {sent.map((request) => (
                <div key={request.id} className="card">
                  <div className="meta-row">
                    <span>{request.project?.title}</span>
                    <span>Status: {request.status}</span>
                  </div>
                  <p>{request.message || "No message provided."}</p>
                  <div className="meta-row">
                    <span>Owner: {request.owner?.fullName || request.owner?.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
