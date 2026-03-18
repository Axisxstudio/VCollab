import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { routes } from "../../config/routes";
import {
  clearAllNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/notification.service";
import useNotificationUpdates from "../../websocket/useNotificationUpdates";
import { formatTimeAgo } from "../../utils/date";

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

  const getNotificationPath = (item) => {
    if (!item.contentId) return null;
    if (item.contentType === "PROJECT") return routes.projectDetail.replace(":id", item.contentId);
    if (item.contentType === "BLOG") return routes.blogDetail.replace(":id", item.contentId);
    if (item.contentType === "POST") return routes.postDetail.replace(":id", item.contentId);
    return null;
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "recycle-records"] });
  };

  return (
    <div className="section">
      <div className="project-actions">
        <div>
          <h2>Notifications</h2>
          <p className="profile-meta">Stay up to date with activity on your work.</p>
        </div>
        <button className="btn-outline" type="button" onClick={handleMarkAll}>
          Mark all read
        </button>
        <button className="btn-glass" type="button" onClick={handleClearAll}>
          Clear all
        </button>
      </div>

      {isLoading && <div className="card">Loading notifications...</div>}
      {!isLoading && notifications.length === 0 && (
        <div className="card">No notifications yet.</div>
      )}
      {!isLoading && notifications.length > 0 && (
        <div className="notification-list-pro">
          {notifications.map((item) => {
            const profilePath = item.actor ? routes.profile.replace(":username", item.actor.username) : null;
            const contentPath = getNotificationPath(item);
            const initials = item.actor?.fullName ? item.actor.fullName.charAt(0).toUpperCase() : (item.actor?.username?.charAt(0).toUpperCase() || "V");

            const handleRowClick = async () => {
              if (!item.read) {
                await markNotificationRead(item.id);
                queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }
              if (contentPath) {
                navigate(contentPath);
              }
            };

            return (
              <div 
                key={item.id} 
                className={`notification-pro-row ${item.read ? "" : "unread"}`}
                onClick={handleRowClick}
              >
                <Link 
                  to={profilePath || "#"} 
                  className="notification-pro-avatar" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.actor?.profileImage ? (
                    <img src={item.actor.profileImage} alt={item.actor.username} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </Link>

                <div className="notification-pro-body">
                  <div className="notification-pro-text">
                    <Link 
                      to={profilePath || "#"} 
                      className="notification-pro-actor"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.actor?.fullName || item.actor?.username || "VCollab Member"}
                    </Link>
                    {" "}
                    <span className="notification-pro-message">{item.message}</span>
                  </div>
                  <span className="notification-pro-time">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>

                <div className="notification-pro-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-glass-sm"
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {!item.read && <div className="unread-dot-pro-large" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
