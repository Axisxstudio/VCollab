import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  ExternalLink,
  FileCode2,
  Folder,
  Globe,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Power,
  Share2,
  UserRound
} from "lucide-react";
import MediaGallery from "../../components/media/MediaGallery";
import { getProject, deleteProject } from "../../services/project.service";
import { createProjectRequest } from "../../services/projectrequest.service";
import { useAuthStore } from "../../store/authStore";
import ContentActions from "../../components/interactions/ContentActions";
import CommentThread from "../../components/comments/CommentThread";
import OwnerContentControls from "../../components/content/OwnerContentControls";
import RichTextContent from "../../components/content/RichTextContent";
import { routes } from "../../config/routes";
import { buildProjectGalleryItems, getContentDetailPath } from "../../utils/content";
import { buildShareUrl } from "../../utils/discovery";
import { formatTimeAgo } from "../../utils/date";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const getAvatarContent = (author) => {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={author.fullName || author.username} className="detail-page-avatar" />;
  }
  return <div className="detail-page-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{(author?.fullName || author?.username || "V").charAt(0).toUpperCase()}</div>;
};



export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(token);
  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id)
  });
  const [requestMessage, setRequestMessage] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestNote, setRequestNote] = useState("");

  useFeedUpdates({
    contentType: "PROJECT",
    contentId: id,
    enabled: isAuthenticated,
    queryKeys: [
      ["project", id],
      ["comments", "PROJECT", id]
    ]
  });

  const handleRequest = async () => {
    if (!isAuthenticated || requesting) return;
    setRequesting(true);
    setRequestNote("");
    try {
      await createProjectRequest({
        projectId: id,
        message: requestMessage.trim()
      });
      setRequestMessage("");
      setRequestNote("Request sent to the project owner.");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to send request.";
      setRequestNote(message);
    } finally {
      setRequesting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this project? This action will remove it from the active platform view.");
    if (!confirmed) {
      return;
    }

    await deleteProject(id);
    navigate(routes.projects);
  };

  if (isLoading) {
    return <div className="card">Loading project...</div>;
  }

  if (!data) {
    return <div className="card">Project not found.</div>;
  }

  const isOwner = currentUser?.id && data.owner?.id === currentUser.id;
  const galleryItems = buildProjectGalleryItems(data);
  const detailPath = getContentDetailPath("PROJECT", id);
  const profilePath = data.owner?.username ? routes.profile.replace(":username", data.owner.username) : routes.home;
  const landingProjectsHref = `${routes.landing}#projects`;
  const interactionsDisabled = !isAuthenticated || data.active === false;
  const interactionDisabledReason = !isAuthenticated
    ? "Sign in to like, save, share, report, and comment on this project."
    : "This project is inactive right now.";
  const hasProtectedResources = Boolean(data.githubUrl || data.demoUrl || data.hasGithubUrl || data.hasDemoUrl);
  const authorLabel = (
    <>
      {getAvatarContent(data.owner)}
      <span>{data.owner?.fullName || data.owner?.username || "VCollab member"}</span>
    </>
  );

  return (
    <div className="section detail-page-shell">
      <div className="card detail-page-card">
        <div className="detail-page-header">
          <div className="detail-page-header-top">
            <div className="feed-badges">
              <span className="feed-badge feed-badge--primary">Project</span>
              {data.category?.name && (
                <span className="feed-badge feed-badge--success">
                  <Folder size={12} />
                  {data.category.name}
                </span>
              )}
            </div>
            
            <div className="detail-page-actions">
              {isOwner && (
                <OwnerContentControls
                  editPath={routes.projectEdit.replace(":id", data.id)}
                  onDelete={handleDelete}
                  deleteLabel="Delete project"
                />
              )}
              {isAuthenticated ? (
                <Link to={routes.projects} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </Link>
              ) : (
                <a href={landingProjectsHref} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back
                </a>
              )}
            </div>
          </div>

          <div className="detail-page-header-main">
            <h1 className="detail-page-title">{data.title}</h1>
            <div className="detail-page-meta">
              {isAuthenticated ? (
                <Link to={profilePath} className="detail-page-author">
                  {authorLabel}
                </Link>
              ) : (
                <span className="detail-page-author detail-page-author--static">{authorLabel}</span>
              )}
              <span className="detail-page-date"><CalendarDays size={14} /> {formatTimeAgo(data.createdAt)}</span>
              <span><Globe size={14} /> {data.visibility}</span>
              <span><Power size={14} /> {data.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <MediaGallery items={galleryItems} title={`${data.title} gallery`} />

        <div className="detail-page-facts">
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><Folder size={14} /> Category</span>
            <strong>{data.category?.name || "Uncategorized"}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><CalendarDays size={14} /> Updated</span>
            <strong>{formatTimeAgo(data.updatedAt || data.createdAt)}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><Heart size={14} /> Likes</span>
            <strong>{data.likeCount || 0}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><MessageCircle size={14} /> Comments</span>
            <strong>{data.commentCount || 0}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><Bookmark size={14} /> Saves</span>
            <strong>{data.saveCount || 0}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-card__label"><Share2 size={14} /> Shares</span>
            <strong>{data.shareCount || 0}</strong>
          </div>
        </div>

        <div className="detail-page-sections">
          <section className="detail-copy-card">
            <div className="detail-copy-card__label">
              <LayoutDashboard size={15} />
              Overview
            </div>
            <RichTextContent value={data.shortDesc} fallback="No short overview has been added for this project yet." />
          </section>

          <section className="detail-copy-card">
            <div className="detail-copy-card__label">
              <FileCode2 size={15} />
              Full details
            </div>
            <RichTextContent value={data.fullDesc} fallback="No full technical description has been added for this project yet." />
          </section>

          <section className="detail-copy-card">
            <div className="detail-copy-card__label">
              <FileCode2 size={15} />
              Tech stack
            </div>
            {data.techStack?.length > 0 ? (
              <div className="tag-list">
                {data.techStack.map((item) => (
                  <span key={item} className="tag-chip">{item}</span>
                ))}
              </div>
            ) : (
              <p>No tech stack details have been added yet.</p>
            )}
          </section>

          <section className="detail-copy-card">
            <div className="detail-copy-card__label">
              <Folder size={15} />
              Tags
            </div>
            {data.tags?.length > 0 ? (
              <div className="tag-list">
                {data.tags.map((tag) => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
              </div>
            ) : (
              <p>No tags have been added yet.</p>
            )}
          </section>
        </div>

        <ContentActions
          contentType="PROJECT"
          contentId={id}
          counts={{
            likeCount: data.likeCount,
            commentCount: data.commentCount,
            saveCount: data.saveCount,
            shareCount: data.shareCount
          }}
          queryKeys={[["project", id], ["projects"]]}
          shareUrl={buildShareUrl(detailPath)}
          disabled={interactionsDisabled}
          disabledReason={interactionDisabledReason}
        />
      </div>

      {!isOwner && isAuthenticated && (
        <div className="request-card">
          <h3>Request this project</h3>
          <p className="profile-meta">Send a note to the owner if you want access or collaboration details.</p>
          <textarea
            rows="3"
            value={requestMessage}
            placeholder="Add a short message (optional)"
            onChange={(event) => setRequestMessage(event.target.value)}
          />
          <button className="btn-primary" type="button" onClick={handleRequest} disabled={requesting}>
            {requesting ? "Sending..." : "Send Request"}
          </button>
          {requestNote && <div className="comment-muted">{requestNote}</div>}
        </div>
      )}

      {!isOwner && !isAuthenticated && (
        <div className="request-card request-card--locked">
          <h3>Want the project links or collaboration access?</h3>
          <p className="profile-meta">
            You can read the full project publicly, but requests, GitHub access, demo links, saves, likes, and comments require a VCollab account.
          </p>
          <div className="detail-login-lock__actions">
            <Link to={routes.login} className="btn-primary">Sign In</Link>
            <Link to={routes.register} className="btn-outline">Create account</Link>
          </div>
        </div>
      )}

      <CommentThread
        contentType="PROJECT"
        contentId={id}
        readOnly={!isAuthenticated}
        loginPath={routes.login}
        lockedMessage="Sign in to comment or reply on this project."
      />
    </div>
  );
}