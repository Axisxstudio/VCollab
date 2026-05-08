import { useQuery } from "@tanstack/react-query";
import { getLandingOverview } from "../services/landing.service";
import useFeedUpdates from "../websocket/useFeedUpdates";

export const LANDING_OVERVIEW_QUERY_KEY = ["landing-overview"];

export default function useRealtimeLandingOverview() {
  useFeedUpdates({
    queryKeys: [LANDING_OVERVIEW_QUERY_KEY]
  });

  return useQuery({
    queryKey: LANDING_OVERVIEW_QUERY_KEY,
    queryFn: getLandingOverview,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });
}
