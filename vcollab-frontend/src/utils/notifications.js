import { routes } from "../config/routes";

export function getNotificationPath(item) {
  if (!item) return routes.notifications;

  if (item.type === "WARNING") return routes.warnings;
  if (item.type === "MESSAGE") return routes.messages;
  if (item.type === "PROJECT_REQUEST") return routes.requests;

  if (item.contentId) {
    if (item.contentType === "PROJECT") return routes.projectDetail.replace(":id", item.contentId);
    if (item.contentType === "BLOG") return routes.blogDetail.replace(":id", item.contentId);
    if (item.contentType === "POST") return routes.postDetail.replace(":id", item.contentId);
  }

  if (item.actor?.username) {
    return routes.profile.replace(":username", item.actor.username);
  }

  return routes.notifications;
}

export function getNotificationTypeLabel(type) {
  if (!type) return "Update";

  return type
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getNotificationActorInitials(actor) {
  const source = actor?.fullName || actor?.username || "VCollab";
  return source.charAt(0).toUpperCase();
}

export function getNotificationActionLabel(item) {
  if (!item) return "Open";
  if (item.type === "WARNING") return "Review warning";
  if (item.type === "MESSAGE") return "Open chat";
  if (item.type === "PROJECT_REQUEST") return "Open requests";
  if (item.contentId) return "View item";
  if (item.actor?.username) return "Open profile";
  return "Open inbox";
}
