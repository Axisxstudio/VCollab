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
  Mail,
  MessageCircle,
  Power,
  Share2,
  User,
  UserRound,
  Youtube,
  BookOpen,
  FileText
} from "lucide-react";
import ContactOwnerModal from "../../components/messaging/ContactOwnerModal";
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
import ShareModal from "../../components/interactions/ShareModal"; // Assuming ShareModal is also needed based on the state variable
import SEO from "../../components/seo/SEO";

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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
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

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(data.youtubeUrl);
  const contactContext = `Project: ${data.title}`;

  const authorLabel = (
    <>
      {getAvatarContent(data.owner)}
      <span>{data.owner?.fullName || data.owner?.username || "VCollab member"}</span>
    </>
  );

  return (
    <div className="stellar-seamless-wrapper">
      <SEO 
        title={data.title} 
        description={data.shortDesc || `Check out ${data.title} on VCollab.`} 
        keywords={data.tags?.join(", ")}
        image={galleryItems[0]?.url || "/VCollab_hero.png"}
      />
      <div className="stellar-content-shell">
        {/* Breadcrumbs & Header */}
        <div className="stellar-hero-head">
          <div className="stellar-mini-breadcrumbs">
             <span>PROJECT</span>
             <span className="stellar-sep">•</span>
             <span>{data.category?.name?.toUpperCase() || "GENERAL"}</span>
          </div>
          <h1 className="stellar-main-title">{data.title}</h1>
          <div className="stellar-meta-pill-box">
             <span className="stellar-meta-pill"><Globe size={12} /> {data.visibility}</span>
             <span className="stellar-meta-pill"><Power size={12} /> {data.active ? "Active" : "Inactive"}</span>
             <span className="stellar-meta-pill"><CalendarDays size={12} /> {formatTimeAgo(data.createdAt)}</span>
          </div>
        </div>

        {/* Hero Gallery - No container, just rounded corners */}
        <div className="stellar-gallery-hero">
           <MediaGallery items={galleryItems} title={data.title} variant="detail" />
        </div>

        {/* Two Column Layout - Transparent feel */}
        <div className="stellar-layout-grid">
          <div className="stellar-primary-col">
            <div className="stellar-author-card-minimal">
              <div className="stellar-author-avatar">
                {data.owner?.profileImage ? (
                  <img src={data.owner.profileImage} alt="Owner" />
                ) : (
                  <div className="avatar-placeholder">{(data.owner?.username || "A").charAt(0)}</div>
                )}
                <div className="stellar-author-ring"></div>
              </div>
              <div className="stellar-author-naming">
                <h4>{data.owner?.fullName || data.owner?.username}</h4>
                <p>{data.owner?.username}</p>
              </div>
              
              <div className="stellar-header-stats">
                 <div className="stellar-h-stat">
                    <Heart size={14} />
                    <span>{data.likeCount || 0}</span>
                 </div>
                 <div className="stellar-h-stat">
                    <MessageCircle size={14} />
                    <span>{data.commentCount || 0}</span>
                 </div>
                 <div className="stellar-h-stat">
                    <Bookmark size={14} />
                    <span>{data.saveCount || 0}</span>
                 </div>
                 <div className="stellar-h-stat">
                    <Share2 size={14} />
                    <span>{data.shareCount || 0}</span>
                 </div>
              </div>
            </div>

            <div className="stellar-section-flat">
               <h3 className="stellar-section-label"><LayoutDashboard size={16} /> Overview</h3>
               <div className="stellar-section-content">
                  <RichTextContent value={data.shortDesc} fallback="Project overview is currently unavailable." />
               </div>
            </div>

            <div className="stellar-section-flat">
               <h3 className="stellar-section-label"><FileCode2 size={16} /> Technical Details</h3>
               <div className="stellar-section-content">
                  <RichTextContent value={data.fullDesc} fallback="No detailed technical information has been provided." />
               </div>
            </div>

            <div className="stellar-section-flat">
               <h3 className="stellar-section-label"><Heart size={16} /> Tech Stack</h3>
               <div className="stellar-section-content">
                  {data.techStack?.length > 0 ? (
                    <div className="stellar-tag-group">
                      {data.techStack.map(tech => <span key={tech} className="stellar-tag-v2">{tech}</span>)}
                    </div>
                  ) : (
                    <p className="stellar-muted-text">None specified.</p>
                  )}
               </div>
            </div>

            {data.tags?.length > 0 && (
              <div className="stellar-section-flat">
                 <h3 className="stellar-section-label"><Folder size={16} /> Tags</h3>
                 <div className="stellar-section-content">
                    <div className="stellar-tag-group">
                       {data.tags.map(tag => <span key={tag} className="stellar-tag-v2">#{tag}</span>)}
                    </div>
                 </div>
              </div>
            )}

            {/* Contact Owner Section */}
            <div className="contact-owner-card">
              <div className="contact-owner-info">
                {data.owner?.profileImage ? (
                  <img src={data.owner.profileImage} alt="Owner" className="contact-owner-avatar" />
                ) : (
                  <div className="contact-owner-avatar" style={{ background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} />
                  </div>
                )}
                <div className="contact-owner-details">
                  <h4>{data.owner?.fullName || data.owner?.username}</h4>
                  <p>Talk to owner about project or price request</p>
                </div>
              </div>
              <button 
                 className="btn-contact-owner"
                 onClick={() => {
                    if (!isAuthenticated) {
                      const params = new URLSearchParams({
                        userId: String(data.owner?.id || ""),
                        context: contactContext
                      });
                      navigate(routes.login, {
                        state: {
                          from: {
                            pathname: routes.messages,
                            search: `?${params.toString()}`
                          }
                        }
                      });
                      return;
                    }
                    setIsContactOpen(true);
                  }}
               >
                <Mail size={18} /> Contact Owner
              </button>
            </div>

            {(data.youtubeUrl || data.pdfUrl || data.courseUrl) && (
              <div className="stellar-section-flat">
                <h3 className="stellar-section-label"><BookOpen size={16} /> Study Materials & Resources</h3>
                <div className="stellar-section-content">
                  {youtubeId && (
                    <div style={{ marginBottom: "20px", borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "16/9", maxWidth: "480px" }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "20px", marginTop: "10px", alignItems: "center" }}>
                    {data.youtubeUrl && (
                      <a 
                        href={data.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="stellar-resource-icon-btn" 
                        data-label="Learning Resource on YouTube"
                      >
                        <Youtube size={32} color="#FF0000" />
                        <span>Video</span>
                      </a>
                    )}
                    {data.pdfUrl && (
                      <a 
                        href={data.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="stellar-resource-icon-btn" 
                        data-label="PDF Learning Resource"
                      >
                        <FileText size={32} color="#EF4444" />
                        <span>PDF</span>
                      </a>
                    )}
                    {data.courseUrl && (
                      <a 
                        href={data.courseUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="stellar-resource-icon-btn" 
                        data-label="Learning Course Material"
                      >
                        <BookOpen size={32} color="#8B5CF6" />
                        <span>Course</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="stellar-secondary-col">
            <div className="stellar-engagement-sidebar">
               {/* Redundant category removed as it is in the header breadcrumbs */}
            </div>
          </aside>
        </div>

        {/* Global Footer Actions */}
        <div className="stellar-global-actions">
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

        <div className="stellar-comment-zone">
           <CommentThread
              contentType="PROJECT"
              contentId={id}
              readOnly={!isAuthenticated}
              loginPath={routes.login}
              lockedMessage="Sign in to join the conversation."
            />
        </div>
      </div>

      <ContactOwnerModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)}
        owner={data.owner}
        context={contactContext}
      />
    </div>
  );
}
