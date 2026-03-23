import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToPresence } from "./stompClient";

export default function usePresenceUpdates(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const unsubscribe = subscribeToPresence(() => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return unsubscribe;
  }, [enabled, queryClient]);
}
