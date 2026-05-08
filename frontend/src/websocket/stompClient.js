import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_BASE_URL } from "../config/constants";
import { useAuthStore } from "../store/authStore";

let client = null;
const feedHandlers = new Set();
const notificationHandlers = new Set();
const messageHandlers = new Set();
const presenceHandlers = new Set();
const typingHandlersByConversation = new Map();
const typingSubscriptions = new Map();

let feedSubscription = null;
let notificationSubscription = null;
let messageSubscription = null;
let presenceSubscription = null;

const getSockUrl = () => WS_BASE_URL.replace(/^ws/i, "http");

const parsePayload = (frame) => {
  try {
    return frame?.body ? JSON.parse(frame.body) : {};
  } catch (error) {
    return {};
  }
};

const subscribeTypingTopic = (conversationId) => {
  if (!client?.connected || typingSubscriptions.has(conversationId)) {
    return;
  }

  const subscription = client.subscribe(`/topic/conversations/${conversationId}/typing`, (message) => {
    const payload = parsePayload(message);
    const handlers = typingHandlersByConversation.get(conversationId);
    handlers?.forEach((handler) => handler(payload));
  });

  typingSubscriptions.set(conversationId, subscription);
};

const unsubscribeAll = () => {
  if (feedSubscription) {
    feedSubscription.unsubscribe();
    feedSubscription = null;
  }
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
    notificationSubscription = null;
  }
  if (messageSubscription) {
    messageSubscription.unsubscribe();
    messageSubscription = null;
  }
  if (presenceSubscription) {
    presenceSubscription.unsubscribe();
    presenceSubscription = null;
  }
  typingSubscriptions.forEach((subscription) => subscription.unsubscribe());
  typingSubscriptions.clear();
};

const ensureClient = () => {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(getSockUrl()),
    reconnectDelay: 5000,
    debug: (entry) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`STOMP: ${entry}`);
      }
    },
    onConnect: () => {
      unsubscribeAll();

      feedSubscription = client.subscribe("/topic/feed", (message) => {
        const payload = parsePayload(message);
        feedHandlers.forEach((handler) => handler(payload));
      });

      notificationSubscription = client.subscribe("/user/queue/notifications", (message) => {
        const payload = parsePayload(message);
        notificationHandlers.forEach((handler) => handler(payload));
      });

      messageSubscription = client.subscribe("/user/queue/messages", (message) => {
        const payload = parsePayload(message);
        messageHandlers.forEach((handler) => handler(payload));
      });

      presenceSubscription = client.subscribe("/topic/presence", (message) => {
        const payload = parsePayload(message);
        presenceHandlers.forEach((handler) => handler(payload));
      });

      typingHandlersByConversation.forEach((_handlers, conversationId) => {
        subscribeTypingTopic(conversationId);
      });
    },
    onStompError: (frame) => {
      console.error("STOMP error", frame);
    },
    onWebSocketClose: () => {
      unsubscribeAll();
    }
  });

  return client;
};

const updateConnection = () => {
  const token = useAuthStore.getState().token;
  const stomp = ensureClient();

  if (token) {
    stomp.connectHeaders = { Authorization: `Bearer ${token}` };
    if (!stomp.active) {
      stomp.activate();
    }
  } else if (stomp.active) {
    stomp.deactivate();
    client = null;
  }
};

export const subscribeToFeed = (handler) => {
  feedHandlers.add(handler);
  updateConnection();

  return () => {
    feedHandlers.delete(handler);
    checkCleanup();
  };
};

export const subscribeToNotifications = (handler) => {
  notificationHandlers.add(handler);
  updateConnection();

  return () => {
    notificationHandlers.delete(handler);
    checkCleanup();
  };
};

export const subscribeToMessages = (handler) => {
  messageHandlers.add(handler);
  updateConnection();

  return () => {
    messageHandlers.delete(handler);
    checkCleanup();
  };
};

export const subscribeToPresence = (handler) => {
  presenceHandlers.add(handler);
  updateConnection();

  return () => {
    presenceHandlers.delete(handler);
    checkCleanup();
  };
};

export const subscribeToConversationTyping = (conversationId, handler) => {
  if (!conversationId) {
    return () => {};
  }

  const key = String(conversationId);
  if (!typingHandlersByConversation.has(key)) {
    typingHandlersByConversation.set(key, new Set());
  }

  typingHandlersByConversation.get(key).add(handler);
  updateConnection();
  subscribeTypingTopic(key);

  return () => {
    const handlers = typingHandlersByConversation.get(key);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        typingHandlersByConversation.delete(key);
        const subscription = typingSubscriptions.get(key);
        if (subscription) {
          subscription.unsubscribe();
          typingSubscriptions.delete(key);
        }
      }
    }
    checkCleanup();
  };
};

export const publishTyping = (conversationId, typing) => {
  if (!conversationId) return;

  updateConnection();
  if (!client?.connected) return;

  client.publish({
    destination: `/app/conversations/${conversationId}/typing`,
    body: JSON.stringify({ typing })
  });
};

const checkCleanup = () => {
  if (
    feedHandlers.size === 0
    && notificationHandlers.size === 0
    && messageHandlers.size === 0
    && presenceHandlers.size === 0
    && typingHandlersByConversation.size === 0
  ) {
    if (client?.active) {
      client.deactivate();
    }
    client = null;
  }
};
