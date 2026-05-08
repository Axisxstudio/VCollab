import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToMessages } from "./stompClient";

export default function useMessageUpdates(activeConversationId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToMessages((event) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (event?.conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", String(event.conversationId)] });
      }
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", String(activeConversationId)] });
      }
    });
    return unsubscribe;
  }, [activeConversationId, queryClient]);
}
