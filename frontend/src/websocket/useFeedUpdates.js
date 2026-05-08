import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToFeed } from "./stompClient";

export default function useFeedUpdates({ contentType, contentId, queryKeys = [], enabled = true }) {
  const queryClient = useQueryClient();
  const keysSignature = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const unsubscribe = subscribeToFeed((event) => {
      if (contentType && event.contentType !== contentType) return;
      if (contentId && String(event.contentId) !== String(contentId)) return;
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    });
    return unsubscribe;
  }, [contentType, contentId, enabled, keysSignature, queryClient]);
}
