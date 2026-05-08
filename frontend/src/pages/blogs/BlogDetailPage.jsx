import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, CalendarDays, Folder, UserRound } from "lucide-react";
import MediaGallery from "../../components/media/MediaGallery";
import ContentActions from "../../components/interactions/ContentActions";
import CommentThread from "../../components/comments/CommentThread";
import OwnerContentControls from "../../components/content/OwnerContentControls";
import RichTextContent from "../../components/content/RichTextContent";
import { getBlog, deleteBlog } from "../../services/blog.service";
import { routes } from "../../config/routes";
import { buildBlogGalleryItems, getContentDetailPath } from "../../utils/content";
import { buildShareUrl } from "../../utils/discovery";
import { useAuthStore } from "../../store/authStore";
import useFeedUpdates from "../../websocket/useFeedUpdates";
import { formatTimeAgo } from "../../utils/date";
import SEO from "../../components/seo/SEO";

const getAvatarContent = (author) => {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={author.fullName || author.username} className="detail-page-avatar" />;
  }
  return <div className="detail-page-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{(author?.fullName || author?.username || "V").charAt(0).toUpperCase()}</div>;
};



export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(token);
  const { data, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlog(id)
  });

  useFeedUpdates({
    contentType: "BLOG",
    contentId: id,
    enabled: isAuthenticated,
    queryKeys: [
      ["blog", id],
      ["comments", "BLOG", id]
    ]
  });

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this blog? This action will remove it from the active platform view.");
    if (!confirmed) {
      return;
    }

    await deleteBlog(id);
    navigate(routes.blogs);
  };

  if (isLoading) {
    return <div className="card">Loading blog...</div>;
  }

  if (!data) {
    return <div className="card">Blog not found.</div>;
  }

  const isOwner = currentUser?.id && data.author?.id === currentUser.id;
  const galleryItems = buildBlogGalleryItems(data);
  const detailPath = getContentDetailPath("BLOG", id);
  const profilePath = data.author?.username ? routes.profile.replace(":username", data.author.username) : routes.home;
  const landingBlogsHref = `${routes.landing}#blogs`;
  const authorLabel = (
    <>
      {getAvatarContent(data.author)}
      <span>{data.author?.fullName || data.author?.username || "Anonymous"}</span>
    </>
  );

  return (
    <div className="section detail-page-shell">
      <SEO 
        title={data.title} 
        description={data.content?.substring(0, 160) || `Read ${data.title} on VCollab.`} 
        keywords={data.tags?.join(", ")}
        image={galleryItems[0]?.url || "/VCollab_hero.png"}
      />
      <div className="card detail-page-card">
        <div className="detail-page-header">
          <div className="detail-page-header-top">
            <div className="feed-badges">
              <span className="feed-badge feed-badge--primary">Blog</span>
              {data.category?.name && (
                <span className="feed-badge feed-badge--success"><Folder size={12} />{data.category.name}</span>
              )}
            </div>
            
            <div className="detail-page-actions">
              {isOwner && (
                <OwnerContentControls
                  editPath={routes.blogEdit.replace(":id", data.id)}
                  onDelete={handleDelete}
                  deleteLabel="Delete blog"
                />
              )}
              {isAuthenticated ? (
                <Link to={routes.blogs} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </Link>
              ) : (
                <a href={landingBlogsHref} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </a>
              )}
            </div>
          </div>

          <div className="detail-page-header-main">
            <h1 className="detail-page-title">{data.title}</h1>
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

        <MediaGallery items={galleryItems} title={`${data.title} gallery`} />

        <section className="detail-copy-card">
          <div className="detail-copy-card__label">
            <BookOpenText size={15} />
            Full article
          </div>
          <RichTextContent value={data.content} fallback="No blog content yet." />
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
          contentType="BLOG"
          contentId={id}
          counts={{
            likeCount: data.likeCount,
            commentCount: data.commentCount,
            saveCount: data.saveCount,
            shareCount: data.shareCount
          }}
          queryKeys={[["blog", id], ["blogs"]]}
          shareUrl={buildShareUrl(detailPath)}
          disabled={!isAuthenticated || data.active === false}
          disabledReason={!isAuthenticated ? "Sign in to interact with this blog." : "This blog is inactive right now."}
        />
      </div>
      <CommentThread
        contentType="BLOG"
        contentId={id}
        readOnly={!isAuthenticated}
        loginPath={routes.login}
        lockedMessage="Sign in to comment or reply on this blog."
      />
    </div>
  );
}