import { useEffect, useRef, useState } from "react";
import { subscribeToConversationTyping } from "./stompClient";

const TYPING_TTL_MS = 3200;

export default function useConversationTyping(conversationId, currentUserId) {
  const [typingUsers, setTypingUsers] = useState([]);
  const expiryTimersRef = useRef(new Map());

  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return undefined;
    }

    const unsubscribe = subscribeToConversationTyping(conversationId, (event) => {
      if (!event?.userId || event.userId === currentUserId) {
        return;
      }

      const key = String(event.userId);
      const currentTimer = expiryTimersRef.current.get(key);
      if (currentTimer) {
        window.clearTimeout(currentTimer);
        expiryTimersRef.current.delete(key);
      }

      if (event.typing) {
        setTypingUsers((current) => {
          const next = current.filter((entry) => entry.userId !== event.userId);
          next.push({ userId: event.userId, username: event.username });
          return next;
        });

        const timer = window.setTimeout(() => {
          setTypingUsers((current) => current.filter((entry) => entry.userId !== event.userId));
          expiryTimersRef.current.delete(key);
        }, TYPING_TTL_MS);

        expiryTimersRef.current.set(key, timer);
      } else {
        setTypingUsers((current) => current.filter((entry) => entry.userId !== event.userId));
      }
    });

    return () => {
      unsubscribe();
      expiryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      expiryTimersRef.current.clear();
      setTypingUsers([]);
    };
  }, [conversationId, currentUserId]);

  return typingUsers;
}
