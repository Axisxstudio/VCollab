import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
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
  ChevronRight,
} from "lucide-react";
import CommentModal from "../../components/comments/CommentModal";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/seo/SEO";
import useRealtimeLandingOverview from "../../hooks/useRealtimeLandingOverview";
import { routes } from "../../config/routes";
import { useAuthStore } from "../../store/authStore";
import { formatDate, truncateText } from "../../utils/discovery";
import "./landing-page.css";

/* ─── Shared animation variants ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.45, ease: "easeOut", delay },
  }),
};

const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Scroll-aware section wrapper ──────────────────────────── */
function RevealSection({ children, className, ...rest }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ─── Scroll progress bar ────────────────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, #2563eb, #7c3aed)",
        transformOrigin: "0%",
        zIndex: 9999,
        borderRadius: "0 2px 2px 0",
      }}
    />
  );
}

/* ─── MediaSwiper (unchanged logic, animated track) ─────────── */
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
      <motion.div
        className="lp-media-track"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        style={{ display: "flex" }}
      >
        {items.map((item, index) => (
          <img
            key={`${typeof item === "string" ? item : item.url}-${index}`}
            src={typeof item === "string" ? item : item.url}
            alt={`Media ${index + 1}`}
            className="lp-media-img"
            style={{ flexShrink: 0, width: "100%" }}
          />
        ))}
      </motion.div>

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
              <span
                key={index}
                className={`lp-swiper-dot ${index === currentIndex ? "active" : ""}`}
              />
            ))}
          </div>
          <div className="lp-swiper-counter">{currentIndex + 1}/{items.length}</div>
        </>
      )}
    </div>
  );
}

/* ─── Project card with hover animation ─────────────────────── */
function ProjectCard({ project, index = 0 }) {
  const owner = project.owner || {};
  const inactive = project.active === false;
  const detailPath = routes.projectDetail.replace(":id", project.id);
  const avatarUrl =
    owner.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      owner.fullName || owner.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  const card = (
    <motion.article
      variants={cardVariant}
      custom={index * 0.06}
      className={`lp-project-card ${inactive ? "lp-project-card--inactive" : ""}`}
      whileHover={!inactive ? { y: -6, boxShadow: "0 20px 40px -12px rgba(37,99,235,0.18)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
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
            {project.techStack.length > 3 && (
              <span className="lp-tech-badge">+{project.techStack.length - 3}</span>
            )}
          </div>
        )}

        {inactive && <span className="lp-disabled-note">Preview only. Only the owner or admin can open this project.</span>}
        {!inactive && (
          <div className="lp-card-footer-icon">
            <ChevronRight size={18} />
          </div>
        )}
      </div>
    </motion.article>
  );

  return inactive ? card : <Link to={detailPath}>{card}</Link>;
}

/* ─── Content card (blog / post preview) ────────────────────── */
function ContentCard({ item, type, index = 0 }) {
  const category = item.category?.name || (type === "blog" ? "Blog" : "Post");
  const inactive = item.active === false;
  const detailPath = (type === "blog" ? routes.blogDetail : routes.postDetail).replace(":id", item.id);
  const mediaFromArray = Array.isArray(item.media) && item.media.length > 0 ? item.media : null;
  const fallbackUrl = item.coverImage || item.thumbnail || null;
  const media = mediaFromArray || (fallbackUrl ? [{ url: fallbackUrl }] : []);

  const card = (
    <motion.article
      variants={cardVariant}
      custom={index * 0.06}
      className={`lp-content-card ${inactive ? "lp-content-card--inactive" : ""}`}
      whileHover={!inactive ? { y: -5, boxShadow: "0 16px 32px -8px rgba(37,99,235,0.14)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
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
    </motion.article>
  );

  return inactive ? card : <Link to={detailPath}>{card}</Link>;
}

/* ─── Instagram-style post card ─────────────────────────────── */
function LandingPostCard({ post, index = 0, onViewMore }) {
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
    <motion.article
      variants={cardVariant}
      custom={index * 0.06}
      className={`lp-insta-card ${inactive ? "lp-insta-card--inactive" : ""}`}
      whileHover={{ y: -5, boxShadow: "0 16px 32px -8px rgba(37,99,235,0.13)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
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
    </motion.article>
  );
}

/* ─── Contributor card with hover glow ──────────────────────── */
function ContributorCard({ user, ctaPath, ctaLabel, index = 0 }) {
  const avatarUrl =
    user.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || user.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=100`;

  const profilePath = routes.profile.replace(":username", user.username);
  const role = user.title || (user.role === "ADMIN" ? "Platform Admin" : "Community Builder");

  return (
    <motion.div
      variants={cardVariant}
      custom={index * 0.1}
      className="lp-cc-card"
      whileHover={{ y: -8, boxShadow: "0 24px 48px -12px rgba(37,99,235,0.22)" }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <div className="lp-cc-body">
        <motion.img
          src={avatarUrl}
          alt={user.fullName || user.username || "Contributor"}
          className="lp-cc-avatar"
          whileHover={{ scale: 1.07 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />

        <h3 className="lp-cc-name">{user.fullName || user.username}</h3>
        {user.username && <span className="lp-cc-handle">@{user.username}</span>}
        <span className="lp-cc-role-badge">{role}</span>

        <Link to={ctaPath || profilePath} className="lp-btn-outline lp-cc-cta">
          {ctaLabel || "View Profile"}
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Animated grid wrapper ──────────────────────────────────── */
function AnimatedGrid({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section header row with reveal ────────────────────────── */
function SectionHeaderRow({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      className="lp-section-header-row"
      variants={fadeUp}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
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

  useEffect(() => {
    if (!isAutoPlaying || featuredContributors.length <= contributorsPerPage) return;
    const interval = setInterval(nextContributorPage, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredContributors.length, contributorsPerPage, nextContributorPage]);

  const handleTouchStart = (e) => {
    setIsAutoPlaying(false);
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
    if (distance > 50) nextContributorPage();
    else if (distance < -50) previousContributorPage();

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  return (
    <div className="lp">
      {/* Scroll progress indicator */}
      <ScrollProgressBar />

      <SEO
        title="Build, Collaborate, and Share With Confidence"
        description="VCollab is a real-time platform where students, developers, and creators can collaborate on projects, publish content, find trusted support, and grow in a professional community."
      />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="container lp-hero-content">
          <div className="lp-hero-copy">
            {/* Badge */}
            <motion.div
              className="lp-hero-badge"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                className="lp-badge-dot"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              />
              Introducing VCollab 2.0
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              <span className="lp-hero-title-desktop">
                Build, Collaborate, and<br />
                Share With <span className="lp-accent">Confidence</span>
              </span>
              <span className="lp-hero-title-mobile" aria-label="Build Collaborate, and Share with confidence">
                <span className="lp-type-line lp-type-line-1">Build</span>
                <span className="lp-type-line lp-type-line-2">Collaborate, and</span>
                <span className="lp-type-line lp-type-line-3">Share with confidence</span>
              </span>
            </motion.h1>

            {/* CTA buttons */}
            <motion.div
              className="lp-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to={routes.register} className="lp-btn-filled">Get Started</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <a href="#projects" className="lp-btn-outline-dark">Explore Projects</a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROJECTS ──────────────────────────────────────── */}
      <section id="projects" className="lp-dual-section">
        <div className="container">
          <SectionHeaderRow>
            <div className="lp-section-head">
              <h2>Active Work From the <span className="lp-accent">Community</span></h2>
              <p>Explore live projects shared by builders across campus work, side ideas, portfolio pieces, and public collaboration.</p>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={routes.projects} className="lp-btn-outline">
                View All Projects
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </SectionHeaderRow>

          {isLoading ? (
            <div className="lp-empty">Loading projects...</div>
          ) : featuredProjects.length > 0 ? (
            <AnimatedGrid className="lp-grid-4">
              {featuredProjects.slice(0, 8).map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </AnimatedGrid>
          ) : (
            <div className="lp-empty">No featured projects yet.</div>
          )}
        </div>
      </section>

      {/* ── POSTS ─────────────────────────────────────────── */}
      <section id="posts" className="lp-dual-section lp-dual-section--alt">
        <div className="container">
          <SectionHeaderRow>
            <div className="lp-section-head">
              <h2>Live <span className="lp-accent">Discussions and Updates</span></h2>
              <p>Follow progress, questions, collaboration requests, and technical conversations happening across the platform.</p>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={routes.posts} className="lp-btn-outline">
                View All Posts
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </SectionHeaderRow>

          {isLoading ? (
            <div className="lp-empty">Loading posts...</div>
          ) : latestPosts.length > 0 ? (
            <AnimatedGrid className="lp-grid-4">
              {latestPosts.slice(0, 8).map((post, index) => (
                <LandingPostCard
                  key={post.id}
                  post={post}
                  index={index}
                  onViewMore={setSelectedPostForModal}
                />
              ))}
            </AnimatedGrid>
          ) : (
            <div className="lp-empty">No posts yet.</div>
          )}
        </div>
      </section>

      {/* ── CONTRIBUTORS ──────────────────────────────────── */}
      <section id="contributors" className="lp-dual-section">
        <div className="container">
          <SectionHeaderRow>
            <div className="lp-section-head">
              <h2>Trusted <span className="lp-accent">Builders and Contributors</span></h2>
              <p>Meet active members who are sharing work, helping others, and growing through meaningful collaboration.</p>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={discoverMembersPath} className="lp-btn-outline">
                {token ? "Discover More Members" : "Join to Connect"}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </SectionHeaderRow>

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
                <motion.button
                  className="lp-carousel-btn lp-carousel-btn--prev"
                  onClick={previousContributorPage}
                  whileHover={{ scale: 1.12, backgroundColor: "#eff6ff" }}
                  whileTap={{ scale: 0.93 }}
                >
                  <ChevronLeft size={24} />
                </motion.button>
              )}

              <div style={{ overflow: "hidden", width: "100%", padding: "10px 0" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={contributorPage}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="lp-grid-3 lp-carousel-grid">
                      {featuredContributors
                        .slice(
                          contributorPage * contributorsPerPage,
                          (contributorPage + 1) * contributorsPerPage
                        )
                        .map((user, index) => (
                          <ContributorCard
                            key={user.id}
                            user={user}
                            ctaPath={contributorCtaPath}
                            ctaLabel={contributorCtaLabel}
                            index={index}
                          />
                        ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {featuredContributors.length > contributorsPerPage && (
                <motion.button
                  className="lp-carousel-btn lp-carousel-btn--next"
                  onClick={nextContributorPage}
                  whileHover={{ scale: 1.12, backgroundColor: "#eff6ff" }}
                  whileTap={{ scale: 0.93 }}
                >
                  <ChevronRight size={24} />
                </motion.button>
              )}
            </div>
          ) : (
            <div className="lp-empty">No contributors found yet.</div>
          )}
        </div>
      </section>

      {/* ── BLOGS ─────────────────────────────────────────── */}
      <section id="blogs" className="lp-dual-section lp-dual-section--alt">
        <div className="container">
          <SectionHeaderRow>
            <div className="lp-section-head">
              <h2>Insights, Tutorials, and <span className="lp-accent">Ideas</span></h2>
              <p>Read blogs, guides, and lessons from people documenting what they build and what they learn.</p>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={routes.blogs} className="lp-btn-outline">
                View All Blogs
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </SectionHeaderRow>

          {isLoading ? (
            <div className="lp-empty">Loading blogs...</div>
          ) : latestBlogs.length > 0 ? (
            <AnimatedGrid className="lp-grid-4">
              {latestBlogs.slice(0, 8).map((blog, index) => (
                <ContentCard key={blog.id} item={blog} type="blog" index={index} />
              ))}
            </AnimatedGrid>
          ) : (
            <div className="lp-empty">No blogs yet.</div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <motion.section
        className="lp-cta-banner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px 0px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="container lp-cta-inner"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px 0px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <h2>Start Building With the Right Community</h2>
            <p>Join VCollab to collaborate on projects, share your work, and connect with people who help you move forward.</p>
          </div>
          <div className="lp-cta-actions">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link to={routes.register} className="lp-btn-filled">Create Account</Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link to={routes.login} className="lp-btn-outline-white">Sign In</Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <PublicFooter />

      {/* ── Comment modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedPostForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CommentModal
              contentType="POST"
              contentId={selectedPostForModal.id}
              title={selectedPostForModal.title}
              author={selectedPostForModal.author || selectedPostForModal.owner}
              mediaUrl={
                selectedPostForModal.media?.[0]?.url ||
                selectedPostForModal.coverImage ||
                selectedPostForModal.thumbnail
              }
              counts={{
                likeCount: selectedPostForModal.likeCount,
                commentCount: selectedPostForModal.commentCount,
                shareCount: selectedPostForModal.shareCount,
              }}
              initialLikeStatus={false}
              onLikeToggle={() => {}}
              onShareChange={() => {}}
              onClose={() => setSelectedPostForModal(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
