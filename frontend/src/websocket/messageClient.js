import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_BASE_URL } from "../config/constants";
import { useAuthStore } from "../store/authStore";

let client = null;
let subscription = null;
const handlers = new Set();

const getSockUrl = () => WS_BASE_URL.replace(/^ws/i, "http");

const ensureClient = () => {
  if (client) return client;
  client = new Client({
    webSocketFactory: () => new SockJS(getSockUrl()),
    reconnectDelay: 5000,
    onConnect: () => {
      if (subscription) return;
      subscription = client.subscribe("/user/queue/messages", (message) => {
        let payload = {};
        try {
          payload = message.body ? JSON.parse(message.body) : {};
        } catch (error) {
          payload = {};
        }
        handlers.forEach((handler) => handler(payload));
      });
    }
  });
  return client;
};

export const subscribeToMessages = (handler) => {
  handlers.add(handler);
  const token = useAuthStore.getState().token;
  const stomp = ensureClient();
  stomp.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  if (!stomp.active) {
    stomp.activate();
  }

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0 && client) {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      client.deactivate();
      client = null;
    }
  };
};
