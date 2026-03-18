import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../services/notification.service";
import { routes } from "../../config/routes";
import useNotificationUpdates from "../../websocket/useNotificationUpdates";

import { Bell } from "lucide-react";
import { formatTimeAgo } from "../../utils/date";

export default function NotificationBell({ icon: Icon = Bell, size = 18 }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: getUnreadCount
  });

  const { data: preview } = useQuery({
    queryKey: ["notification-preview"],
    queryFn: () => listNotifications({ page: 0, size: 5, sort: "createdAt,desc" })
  });

  useNotificationUpdates();

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsLocked(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsLocked(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const unreadCount = unread?.unreadCount || 0;
  const notifications = preview?.content || [];

  const handleToggle = (e) => {
    e.stopPropagation();
    // Clicking "locks" it open so it doesn't close on hover-away
    setIsOpen(true);
    setIsLocked(true);
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-preview"] });
  };

  const handleRead = async (id, path) => {
    await markNotificationRead(id);
    await queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    await queryClient.invalidateQueries({ queryKey: ["notification-preview"] });
    if (path) {
      setIsOpen(false);
      setIsLocked(false);
    }
  };

  const getNotificationPath = (item) => {
    if (!item.contentId) return null;
    if (item.contentType === "PROJECT") return routes.projectDetail.replace(":id", item.contentId);
    if (item.contentType === "BLOG") return routes.blogDetail.replace(":id", item.contentId);
    if (item.contentType === "POST") return routes.postDetail.replace(":id", item.contentId);
    return null;
  };

  return (
    <div 
      className="notification-bell" 
      ref={containerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isLocked) setIsOpen(false);
      }}
    >
      <button className="icon-btn-pro" type="button" onClick={handleToggle}>
        <Icon size={size} />
        {unreadCount > 0 && <span className="notification-badge-pro">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <strong>Notifications</strong>
            <div style={{ display: "flex", gap: "10px" }}>
              {unreadCount > 0 && (
                <button className="text-btn-mini" onClick={handleReadAll}>Mark all as read</button>
              )}
              <Link to={routes.notifications} onClick={() => { setIsOpen(false); setIsLocked(false); }}>
                View all
              </Link>
            </div>
          </div>
          <div className="notification-scroll-area">
            {notifications.length === 0 && (
              <div className="comment-muted" style={{ padding: '30px', textAlign: 'center' }}>No notifications yet.</div>
            )}
            {notifications.map((item) => {
              const profilePath = item.actor ? routes.profile.replace(":username", item.actor.username) : null;
              const contentPath = getNotificationPath(item);
              const initials = item.actor?.fullName ? item.actor.fullName.charAt(0).toUpperCase() : (item.actor?.username?.charAt(0).toUpperCase() || "V");

              const handleRowClick = () => {
                if (contentPath) {
                  handleRead(item.id, contentPath);
                  navigate(contentPath);
                } else if (!item.read) {
                  handleRead(item.id, null);
                }
              };

              return (
                <div 
                  key={item.id} 
                  className={`notification-item-pro ${item.read ? "" : "unread"}`}
                  onClick={handleRowClick}
                  style={{ cursor: contentPath ? 'pointer' : 'default' }}
                >
                  <Link 
                    to={profilePath || "#"} 
                    className="notification-avatar" 
                    onClick={(e) => { 
                      e.stopPropagation();
                      setIsOpen(false); 
                      setIsLocked(false); 
                    }}
                  >
                    {item.actor?.profileImage ? (
                      <img src={item.actor.profileImage} alt={item.actor.username} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </Link>
                  <div className="notification-body">
                    <div className="notification-text">
                      <Link 
                        to={profilePath || "#"} 
                        className="notification-actor-name" 
                        onClick={(e) => { 
                          e.stopPropagation();
                          setIsOpen(false); 
                          setIsLocked(false); 
                        }}
                      >
                        {item.actor?.fullName || item.actor?.username || "VCollab Member"}
                      </Link>
                      {" "}
                      <span className="notification-msg-text">{item.message}</span>
                    </div>
                    <div className="notification-footer">
                      <span className="notification-time">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      {contentPath && (
                        <span className="notification-view-link">
                          View content
                        </span>
                      )}
                    </div>
                  </div>
                  {!item.read && <div className="unread-dot-pro" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
