import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToNotifications } from "./realtimeClient";

export default function useNotificationUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notification-preview"] });
    });
    return unsubscribe;
  }, [queryClient]);
}
