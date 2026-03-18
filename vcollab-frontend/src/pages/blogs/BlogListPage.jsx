import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Power, Layers, User, FileText, Plus } from "lucide-react";
import SchoolContentToggle from "../../components/content/SchoolContentToggle";
import DiscoveryToolbar from "../../components/discovery/DiscoveryToolbar";
import HoverActionPill from "../../components/discovery/HoverActionPill";
import ContentActions from "../../components/interactions/ContentActions";
import FollowButton from "../../components/interactions/FollowButton";
import useViewerProfile from "../../hooks/useViewerProfile";
import MediaGallery from "../../components/media/MediaGallery";
import { routes } from "../../config/routes";
import { listBlogs, listUserBlogs } from "../../services/blog.service";
import {
  buildDiscoveryParams,
  buildDiscoveryQueryKey,
  buildShareUrl,
  createInitialDiscoveryFilters,
  formatDate,
  getProfilePath
} from "../../utils/discovery";
import { buildBlogGalleryItems } from "../../utils/content";
import { truncateRichText } from "../../utils/richText";
import { shouldShowContentForViewer, sortContentForViewerPriority } from "../../utils/schoolContent";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const PAGE_SIZE = 9;

function getAvatar(author) {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={author.fullName || author.username} />;
  }

  return (author?.fullName || author?.username || "V").charAt(0).toUpperCase();
}

export default function BlogListPage() {
  const { authUser: currentUser, viewerEducationType, isUniversityViewer } = useViewerProfile();
  const [filters, setFilters] = useState(createInitialDiscoveryFilters());
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("All");
  const [showSchool, setShowSchool] = useState(false);

  const effectiveFilters = viewMode === "Mine" ? { ...filters, owner: currentUser?.username } : filters;
  const queryKey = buildDiscoveryQueryKey(`blogs-${viewMode}`, effectiveFilters, page);

  useEffect(() => {
    if (!isUniversityViewer && showSchool) {
      setShowSchool(false);
    }
  }, [isUniversityViewer, showSchool]);
  
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      if (viewMode === "Mine") {
        return listUserBlogs(currentUser.username, { page, size: PAGE_SIZE });
      }
      const params = buildDiscoveryParams(filters, page, PAGE_SIZE);
      return listBlogs(params);
    },
    enabled: viewMode !== "Mine" || !!currentUser?.username
  });

  useFeedUpdates({
    contentType: "BLOG",
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

  if (isLoading) {
    return <div className="card">Loading blogs...</div>;
  }

  if (isError) {
    return <div className="card">We could not load blogs right now.</div>;
  }

  const blogs = data?.content || [];
  const prioritizedBlogs = sortContentForViewerPriority(
    blogs,
    viewerEducationType,
    (blog) => ({
      targetType: blog.targetType,
      authorEducationType: blog.author?.educationType
    })
  );
  const visibleBlogs = prioritizedBlogs.filter((blog) => shouldShowContentForViewer({
    viewerEducationType,
    showSchool,
    targetType: blog.targetType,
    authorEducationType: blog.author?.educationType
  }));
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || blogs.length;
  const resultsMeta = isUniversityViewer && showSchool
    ? `${visibleBlogs.length} school blog${visibleBlogs.length === 1 ? "" : "s"} on this page`
    : isUniversityViewer && !showSchool
    ? `${visibleBlogs.length} visible on this page${totalElements ? ` | ${totalElements} total found` : ""}`
    : `${totalElements} blog${totalElements === 1 ? "" : "s"} found`;

  return (
    <div className="section">
      <div className="project-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "4px" }}>Insights & Stories</h2>
          <p className="profile-meta">Longer-form insights, tutorials, and academic project stories.</p>
        </div>
        <HoverActionPill
          icon={Plus}
          label="Write Blog"
          to={routes.blogCreate}
          variant="primary"
        />
      </div>

      <DiscoveryToolbar
        title="Refine blog discovery"
        description="Sort technical stories by popularity, search tutorials by keyword, or track work from specific authors."
        categoryType="BLOG"
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        searchPlaceholder="Search blog titles, article content, and contributor names"
      />

      <div className="discovery-action-rail">
        <div className="discovery-action-rail__group">
          {currentUser && (
            <>
              <HoverActionPill
                icon={Layers}
                label="All Blogs"
                onClick={() => { setViewMode("All"); setPage(0); }}
                active={viewMode === "All"}
              />
              <HoverActionPill
                icon={User}
                label="My Blogs"
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
        <h3>{viewMode === "Mine" ? "My Blog Results" : "Global Blog Results"}</h3>
        <span className="discovery-results-meta">{resultsMeta}</span>
      </div>

      {visibleBlogs.length === 0 ? (
        <div className="card discovery-empty">
          <h3>No blogs match these filters right now</h3>
          <p>
            {blogs.length > 0 && isUniversityViewer && showSchool
              ? "There is no school content on this page right now. Switch back to main content or try another page."
              : blogs.length > 0 && isUniversityViewer && !showSchool
              ? "School content is hidden on this page. Turn on school content if you want to include those results."
              : "Try fewer filters to pull in more tutorials, stories, and technical write-ups."}
          </p>
        </div>
      ) : (
        <div className="discovery-content-grid">
          {visibleBlogs.map((blog) => {
            const detailPath = routes.blogDetail.replace(":id", blog.id);
            const profilePath = getProfilePath(blog.author?.username);
            const isOwner = Boolean(currentUser?.id && blog.author?.id === currentUser.id);
            const canOpen = blog.active !== false || isOwner;
            const galleryItems = buildBlogGalleryItems(blog);

            return (
              <article key={blog.id} className={`content-surface ${!canOpen ? "discovery-card--disabled" : ""} ${isOwner ? "is-owner" : ""}`}>
                <div className="content-surface__header">
                  <div className="content-surface__identity">
                    <Link to={profilePath} className="content-surface__avatar">{getAvatar(blog.author)}</Link>
                    <div className="content-surface__author-box">
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Link to={profilePath} className="content-surface__author">
                          {blog.author?.fullName || blog.author?.username || "VCollab member"}
                        </Link>
                        <FollowButton userId={blog.author?.id} username={blog.author?.username} />
                      </div>
                      <div className="content-surface__meta">
                        <span className="content-surface__date">{formatDate(blog.createdAt)}</span>
                        <span className="content-badge-inline content-badge-inline--blog">
                          <FileText size={12} strokeWidth={2.5} /> Blog
                        </span>
                        {blog.category?.name && (
                          <span className="content-surface__category">{blog.category.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="feed-badges">
                    {blog.active === false && <span className="feed-badge feed-badge--inactive"><Power size={12} />Inactive</span>}
                  </div>
                </div>

                <MediaGallery items={galleryItems} title={blog.title} variant="card" aspect="landscape" showCaption={false} />

                <div>
                  <h3 className="content-surface__title" style={{ marginBottom: '4px' }}>{blog.title}</h3>
                  <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <p className="content-surface__excerpt">
                      {truncateRichText(blog.content, 180)}
                    </p>
                    <Link to={detailPath} className="content-more-link-inline">View More</Link>
                  </div>
                </div>

                {blog.tags?.length > 0 && (
                  <div className="tag-list">
                    {blog.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                )}

                <ContentActions
                  contentType="BLOG"
                  contentId={blog.id}
                  counts={blog}
                  queryKeys={[queryKey]}
                  shareUrl={buildShareUrl(detailPath)}
                  layout="facebook"
                  disabled={!canOpen}
                  disabledReason="This blog is inactive. Only the owner or admin can open it."
                  authorUsername={blog.author?.username}
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
