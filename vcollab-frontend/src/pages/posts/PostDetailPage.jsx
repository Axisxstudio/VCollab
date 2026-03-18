import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Folder, MessageSquareText, UserRound } from "lucide-react";
import MediaGallery from "../../components/media/MediaGallery";
import ContentActions from "../../components/interactions/ContentActions";
import CommentThread from "../../components/comments/CommentThread";
import OwnerContentControls from "../../components/content/OwnerContentControls";
import RichTextContent from "../../components/content/RichTextContent";
import { getPost, deletePost } from "../../services/post.service";
import { routes } from "../../config/routes";
import { buildPostGalleryItems, getContentDetailPath } from "../../utils/content";
import { buildShareUrl } from "../../utils/discovery";
import { useAuthStore } from "../../store/authStore";
import useFeedUpdates from "../../websocket/useFeedUpdates";
import { formatTimeAgo } from "../../utils/date";

const getAvatarContent = (author) => {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={author.fullName || author.username} className="detail-page-avatar" />;
  }
  return <div className="detail-page-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{(author?.fullName || author?.username || "V").charAt(0).toUpperCase()}</div>;
};



export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(token);
  const { data, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id)
  });

  useFeedUpdates({
    contentType: "POST",
    contentId: id,
    enabled: isAuthenticated,
    queryKeys: [
      ["post", id],
      ["comments", "POST", id]
    ]
  });

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this post? This action will remove it from the active platform view.");
    if (!confirmed) {
      return;
    }

    await deletePost(id);
    navigate(routes.posts);
  };

  if (isLoading) {
    return <div className="card">Loading post...</div>;
  }

  if (!data) {
    return <div className="card">Post not found.</div>;
  }

  const isOwner = currentUser?.id && data.author?.id === currentUser.id;
  const galleryItems = buildPostGalleryItems(data);
  const detailPath = getContentDetailPath("POST", id);
  const profilePath = data.author?.username ? routes.profile.replace(":username", data.author.username) : routes.home;
  const landingPostsHref = `${routes.landing}#posts`;
  const authorLabel = (
    <>
      {getAvatarContent(data.author)}
      <span>{data.author?.fullName || data.author?.username || "Anonymous"}</span>
    </>
  );

  return (
    <div className="section detail-page-shell">
      <div className="card detail-page-card">
        <div className="detail-page-header">
          <div className="detail-page-header-top">
            <div className="feed-badges">
              <span className="feed-badge feed-badge--primary">Post</span>
              {data.category?.name && (
                <span className="feed-badge feed-badge--success"><Folder size={12} />{data.category.name}</span>
              )}
              {data.postType && <span className="feed-badge feed-badge--primary">{data.postType}</span>}
            </div>
            
            <div className="detail-page-actions">
              {isOwner && (
                <OwnerContentControls
                  editPath={routes.postEdit.replace(":id", data.id)}
                  onDelete={handleDelete}
                  deleteLabel="Delete post"
                />
              )}
              {isAuthenticated ? (
                <Link to={routes.posts} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </Link>
              ) : (
                <a href={landingPostsHref} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </a>
              )}
            </div>
          </div>

          <div className="detail-page-header-main">
            <h1 className="detail-page-title">Post updates</h1>
            <div className="detail-page-meta">
              {isAuthenticated ? (
                <Link to={profilePath} className="detail-page-author">{authorLabel}</Link>
              ) : (
                <span className="detail-page-author detail-page-author--static">{authorLabel}</span>
              )}
              <span className="detail-page-date"><CalendarDays size={14} /> {formatTimeAgo(data.createdAt)}</span>
            </div>
          </div>
        </div>

        <MediaGallery items={galleryItems} title="Post gallery" />

        <section className="detail-copy-card">
          <div className="detail-copy-card__label">
            <MessageSquareText size={15} />
            Full post
          </div>
          <RichTextContent value={data.content} fallback="No post content yet." />
        </section>

        {data.tags?.length > 0 && (
          <section className="detail-copy-card">
            <div className="detail-copy-card__label">
              <Folder size={15} />
              Tags
            </div>
            <div className="tag-list">
              {data.tags.map((tag) => (
                <span key={tag} className="tag-chip">{tag}</span>
              ))}
            </div>
          </section>
        )}

        <ContentActions
          contentType="POST"
          contentId={id}
          counts={{
            likeCount: data.likeCount,
            commentCount: data.commentCount,
            saveCount: data.saveCount,
            shareCount: data.shareCount
          }}
          queryKeys={[["post", id], ["posts"]]}
          shareUrl={buildShareUrl(detailPath)}
          disabled={!isAuthenticated || data.active === false}
          disabledReason={!isAuthenticated ? "Sign in to interact with this post." : "This post is inactive right now."}
        />
      </div>
      <CommentThread
        contentType="POST"
        contentId={id}
        readOnly={!isAuthenticated}
        loginPath={routes.login}
        lockedMessage="Sign in to comment or reply on this post."
      />
    </div>
  );
}