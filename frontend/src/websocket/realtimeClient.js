import { getSupabaseClient } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

const subscriptions = new Map();

function subscriptionKey(channelName, eventName) {
  return `${channelName}::${eventName}`;
}

export function subscribeBroadcast(channelName, eventName, handler) {
  const supabase = getSupabaseClient();
  if (!supabase || !channelName || !eventName) {
    return () => {};
  }

  const key = subscriptionKey(channelName, eventName);
  let entry = subscriptions.get(key);

  if (!entry) {
    const handlers = new Set();
    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: true } } })
      .on("broadcast", { event: eventName }, (payload) => {
        handlers.forEach((registeredHandler) => registeredHandler(payload.payload ?? payload));
      });

    channel.subscribe();
    entry = { channel, handlers };
    subscriptions.set(key, entry);
  }

  entry.handlers.add(handler);

  return () => {
    entry.handlers.delete(handler);
    if (entry.handlers.size === 0) {
      supabase.removeChannel(entry.channel);
      subscriptions.delete(key);
    }
  };
}

export async function publishBroadcast(channelName, eventName, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !channelName || !eventName) {
    return;
  }

  const channel = supabase.channel(channelName, { config: { broadcast: { self: true } } });
  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({ type: "broadcast", event: eventName, payload });
      supabase.removeChannel(channel);
    }
  });
}

export function currentUserId() {
  return useAuthStore.getState().user?.id;
}
