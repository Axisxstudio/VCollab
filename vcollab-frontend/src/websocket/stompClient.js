import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_BASE_URL } from "../config/constants";
import { useAuthStore } from "../store/authStore";

let client = null;
const feedHandlers = new Set();
const notificationHandlers = new Set();
const messageHandlers = new Set();

let feedSubscription = null;
let notificationSubscription = null;
let messageSubscription = null;

const getSockUrl = () => WS_BASE_URL.replace(/^ws/i, "http");

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
};

const ensureClient = () => {
    if (client) return client;

    client = new Client({
        webSocketFactory: () => new SockJS(getSockUrl()),
        reconnectDelay: 5000,
        debug: (str) => {
            if (process.env.NODE_ENV === "development") {
                console.log("STOMP: " + str);
            }
        },
        onConnect: () => {
            console.log("STOMP connected");
            unsubscribeAll();

            feedSubscription = client.subscribe("/topic/feed", (message) => {
                const payload = message.body ? JSON.parse(message.body) : {};
                feedHandlers.forEach((handler) => handler(payload));
            });

            notificationSubscription = client.subscribe("/user/queue/notifications", (message) => {
                const payload = message.body ? JSON.parse(message.body) : {};
                notificationHandlers.forEach((handler) => handler(payload));
            });

            messageSubscription = client.subscribe("/user/queue/messages", (message) => {
                const payload = message.body ? JSON.parse(message.body) : {};
                messageHandlers.forEach((handler) => handler(payload));
            });
        },
        onStompError: (frame) => {
            console.error("STOMP error", frame);
        },
        onWebSocketClose: () => {
            console.log("STOMP websocket closed");
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
    } else {
        if (stomp.active) {
            stomp.deactivate();
        }
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

const checkCleanup = () => {
    if (feedHandlers.size === 0 && notificationHandlers.size === 0 && messageHandlers.size === 0) {
        if (client && client.active) {
            client.deactivate();
            client = null;
        }
    }
};
