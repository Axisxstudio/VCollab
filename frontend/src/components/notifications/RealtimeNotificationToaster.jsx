import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { routes } from "../../config/routes";
import { listNotifications, markNotificationRead } from "../../services/notification.service";
import { formatTimeAgo } from "../../utils/date";
import {
  getNotificationActorInitials,
  getNotificationPath,
  getNotificationTypeLabel
} from "../../utils/notifications";
import { subscribeToNotifications } from "../../websocket/realtimeClient";

const MAX_TOASTS = 3;
const TOAST_LIFETIME_MS = 6500;

export default function RealtimeNotificationToaster() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const seenIds = useRef(new Set());
  const timersRef = useRef(new Map());
  const [toasts, setToasts] = useState([]);

  const truncateText = (text, length = 80) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  useEffect(() => {
    // Fetch unread notifications on login / mount and show as toasts
    listNotifications({ unread: true, size: MAX_TOASTS }).then((page) => {
      const items = Array.isArray(page) ? page : (page?.content ?? []);
      items.slice(0, MAX_TOASTS).forEach((notification, index) => {
        if (!notification?.id || seenIds.current.has(notification.id)) return;
        seenIds.current.add(notification.id);
        // stagger entry so toasts slide in one-by-one
        const staggerDelay = index * 400;
        const entryTimer = window.setTimeout(() => {
          setToasts((current) => [...current, notification].slice(0, MAX_TOASTS));
          const dismissTimer = window.setTimeout(() => {
            setToasts((current) => current.filter((item) => item.id !== notification.id));
            timersRef.current.delete(notification.id);
          }, TOAST_LIFETIME_MS);
          timersRef.current.set(notification.id, dismissTimer);
        }, staggerDelay);
        // track entry timer so it's cleared on unmount
        timersRef.current.set(`entry-${notification.id}`, entryTimer);
      });
    }).catch(console.error);

    const unsubscribe = subscribeToNotifications((notification) => {
      if (!notification?.id || seenIds.current.has(notification.id)) {
        return;
      }

      seenIds.current.add(notification.id);

      setToasts((current) => [notification, ...current].slice(0, MAX_TOASTS));

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== notification.id));
        timersRef.current.delete(notification.id);
      }, TOAST_LIFETIME_MS);

      timersRef.current.set(notification.id, timer);
    });

    return () => {
      unsubscribe();
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const orderedToasts = useMemo(
    () => [...toasts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [toasts]
  );

  const dismissToast = (id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const handleToastClick = async (notification) => {
    const nextPath = getNotificationPath(notification);

    try {
      if (!notification.read) {
        await markNotificationRead(notification.id);
      }
    } finally {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notification-preview"] });
      dismissToast(notification.id);
      navigate(nextPath || routes.notifications);
    }
  };

  if (orderedToasts.length === 0) {
    return null;
  }

  return (
    <div className="notification-toast-stack" aria-live="polite" aria-label="Realtime notifications">
      {orderedToasts.map((notification) => (
        <div key={notification.id} className="notification-toast-card">
          <button
            type="button"
            className="notification-toast-card__body"
            onClick={() => handleToastClick(notification)}
          >
            <div className="notification-toast-card__icon">
              {notification.actor?.profileImage ? (
                <img
                  src={notification.actor.profileImage}
                  alt={notification.actor.fullName || notification.actor.username || "Notification actor"}
                />
              ) : (
                <span>{getNotificationActorInitials(notification.actor)}</span>
              )}
            </div>
            <div className="notification-toast-card__content">
              <div className="notification-toast-card__header">
                <span className="notification-toast-card__label">
                  <Bell size={13} />
                  {getNotificationTypeLabel(notification.type)}
                </span>
                <span className="notification-toast-card__time">{formatTimeAgo(notification.createdAt)}</span>
              </div>
              {notification.actor?.username && (
                <Link
                  to={routes.profile.replace(":username", notification.actor.username)}
                  className="notification-toast-card__actor"
                  onClick={(e) => { e.stopPropagation(); dismissToast(notification.id); }}
                >
                  {notification.actor.fullName || notification.actor.username}
                </Link>
              )}
              <p className="notification-toast-card__message">{notification.message}</p>
            </div>
          </button>
          <button
            type="button"
            className="notification-toast-card__dismiss"
            onClick={() => dismissToast(notification.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
