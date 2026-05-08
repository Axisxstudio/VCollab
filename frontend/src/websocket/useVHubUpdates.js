import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToVHubFeed, subscribeToVHubThread } from "./vhubClient";

export default function useVHubUpdates(activeThreadId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeFeed = subscribeToVHubFeed(() => {
      queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "summary"] });
    });

    return unsubscribeFeed;
  }, [queryClient]);

  useEffect(() => {
    if (!activeThreadId) {
      return undefined;
    }

    const unsubscribeThread = subscribeToVHubThread(activeThreadId, () => {
      queryClient.invalidateQueries({ queryKey: ["v-hub", "thread", String(activeThreadId)] });
      queryClient.invalidateQueries({ queryKey: ["v-hub", "replies", String(activeThreadId)] });
      queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "v-hub", "summary"] });
    });

    return unsubscribeThread;
  }, [activeThreadId, queryClient]);
}
