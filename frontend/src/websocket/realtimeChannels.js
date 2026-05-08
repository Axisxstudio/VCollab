export const realtimeEvents = {
  feed: "feed.event",
  notification: "notification.event",
  message: "message.event",
  messageStatus: "message.status",
  presence: "presence.event",
  typing: "conversation.typing",
  vhubFeed: "vhub.feed",
  vhubThread: "vhub.thread"
};

export const feedChannel = () => "vcollab:feed";
export const userChannel = (userId) => `vcollab:user:${userId}`;
export const conversationChannel = (conversationId) => `vcollab:conversation:${conversationId}`;
export const presenceChannel = () => "vcollab:presence";
export const vhubFeedChannel = () => "vcollab:vhub:feed";
export const vhubThreadChannel = (threadId) => `vcollab:vhub:thread:${threadId}`;
