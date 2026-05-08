import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFollowStatus, followUser, unfollowUser } from "../../services/follow.service";
import { useAuthStore } from "../../store/authStore";

export default function FollowButton({ userId, username, onStatusChange }) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [busy, setBusy] = useState(false);

  const isMe = currentUser?.id === userId || (username && currentUser?.username === username);

  const { data: status, isLoading } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: () => getFollowStatus(userId),
    enabled: Boolean(userId && !isMe && currentUser),
  });

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || !userId || isMe) return;

    setBusy(true);
    try {
      if (status?.following) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      
      await queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      // Also invalidate profile if we are on a profile page
      if (username) {
        await queryClient.invalidateQueries({ queryKey: ["profile", username] });
      }
      
      if (onStatusChange) onStatusChange(!status?.following);
    } catch (error) {
      console.error("Follow action failed", error);
    } finally {
      setBusy(true); // Small delay to prevent double clicks
      setTimeout(() => setBusy(false), 500);
    }
  };

  if (isMe || !currentUser) return null;
  if (isLoading) return <span className="follow-btn-placeholder">...</span>;

  const isFollowing = status?.following;

  return (
    <button
      className={`follow-inline-btn ${isFollowing ? "is-following" : ""}`}
      onClick={handleFollow}
      disabled={busy}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
