import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Power, Layers, User, Layout, Plus, Youtube, BookOpen, FileText } from "lucide-react";
import SchoolContentToggle from "../../components/content/SchoolContentToggle";
import DiscoveryToolbar from "../../components/discovery/DiscoveryToolbar";
import HoverActionPill from "../../components/discovery/HoverActionPill";
import ContentActions from "../../components/interactions/ContentActions";
import FollowButton from "../../components/interactions/FollowButton";
import useViewerProfile from "../../hooks/useViewerProfile";
import MediaGallery from "../../components/media/MediaGallery";
import { routes } from "../../config/routes";
import { listProjects, listUserProjects } from "../../services/project.service";
import {
  buildDiscoveryParams,
  buildDiscoveryQueryKey,
  buildShareUrl,
  createInitialDiscoveryFilters,
  formatDate,
  getProfilePath
} from "../../utils/discovery";
import { buildProjectGalleryItems } from "../../utils/content";
import { truncateRichText } from "../../utils/richText";
import { shouldShowContentForViewer, sortContentForViewerPriority } from "../../utils/schoolContent";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const PAGE_SIZE = 9;

function getAvatar(owner) {
  if (owner?.profileImage) {
    return <img src={owner.profileImage} alt={owner.fullName || owner.username} />;
  }

  return (owner?.fullName || owner?.username || "V").charAt(0).toUpperCase();
}

export default function ProjectListPage() {
  const { authUser: currentUser, viewerEducationType, isUniversityViewer } = useViewerProfile();
  const [filters, setFilters] = useState(createInitialDiscoveryFilters());
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("All"); // "All" or "Mine"
  const [showSchool, setShowSchool] = useState(false);

  // Use owner filter to host the username in the query key for unique user caching
  const effectiveFilters = viewMode === "Mine" ? { ...filters, owner: currentUser?.username } : filters;
  const queryKey = buildDiscoveryQueryKey(`projects-${viewMode}`, effectiveFilters, page);

  useEffect(() => {
    if (!isUniversityViewer && showSchool) {
      setShowSchool(false);
    }
  }, [isUniversityViewer, showSchool]);
  
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      if (viewMode === "Mine") {
        // Only pass pagination to user-specific endpoint to avoid parameter mapping issues
        return listUserProjects(currentUser.username, { page, size: PAGE_SIZE });
      }
      const params = buildDiscoveryParams(filters, page, PAGE_SIZE);
      return listProjects(params);
    },
    enabled: viewMode !== "Mine" || !!currentUser?.username
  });

  useFeedUpdates({
    contentType: "PROJECT",
    queryKeys: [queryKey]
  });

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleReset = () => {
    setPage(0);
    setFilters(createInitialDiscoveryFilters());
    setViewMode("All");
  };



  const projects = data?.content || [];
  const prioritizedProjects = sortContentForViewerPriority(
    projects,
    viewerEducationType,
    (project) => ({
      targetType: project.targetType,
      authorEducationType: project.owner?.educationType
    })
  );
  const visibleProjects = prioritizedProjects.filter((project) => shouldShowContentForViewer({
    viewerEducationType,
    showSchool,
    targetType: project.targetType,
    authorEducationType: project.owner?.educationType
  }));
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || projects.length;
  const resultsMeta = isUniversityViewer && showSchool
    ? `${visibleProjects.length} school project${visibleProjects.length === 1 ? "" : "s"} on this page`
    : isUniversityViewer && !showSchool
    ? `${visibleProjects.length} visible on this page${totalElements ? ` | ${totalElements} total found` : ""}`
    : `${totalElements} project${totalElements === 1 ? "" : "s"} found`;

  return (
    <div className="section">
      <div className="project-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "4px" }}>Projects Pipeline</h2>
          <p className="profile-meta">Monitor development cycles and explore community contributions.</p>
        </div>
        <HoverActionPill
          icon={Plus}
          label="Create Project"
          to={routes.projectCreate}
          variant="primary"
        />
      </div>

      <DiscoveryToolbar
        title="Refine project discovery"
        description="Search by topic, tag, contributor, category, or time range to find the right build inspiration faster."
        categoryType="PROJECT"
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        searchPlaceholder="Search project titles, descriptions, and contributor names"
      />

      <div className="discovery-action-rail">
        <div className="discovery-action-rail__group">
          {currentUser && (
            <>
              <HoverActionPill
                icon={Layers}
                label="All Projects"
                onClick={() => { setViewMode("All"); setPage(0); }}
                active={viewMode === "All"}
              />
              <HoverActionPill
                icon={User}
                label="My Projects"
                onClick={() => { setViewMode("Mine"); setPage(0); }}
                active={viewMode === "Mine"}
              />
            </>
          )}
          <SchoolContentToggle
            isVisible={isUniversityViewer}
            showSchool={showSchool}
            onToggle={() => { setShowSchool((current) => !current); setPage(0); }}
          />
        </div>
      </div>

      <div className="discovery-results-header">
        <h3>{viewMode === "Mine" ? "My Project Results" : "Global Project Results"}</h3>
        <span className="discovery-results-meta">{isLoading ? "Loading..." : resultsMeta}</span>
      </div>

      {isLoading ? (
        <div className="card">Loading projects...</div>
      ) : isError ? (
        <div className="card discovery-empty">We could not load projects right now.</div>
      ) : visibleProjects.length === 0 ? (
        <div className="card discovery-empty">
          <h3>No projects match these filters right now</h3>
          <p>
            {projects.length > 0 && isUniversityViewer && showSchool
              ? "There is no school content on this page right now. Switch back to main content or try another page."
              : projects.length > 0 && isUniversityViewer && !showSchool
              ? "School content is hidden on this page. Turn on school content if you want to include those results."
              : "Try removing some filters or broadening your search to see more community work."}
          </p>
        </div>
      ) : (
        <div className="discovery-content-grid discovery-content-grid--two-columns">
          {visibleProjects.map((project) => {
            const detailPath = routes.projectDetail.replace(":id", project.id);
            const profilePath = getProfilePath(project.owner?.username);
            const isOwner = Boolean(currentUser?.id && project.owner?.id === currentUser.id);
            const canOpen = project.active !== false || isOwner;
            const galleryItems = buildProjectGalleryItems(project);

            return (
              <article key={project.id} className={`content-surface ${!canOpen ? "discovery-card--disabled" : ""} ${isOwner ? "is-owner" : ""}`}>
                <div className="content-surface__header">
                  <div className="content-surface__identity">
                    <Link to={profilePath} className="content-surface__avatar">
                      {getAvatar(project.owner)}
                    </Link>
                    <div className="content-surface__author-box">
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Link to={profilePath} className="content-surface__author">
                          {project.owner?.fullName || project.owner?.username || "VCollab member"}
                        </Link>
                        <FollowButton userId={project.owner?.id} username={project.owner?.username} />
                      </div>
                      <div className="content-surface__meta">
                        {project.createdAt && <span className="content-surface__date">{formatDate(project.createdAt)}</span>}
                        <span className="content-badge-inline content-badge-inline--project">
                          <Layout size={12} strokeWidth={2.5} /> Project
                        </span>
                        {project.category?.name && (
                          <span className="content-surface__category">{project.category.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="feed-badges">
                    {project.active === false && (
                      <span className="feed-badge feed-badge--inactive"><Power size={12} />Inactive</span>
                    )}
                  </div>
                </div>

                <MediaGallery items={galleryItems} title={project.title} variant="card" aspect="landscape" showCaption={false} />

                <div>
                  <h3 className="content-surface__title" style={{ marginBottom: '4px' }}>{project.title}</h3>
                  <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <p className="content-surface__excerpt">
                      {truncateRichText(project.shortDesc || project.fullDesc, 180)}
                    </p>
                    <Link to={detailPath} className="content-more-link-inline">View More</Link>
                  </div>
                </div>

                {project.tags?.length > 0 && (
                  <div className="tag-list" style={{ marginTop: '8px' }}>
                    {project.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag-hash">#{tag}</span>
                    ))}
                  </div>
                )}

                {project.techStack?.length > 0 && (
                  <div className="tag-list">
                    {project.techStack.slice(0, 4).map((item) => (
                      <span key={item} className="tag-chip">{item}</span>
                    ))}
                  </div>
                )}

                <div className="content-surface__footer">
                  <div className="feed-link-row">
                    {canOpen && project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer" className="icon-chip-btn" title="GitHub Repository">
                        <Github size={16} />
                      </a>
                    )}
                    {canOpen && project.demoUrl && (
                      <a href={project.demoUrl} target="_blank" rel="noreferrer" className="icon-chip-btn" title="Live Demo">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {canOpen && project.youtubeUrl && (
                      <a href={project.youtubeUrl} target="_blank" rel="noreferrer" className="icon-chip-btn" title="Watch on YouTube">
                        <Youtube size={16} style={{ color: "#FF0000" }} />
                      </a>
                    )}
                    {canOpen && project.pdfUrl && (
                      <a href={project.pdfUrl} target="_blank" rel="noreferrer" className="icon-chip-btn" title="View PDF Document">
                        <FileText size={16} style={{ color: "#EF4444" }} />
                      </a>
                    )}
                    {canOpen && project.courseUrl && (
                      <a href={project.courseUrl} target="_blank" rel="noreferrer" className="icon-chip-btn" title="Access Course Material">
                        <BookOpen size={16} style={{ color: "#8B5CF6" }} />
                      </a>
                    )}
                  </div>
                </div>

                <ContentActions
                  contentType="PROJECT"
                  contentId={project.id}
                  counts={project}
                  queryKeys={[queryKey]}
                  shareUrl={buildShareUrl(detailPath)}
                  layout="facebook"
                  disabled={!canOpen}
                  disabledReason="This project is inactive. Only the owner or admin can open it."
                  authorUsername={project.owner?.username}
                />
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button type="button" className="btn-outline" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0}>
            Previous
          </button>
          <span className="discovery-results-meta">Page {page + 1} of {totalPages}</span>
          <button type="button" className="btn-outline" onClick={() => setPage((current) => current + 1)} disabled={page + 1 >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
