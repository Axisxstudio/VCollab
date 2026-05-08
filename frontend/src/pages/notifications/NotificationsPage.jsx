import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Inbox, MessageSquare, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/notification.service";
import { formatTimeAgo } from "../../utils/date";
import {
  getNotificationActionLabel,
  getNotificationActorInitials,
  getNotificationPath,
  getNotificationTypeLabel
} from "../../utils/notifications";
import useNotificationUpdates from "../../websocket/useNotificationUpdates";

const buildSections = (notifications) => {
  const unread = notifications.filter((item) => !item.read);
  const read = notifications.filter((item) => item.read);

  return [
    { title: "Unread", items: unread, empty: "New activity will appear here first." },
    { title: "Earlier", items: read, empty: "Read notifications will move here." }
  ].filter((section) => section.items.length > 0 || section.title === "Unread");
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => listNotifications({ page, size: 20, sort: "createdAt,desc" })
  });

  useNotificationUpdates();

  const notifications = data?.content || [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const messageCount = notifications.filter((item) => item.type === "MESSAGE").length;
  const sections = useMemo(() => buildSections(notifications), [notifications]);

  const invalidateNotificationQueries = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
    queryClient.invalidateQueries({ queryKey: ["notification-preview"] })
  ]);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    await invalidateNotificationQueries();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    await invalidateNotificationQueries();
    await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    await invalidateNotificationQueries();
    await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
  };

  const openNotification = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }
    await invalidateNotificationQueries();
    navigate(getNotificationPath(item));
  };

  return (
    <div className="collab-page">
      <section className="collab-page__hero">
        <div>
          <span className="collab-page__eyebrow">Realtime inbox</span>
          <h2 className="collab-page__title">Notifications</h2>
          <p className="collab-page__subtitle">
            Comments, reactions, messages, requests, and moderation updates stay synced here in real time.
          </p>
        </div>
        <div className="collab-page__actions">
          <button className="btn-outline" type="button" onClick={handleMarkAll} disabled={notifications.length === 0}>
            Mark all read
          </button>
          <button className="btn-glass" type="button" onClick={handleClearAll} disabled={notifications.length === 0}>
            Clear all
          </button>
        </div>
      </section>

      <section className="collab-stat-grid">
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><Bell size={18} /></span>
          <div>
            <strong>{notifications.length}</strong>
            <span>Total updates</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><Inbox size={18} /></span>
          <div>
            <strong>{unreadCount}</strong>
            <span>Unread items</span>
          </div>
        </article>
        <article className="collab-stat-card">
          <span className="collab-stat-card__icon"><MessageSquare size={18} /></span>
          <div>
            <strong>{messageCount}</strong>
            <span>Message alerts</span>
          </div>
        </article>
      </section>

      {isLoading && <div className="collab-empty-panel">Loading notifications...</div>}

      {!isLoading && notifications.length === 0 && (
        <div className="collab-empty-panel">
          <h3>Your inbox is clear</h3>
          <p>Realtime activity will land here as soon as people interact with your content or conversations.</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="collab-section-stack">
          {sections.map((section) => (
            <section key={section.title} className="collab-surface">
              <div className="collab-surface__header">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.empty}</p>
                </div>
                <span className="collab-pill">{section.items.length}</span>
              </div>

              <div className="notification-section-list">
                {section.items.map((item) => {
                  const truncate = (text, length = 100) => {
                    if (!text) return "";
                    return text.length > length ? text.substring(0, length) + "..." : text;
                  };
                  const actorInitial = getNotificationActorInitials(item.actor);
                  const actorName = item.actor?.fullName || item.actor?.username || "VCollab member";
                  
                  // Clean up message if it starts with the actor's name (for backward compatibility)
                  let displayMessage = item.message;
                  if (displayMessage && (displayMessage.startsWith(actorName) || (item.actor?.username && displayMessage.startsWith(item.actor.username)))) {
                    displayMessage = displayMessage.replace(actorName, "").replace(item.actor?.username || "", "").trim();
                  }

                  return (
                    <article
                      key={item.id}
                      className={`notification-upgrade-row ${item.read ? "" : "is-unread"}`}
                    >
                      <button
                        type="button"
                        className="notification-upgrade-row__main"
                        onClick={() => openNotification(item)}
                      >
                        <div className="notification-upgrade-row__avatar">
                          {item.actor?.profileImage ? (
                            <img src={item.actor.profileImage} alt={item.actor.fullName || item.actor.username} />
                          ) : (
                            <span>{actorInitial}</span>
                          )}
                        </div>
                        <div className="notification-upgrade-row__content">
                          <div className="notification-upgrade-row__topline">
                            <span className="notification-type-chip">
                              {getNotificationTypeLabel(item.type)}
                            </span>
                            <span className="comment-muted">{formatTimeAgo(item.createdAt)}</span>
                          </div>
                          <p className="notification-upgrade-row__message">
                            <strong>{actorName}</strong>{" "}
                            <span>{displayMessage}</span>
                          </p>
                          {(item.type === 'COMMENT' || item.type === 'COMMENT_REPLY' || item.type === 'MENTION') && item.metadata && (
                            <div className="notification-comment-preview" style={{ maxWidth: '600px' }}>
                              "{truncate(item.metadata)}"
                            </div>
                          )}
                          <span className="notification-upgrade-row__action">
                            {getNotificationActionLabel(item)}
                          </span>
                        </div>
                      </button>

                      <button
                        className="notification-upgrade-row__delete"
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
