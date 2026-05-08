import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../services/profile.service";
import { useAuthStore } from "../store/authStore";

export default function useViewerProfile() {
  const authUser = useAuthStore((state) => state.user);

  const { data: viewerProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
    enabled: Boolean(authUser?.id)
  });

  const viewer = viewerProfile || authUser;
  const viewerEducationType = viewerProfile?.educationType || authUser?.educationType || null;

  return {
    authUser,
    viewer,
    viewerEducationType,
    isUniversityViewer: viewerEducationType === "UNIVERSITY"
  };
}
