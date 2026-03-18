import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveX, Eye, RotateCcw, User } from "lucide-react";
import AdminEntryDetailModal from "./AdminEntryDetailModal";
import {
  listAdminRecycleRecords,
  restoreAdminRecycleRecord
} from "../../services/admin.service";
import { formatDate } from "../../utils/discovery";

const PAGE_SIZE = 12;

function initials(name) {
  return (name || "V").trim().slice(0, 2).toUpperCase();
}

export default function AdminRecycleRecordList({
  entityType,
  title,
  description
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "recycle-records", entityType, page],
    queryFn: () =>
      listAdminRecycleRecords(entityType, {
        page,
        size: PAGE_SIZE,
        sort: "deletedAt,desc"
      }),
    refetchInterval: 15000
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || items.length;

  const handleRestore = async (id) => {
    setBusyId(id);
    try {
      await restoreAdminRecycleRecord(entityType, id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "warnings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-pro-stack admin-page-stack">
      <div className="live-status-badge">Operational Record Recovery</div>

      <div className="command-center-header admin-page-heading">
        <div>
          <h1>{title}</h1>
          <p className="admin-page-description">{description}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="summary-card-pro admin-state-card">
          <ArchiveX className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>Loading archived records...</p>
        </div>
      ) : isError ? (
        <div className="summary-card-pro admin-state-card">
          <ArchiveX className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>We could not load this archive right now.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="summary-card-pro admin-state-card">
          <ArchiveX className="stream-icon-glow" style={{ marginBottom: "20px" }} />
          <p>No deleted records were found for this entity type.</p>
        </div>
      ) : (
        <section className="admin-recycle-record-grid">
          {items.map((item) => (
            <article key={`${item.entityType}-${item.id}`} className="card admin-recycle-record-card">
              <div className="project-actions" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="admin-content-record-card__title-row">
                    <h4>{item.title}</h4>
                    <span className="feed-badge">{item.entityType}</span>
                  </div>
                  <p className="admin-content-record-card__excerpt" style={{ marginTop: "10px" }}>
                    {item.excerpt || "No preview available for this record."}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => setDetailRecord(item)}
                  title="View archived entry"
                  aria-label="View archived entry"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  className="btn-primary admin-action-button"
                  onClick={() => handleRestore(item.id)}
                  disabled={busyId === item.id}
                >
                  <RotateCcw size={15} />
                  {busyId === item.id ? "Restoring..." : "Restore"}
                </button>
              </div>

              <div className="admin-owner-link">
                <div className="admin-owner-link__avatar">
                  {item.ownerProfileImage ? (
                    <img src={item.ownerProfileImage} alt={item.ownerFullName || item.ownerUsername} />
                  ) : (
                    initials(item.ownerFullName || item.ownerUsername)
                  )}
                </div>
                <div>
                  <strong>{item.ownerFullName || item.ownerUsername || "Unknown user"}</strong>
                  <span>@{item.ownerUsername || "system"}</span>
                </div>
              </div>

              <div className="admin-content-record-card__meta">
                {item.status && <span className="status-pill">{item.status}</span>}
                {item.secondaryLabel && <span className="status-pill">{item.secondaryLabel}</span>}
                {item.tertiaryLabel && <span className="status-pill">{item.tertiaryLabel}</span>}
              </div>

              <div className="admin-user-record-card__info">
                <div className="stream-item-sub admin-inline-detail">
                  <User size={14} />
                  <span>Deleted {formatDate(item.deletedAt)}</span>
                </div>
                <div className="stream-item-sub admin-inline-detail">
                  <span>Created {formatDate(item.createdAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {detailRecord && <AdminEntryDetailModal entryType="RECYCLE" item={detailRecord} onClose={() => setDetailRecord(null)} />}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button
            type="button"
            className="btn-glass"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="stream-meta-label">
            Page {page + 1} of {totalPages} · {totalElements} records
          </span>
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
    </div>
  );
}
