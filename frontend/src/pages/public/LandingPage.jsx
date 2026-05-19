import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  BookOpenText,
  Sparkles,
  Calendar,
  Power,
  Users,
  FolderKanban,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import CommentModal from "../../components/comments/CommentModal";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/seo/SEO";
import useRealtimeLandingOverview from "../../hooks/useRealtimeLandingOverview";
import { routes } from "../../config/routes";
import { useAuthStore } from "../../store/authStore";
import { formatDate, truncateText } from "../../utils/discovery";
import "./landing-page.css";

function MediaSwiper({ media = [], fallbackIcon: FallbackIcon }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Array.isArray(media) ? media : [];

  if (items.length === 0) {
    return (
      <div className="lp-media-placeholder">
        <FallbackIcon size={32} />
      </div>
    );
  }

  const next = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentIndex((previous) => (previous + 1) % items.length);
  };

  const previous = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentIndex((current) => (current - 1 + items.length) % items.length);
  };

  return (
    <div className="lp-media-swiper">
      <div className="lp-media-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((item, index) => (
          <img
            key={`${typeof item === "string" ? item : item.url}-${index}`}
            src={typeof item === "string" ? item : item.url}
            alt={`Media ${index + 1}`}
            className="lp-media-img"
          />
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button className="lp-swiper-btn lp-swiper-btn--prev" onClick={previous}>
            <ChevronLeft size={16} />
          </button>
          <button className="lp-swiper-btn lp-swiper-btn--next" onClick={next}>
            <ChevronRight size={16} />
          </button>
          <div className="lp-swiper-dots">
            {items.map((_, index) => (
              <span key={index} className={`lp-swiper-dot ${index === currentIndex ? "active" : ""}`} />
            ))}
          </div>
          <div className="lp-swiper-counter">{currentIndex + 1}/{items.length}</div>
        </>
      )}
    </div>
  );
}

function ProjectCard({ project, delay = "0ms" }) {
  const owner = project.owner || {};
  const inactive = project.active === false;
  const detailPath = routes.projectDetail.replace(":id", project.id);
  const avatarUrl =
    owner.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      owner.fullName || owner.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  return (
    <article className={`lp-project-card reveal-up ${inactive ? "lp-project-card--inactive" : ""}`} style={{ "--delay": delay }}>
      <div className="lp-project-media-wrap">
        <MediaSwiper media={project.media || []} fallbackIcon={FolderKanban} />
      </div>

      <div className="lp-project-header">
        <img src={avatarUrl} alt={owner.fullName || owner.username || "Project owner"} className="lp-project-avatar" />
        <div className="lp-project-meta">
          <strong>{owner.fullName || owner.username}</strong>
          <div className="lp-project-meta-row">
            <span className="lp-badge lp-badge--project">Project</span>
            {inactive && (
              <span className="lp-badge lp-badge--inactive">
                <Power size={11} />
                Inactive
              </span>
            )}
            {project.createdAt && (
              <span className="lp-project-date">
                <Calendar size={11} />
                {formatDate(project.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="lp-project-body">
        <h3>{project.title}</h3>
        <p className="lp-project-desc">{project.shortDesc || project.fullDesc || ""}</p>

        {project.techStack && project.techStack.length > 0 && (
          <div className="lp-project-tech-stack">
            {project.techStack.slice(0, 3).map((tech, i) => (
              <span key={i} className="lp-tech-badge">{tech}</span>
            ))}
            {project.techStack.length > 3 && <span className="lp-tech-badge">+{project.techStack.length - 3}</span>}
          </div>
        )}

        {inactive && <span className="lp-disabled-note">Preview only. Only the owner or admin can open this project.</span>}
        {!inactive && (
          <div className="lp-card-footer-icon">
            <ChevronRight size={18} />
          </div>
        )}
      </div>
    </article>
  );
}

function ContentCard({ item, type, delay = "0ms" }) {
  const category = item.category?.name || (type === "blog" ? "Blog" : "Post");
  const inactive = item.active === false;
  const detailPath = (type === "blog" ? routes.blogDetail : routes.postDetail).replace(":id", item.id);
  const mediaFromArray = Array.isArray(item.media) && item.media.length > 0 ? item.media : null;
  const fallbackUrl = item.coverImage || item.thumbnail || null;
  const media = mediaFromArray || (fallbackUrl ? [{ url: fallbackUrl }] : []);

  return (
    <article className={`lp-content-card reveal-up ${inactive ? "lp-content-card--inactive" : ""}`} style={{ "--delay": delay }}>
      <div className="lp-content-thumb">
        <MediaSwiper media={media} fallbackIcon={type === "blog" ? BookOpenText : Sparkles} />
      </div>

      <div className="lp-content-body">
        <div className="lp-landing-card-badges">
          <span className={`lp-badge lp-badge--${type === "blog" ? "blog" : "post"}`}>{category}</span>
          {inactive && (
            <span className="lp-badge lp-badge--inactive">
              <Power size={11} />
              Inactive
            </span>
          )}
        </div>

        <h4>{truncateText(item.title || item.content || "", 55)}</h4>
        <p>{truncateText(item.content || "", 80)}</p>

        {inactive && <span className="lp-disabled-note">Preview only. Only the owner or admin can open this content.</span>}

        <div className="lp-content-footer">
          <span className="lp-content-stat"><Heart size={12} /> {item.likeCount || 0}</span>
          <span className="lp-content-stat"><MessageCircle size={12} /> {item.commentCount || 0}</span>
          <span className="lp-content-date">{formatDate(item.createdAt)}</span>
        </div>

        {!inactive && (
          <div className="lp-card-footer-icon">
            <ChevronRight size={18} />
          </div>
        )}
      </div>
    </article>
  );
}

function LandingPostCard({ post, delay = "0ms", onViewMore }) {
  const author = post.author || post.owner || {};
  const inactive = post.active === false;
  const avatarUrl =
    author.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      author.fullName || author.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  const mediaFromArray = Array.isArray(post.media) && post.media.length > 0 ? post.media : null;
  const fallbackUrl = post.coverImage || post.thumbnail || null;
  const media = mediaFromArray || (fallbackUrl ? [{ url: fallbackUrl }] : []);

  return (
    <article className={`lp-insta-card reveal-up ${inactive ? "lp-insta-card--inactive" : ""}`} style={{ "--delay": delay }}>
      <div className="lp-insta-header">
        <img src={avatarUrl} alt={author.fullName || author.username || "Post author"} className="lp-insta-avatar" />
        <div className="lp-insta-author-info">
          <strong>{author.fullName || author.username}</strong>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        {inactive && <span className="lp-insta-badge lp-insta-badge--inactive">Inactive</span>}
      </div>

      <div className="lp-insta-media">
        <MediaSwiper media={media} fallbackIcon={Sparkles} />
      </div>

      <div className="lp-insta-body">
        <div className="lp-insta-actions">
          <div className="lp-insta-action-left">
            <Heart size={20} className="lp-insta-icon" />
            <MessageCircle size={20} className="lp-insta-icon" />
          </div>
          <span className="lp-insta-likes-count">{post.likeCount || 0} likes</span>
        </div>

        <div className="lp-insta-caption">
          <p className="lp-insta-caption-text">
            <strong>{author.username}</strong> {truncateText(post.content || post.title || "", 150)}
          </p>
          <button
            className="lp-insta-more-link"
            onClick={() => onViewMore && onViewMore(post)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
          >
            view more
          </button>
        </div>

        {post.tags && (typeof post.tags === "string" ? post.tags.split(",") : post.tags).length > 0 && (
          <div className="lp-insta-tags">
            {(typeof post.tags === "string" ? post.tags.split(",") : post.tags).slice(0, 3).map((tag, index) => (
              <span key={`${tag}-${index}`} className="lp-insta-tag">#{tag.trim()}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ContributorCard({ user, ctaPath, ctaLabel, delay = "0ms" }) {
  const avatarUrl =
    user.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || user.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=100`;

  const profilePath = routes.profile.replace(":username", user.username);
  const role = user.title || (user.role === "ADMIN" ? "Platform Admin" : "Community Builder");

  return (
    <div className="lp-cc-card reveal-up" style={{ "--delay": delay }}>
      <div className="lp-cc-body">
        <img src={avatarUrl} alt={user.fullName || user.username || "Contributor"} className="lp-cc-avatar" />

        <h3 className="lp-cc-name">{user.fullName || user.username}</h3>
        {user.username && <span className="lp-cc-handle">@{user.username}</span>}
        <span className="lp-cc-role-badge">{role}</span>

        <Link to={ctaPath || profilePath} className="lp-btn-outline lp-cc-cta">
          {ctaLabel || "View Profile"}
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const token = useAuthStore((state) => state.token);
  const { data, isLoading } = useRealtimeLandingOverview();
  const [contributorPage, setContributorPage] = useState(0);
  const [selectedPostForModal, setSelectedPostForModal] = useState(null);

  const featuredProjects = data?.featuredProjects || [];
  const latestPosts = data?.latestPosts || [];
  const latestBlogs = data?.latestBlogs || [];
  const featuredContributors = data?.featuredContributors || [];

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const contributorsPerPage = isMobile ? 1 : 3;
  const totalContributorPages = Math.max(1, Math.ceil(featuredContributors.length / contributorsPerPage));
  const discoverMembersPath = token ? routes.search : routes.register;
  const contributorCtaPath = token ? null : routes.register;
  const contributorCtaLabel = token ? "View Profile" : "Join VCollab";

  const nextContributorPage = useCallback(() => {
    setContributorPage((previous) => (previous + 1) % totalContributorPages);
  }, [totalContributorPages]);

  const previousContributorPage = useCallback(() => {
    setContributorPage((previous) => (previous - 1 + totalContributorPages) % totalContributorPages);
  }, [totalContributorPages]);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying || featuredContributors.length <= contributorsPerPage) return;

    const interval = setInterval(() => {
      nextContributorPage();
    }, 3000); // 3 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredContributors.length, contributorsPerPage, nextContributorPage]);

  // Swipe logic
  const handleTouchStart = (e) => {
    setIsAutoPlaying(false); // Pause auto-play on touch
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsAutoPlaying(true);
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextContributorPage();
    } else if (isRightSwipe) {
      previousContributorPage();
    }

    touchStartX.current = null;
    touchEndX.current = null;

    // Resume auto-play after a delay
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  return (
    <div className="lp">
      <SEO
        title="Build, Collaborate, and Share With Confidence"
        description="VCollab is a real-time platform where students, developers, and creators can collaborate on projects, publish content, find trusted support, and grow in a professional community."
      />

      <section className="lp-hero">
        <div className="container lp-hero-content">
          <div className="lp-hero-copy reveal-up">
            <div className="lp-hero-badge">
              <span className="lp-badge-dot"></span>
              Introducing VCollab 2.0
            </div>
            <h1 className="lp-hero-title">
              <span className="lp-hero-title-desktop">
                Build, Collaborate, and<br />
                Share With <span className="lp-accent">Confidence</span>
              </span>
              <span className="lp-hero-title-mobile" aria-label="Build Colabrate, and Share with confident">
                <span className="lp-type-line lp-type-line-1">Build</span>
                <span className="lp-type-line lp-type-line-2">Colabrate, and</span>
                <span className="lp-type-line lp-type-line-3">Share with confident</span>
              </span>
            </h1>
            <div className="lp-hero-actions">
              <Link to={routes.register} className="lp-btn-filled">Get Started</Link>
              <a href="#projects" className="lp-btn-outline-dark">Explore Projects</a>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="lp-dual-section">
        <div className="container">
          <div className="lp-section-header-row reveal-up" style={{ "--delay": "80ms" }}>
            <div className="lp-section-head">
              <h2>Active Work From the <span className="lp-accent">Community</span></h2>
              <p>Explore live projects shared by builders across campus work, side ideas, portfolio pieces, and public collaboration.</p>
            </div>
            <Link to={routes.projects} className="lp-btn-outline">
              View All Projects
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="lp-empty">Loading projects...</div>
          ) : featuredProjects.length > 0 ? (
            <div className="lp-grid-4">
              {featuredProjects.slice(0, 8).map((project, index) => (
                <ProjectCard key={project.id} project={project} delay={`${index * 80}ms`} />
              ))}
            </div>
          ) : (
            <div className="lp-empty">No featured projects yet.</div>
          )}
        </div>
      </section>

      <section id="posts" className="lp-dual-section lp-dual-section--alt">
        <div className="container">
          <div className="lp-section-header-row reveal-up" style={{ "--delay": "80ms" }}>
            <div className="lp-section-head">
              <h2>Live <span className="lp-accent">Discussions and Updates</span></h2>
              <p>Follow progress, questions, collaboration requests, and technical conversations happening across the platform.</p>
            </div>
            <Link to={routes.posts} className="lp-btn-outline">
              View All Posts
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="lp-empty">Loading posts...</div>
          ) : latestPosts.length > 0 ? (
            <div className="lp-grid-4">
              {latestPosts.slice(0, 8).map((post, index) => (
                <LandingPostCard
                  key={post.id}
                  post={post}
                  delay={`${index * 80}ms`}
                  onViewMore={setSelectedPostForModal}
                />
              ))}
            </div>
          ) : (
            <div className="lp-empty">No posts yet.</div>
          )}
        </div>
      </section>

      <section id="contributors" className="lp-dual-section">
        <div className="container">
          <div className="lp-section-header-row reveal-up" style={{ "--delay": "80ms" }}>
            <div className="lp-section-head">
              <h2>Trusted <span className="lp-accent">Builders and Contributors</span></h2>
              <p>Meet active members who are sharing work, helping others, and growing through meaningful collaboration.</p>
            </div>
            <Link to={discoverMembersPath} className="lp-btn-outline">
              {token ? "Discover More Members" : "Join to Connect"}
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="lp-empty">Loading contributors...</div>
          ) : featuredContributors.length > 0 ? (
            <div
              className="lp-carousel-wrapper"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {featuredContributors.length > contributorsPerPage && (
                <button className="lp-carousel-btn lp-carousel-btn--prev" onClick={previousContributorPage}>
                  <ChevronLeft size={24} />
                </button>
              )}

              <div style={{ overflow: "hidden", width: "100%", padding: "10px 0" }}>
                <div
                  style={{
                    display: "flex",
                    transition: "transform 0.5s ease-in-out",
                    transform: `translateX(-${contributorPage * 100}%)`
                  }}
                >
                  {Array.from({ length: totalContributorPages }).map((_, pageIndex) => (
                    <div key={pageIndex} style={{ minWidth: "100%", flexShrink: 0 }}>
                      <div className="lp-grid-3 lp-carousel-grid">
                        {featuredContributors
                          .slice(pageIndex * contributorsPerPage, (pageIndex + 1) * contributorsPerPage)
                          .map((user, index) => (
                            <ContributorCard
                              key={user.id}
                              user={user}
                              ctaPath={contributorCtaPath}
                              ctaLabel={contributorCtaLabel}
                              delay={`${index * 80}ms`}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {featuredContributors.length > contributorsPerPage && (
                <button className="lp-carousel-btn lp-carousel-btn--next" onClick={nextContributorPage}>
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
          ) : (
            <div className="lp-empty">No contributors found yet.</div>
          )}
        </div>
      </section>

      <section id="blogs" className="lp-dual-section lp-dual-section--alt">
        <div className="container">
          <div className="lp-section-header-row reveal-up" style={{ "--delay": "80ms" }}>
            <div className="lp-section-head">
              <h2>Insights, Tutorials, and <span className="lp-accent">Ideas</span></h2>
              <p>Read blogs, guides, and lessons from people documenting what they build and what they learn.</p>
            </div>
            <Link to={routes.blogs} className="lp-btn-outline">
              View All Blogs
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="lp-empty">Loading blogs...</div>
          ) : latestBlogs.length > 0 ? (
            <div className="lp-grid-4">
              {latestBlogs.slice(0, 8).map((blog, index) => (
                <ContentCard key={blog.id} item={blog} type="blog" delay={`${index * 80}ms`} />
              ))}
            </div>
          ) : (
            <div className="lp-empty">No blogs yet.</div>
          )}
        </div>
      </section>

      <section className="lp-cta-banner">
        <div className="container lp-cta-inner reveal-up" style={{ "--delay": "120ms" }}>
          <div>
            <h2>Start Building With the Right Community</h2>
            <p>Join VCollab to collaborate on projects, share your work, and connect with people who help you move forward.</p>
          </div>
          <div className="lp-cta-actions">
            <Link to={routes.register} className="lp-btn-filled">Create Account</Link>
            <Link to={routes.login} className="lp-btn-outline-white">Sign In</Link>
          </div>
        </div>
      </section>

      <PublicFooter />

      {selectedPostForModal && (
        <CommentModal
          contentType="POST"
          contentId={selectedPostForModal.id}
          title={selectedPostForModal.title}
          author={selectedPostForModal.author || selectedPostForModal.owner}
          mediaUrl={selectedPostForModal.media?.[0]?.url || selectedPostForModal.coverImage || selectedPostForModal.thumbnail}
          counts={{
            likeCount: selectedPostForModal.likeCount,
            commentCount: selectedPostForModal.commentCount,
            shareCount: selectedPostForModal.shareCount
          }}
          initialLikeStatus={false}
          onLikeToggle={() => { }}
          onShareChange={() => { }}
          onClose={() => setSelectedPostForModal(null)}
        />
      )}
    </div>
  );
}
