export const realtimeEvents = {
  feed: "feed.event",
  notification: "notification.event",
  message: "message.event",
  messageStatus: "message.status",
  presence: "presence.event",
  typing: "conversation.typing",
  vhubFeed: "vhub.feed",
  vhubThread: "vhub.thread",
} as const;

export function feedChannel() {
  return "vcollab:feed";
}

export function userChannel(userId: number) {
  return `vcollab:user:${userId}`;
}

export function conversationChannel(conversationId: number) {
  return `vcollab:conversation:${conversationId}`;
}

export function presenceChannel() {
  return "vcollab:presence";
}

export function vhubFeedChannel() {
  return "vcollab:vhub:feed";
}

export function vhubThreadChannel(threadId: number) {
  return `vcollab:vhub:thread:${threadId}`;
}
