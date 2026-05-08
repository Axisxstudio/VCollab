import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_BASE_URL } from "../config/constants";
import { useAuthStore } from "../store/authStore";

let client = null;
let feedSubscription = null;
const feedHandlers = new Set();
const threadHandlersById = new Map();
const threadSubscriptions = new Map();

const getSockUrl = () => WS_BASE_URL.replace(/^ws/i, "http");

function parsePayload(frame) {
  try {
    return frame?.body ? JSON.parse(frame.body) : {};
  } catch (error) {
    return {};
  }
}

function unsubscribeAll() {
  if (feedSubscription) {
    feedSubscription.unsubscribe();
    feedSubscription = null;
  }
  threadSubscriptions.forEach((subscription) => subscription.unsubscribe());
  threadSubscriptions.clear();
}

function subscribeThread(threadId) {
  if (!client?.connected || threadSubscriptions.has(threadId)) {
    return;
  }

  const subscription = client.subscribe(`/topic/v-hub.thread.${threadId}`, (message) => {
    const payload = parsePayload(message);
    const handlers = threadHandlersById.get(threadId);
    handlers?.forEach((handler) => handler(payload));
  });

  threadSubscriptions.set(threadId, subscription);
}

function ensureClient() {
  if (client) {
    return client;
  }

  client = new Client({
    webSocketFactory: () => new SockJS(getSockUrl()),
    reconnectDelay: 5000,
    onConnect: () => {
      unsubscribeAll();

      if (feedHandlers.size > 0) {
        feedSubscription = client.subscribe("/topic/v-hub.feed", (message) => {
          const payload = parsePayload(message);
          feedHandlers.forEach((handler) => handler(payload));
        });
      }

      threadHandlersById.forEach((_handlers, threadId) => {
        subscribeThread(threadId);
      });
    },
    onWebSocketClose: () => {
      unsubscribeAll();
    }
  });

  return client;
}

function connectIfNeeded() {
  const token = useAuthStore.getState().token;
  const stomp = ensureClient();
  stomp.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  if (!stomp.active) {
    stomp.activate();
  }
}

function cleanupIfIdle() {
  if (feedHandlers.size === 0 && threadHandlersById.size === 0) {
    if (client?.active) {
      client.deactivate();
    }
    client = null;
  }
}

export function subscribeToVHubFeed(handler) {
  feedHandlers.add(handler);
  connectIfNeeded();
  if (client?.connected && !feedSubscription) {
    feedSubscription = client.subscribe("/topic/v-hub.feed", (message) => {
      const payload = parsePayload(message);
      feedHandlers.forEach((feedHandler) => feedHandler(payload));
    });
  }

  return () => {
    feedHandlers.delete(handler);
    if (feedHandlers.size === 0 && feedSubscription) {
      feedSubscription.unsubscribe();
      feedSubscription = null;
    }
    cleanupIfIdle();
  };
}

export function subscribeToVHubThread(threadId, handler) {
  if (!threadId) {
    return () => {};
  }

  const key = String(threadId);
  if (!threadHandlersById.has(key)) {
    threadHandlersById.set(key, new Set());
  }

  threadHandlersById.get(key).add(handler);
  connectIfNeeded();
  subscribeThread(key);

  return () => {
    const handlers = threadHandlersById.get(key);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        threadHandlersById.delete(key);
        const subscription = threadSubscriptions.get(key);
        if (subscription) {
          subscription.unsubscribe();
          threadSubscriptions.delete(key);
        }
      }
    }
    cleanupIfIdle();
  };
}
