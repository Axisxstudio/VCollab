import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  conversationChannel,
  feedChannel,
  presenceChannel,
  realtimeEvents,
  userChannel,
  vhubFeedChannel,
  vhubThreadChannel,
} from "./channels";

async function broadcast(channel: string, event: string, payload: unknown) {
  const supabase = createSupabaseAdminClient();
  const realtimeChannel = supabase.channel(channel);

  const result = await realtimeChannel.send({
    type: "broadcast",
    event,
    payload,
  });

  await supabase.removeChannel(realtimeChannel);
  return result;
}

export function publishFeed(payload: unknown) {
  return broadcast(feedChannel(), realtimeEvents.feed, payload);
}

export function publishUserNotification(userId: number, payload: unknown) {
  return broadcast(userChannel(userId), realtimeEvents.notification, payload);
}

export function publishUserMessage(userId: number, payload: unknown) {
  return broadcast(userChannel(userId), realtimeEvents.message, payload);
}

export function publishConversationMessage(conversationId: number, payload: unknown) {
  return broadcast(conversationChannel(conversationId), realtimeEvents.message, payload);
}

export function publishConversationStatus(conversationId: number, payload: unknown) {
  return broadcast(conversationChannel(conversationId), realtimeEvents.messageStatus, payload);
}

export function publishPresence(payload: unknown) {
  return broadcast(presenceChannel(), realtimeEvents.presence, payload);
}

export function publishTyping(conversationId: number, payload: unknown) {
  return broadcast(conversationChannel(conversationId), realtimeEvents.typing, payload);
}

export function publishVHubFeed(payload: unknown) {
  return broadcast(vhubFeedChannel(), realtimeEvents.vhubFeed, payload);
}

export function publishVHubThread(threadId: number, payload: unknown) {
  return broadcast(vhubThreadChannel(threadId), realtimeEvents.vhubThread, payload);
}
