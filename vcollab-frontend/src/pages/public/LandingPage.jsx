import { useQuery } from "@tanstack/react-query";
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
  NotebookTabs,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { routes } from "../../config/routes";
import { getLandingOverview } from "../../services/landing.service";
import { formatDate, truncateText } from "../../utils/discovery";
import heroImg from "../../assets/VCollab_hero.png";
import logoImg from "../../assets/logo.png";
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

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="lp-media-swiper">
      <div className="lp-media-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((m, idx) => (
          <img key={idx} src={typeof m === 'string' ? m : m.url} alt={`Media ${idx}`} className="lp-media-img" />
        ))}
      </div>
      
      {items.length > 1 && (
        <>
          <button className="lp-swiper-btn lp-swiper-btn--prev" onClick={prev}>
            <ChevronLeft size={16} />
          </button>
          <button className="lp-swiper-btn lp-swiper-btn--next" onClick={next}>
            <ChevronRight size={16} />
          </button>
          <div className="lp-swiper-dots">
            {items.map((_, idx) => (
              <span key={idx} className={`lp-swiper-dot ${idx === currentIndex ? 'active' : ''}`} />
            ))}
          </div>
          <div className="lp-swiper-counter">{currentIndex + 1}/{items.length}</div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, delay = "0ms" }) {
  return (
    <div className="lp-stat-card reveal-up" style={{ "--delay": delay }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ProjectCard({ project, delay = "0ms" }) {
  const owner = project.owner || {};
  const inactive = project.active === false;
  const detailPath = routes.projectDetail.replace(":id", project.id);
  const detailLinkProps = {
    target: "_blank",
    rel: "noreferrer"
  };
  const avatarUrl =
    owner.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      owner.fullName || owner.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  const media = project.media || [];

  return (
    <article className={`lp-project-card reveal-up ${inactive ? "lp-project-card--inactive" : ""}`} style={{ "--delay": delay }}>
      <div className="lp-project-media-wrap">
        <MediaSwiper media={media} fallbackIcon={FolderKanban} />
      </div>
      <div className="lp-project-header">
        <img src={avatarUrl} alt={owner.fullName} className="lp-project-avatar" />
        <div className="lp-project-meta">
          <strong>{owner.fullName || owner.username}</strong>
          <div className="lp-project-meta-row">
            <span className="lp-badge lp-badge--project">Project</span>
            <span className="lp-badge lp-badge--student">Student</span>
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
        {inactive ? (
          <span className="lp-card-more lp-card-more--disabled" aria-hidden="true">
            <ArrowRight size={14} />
          </span>
        ) : (
          <Link to={detailPath} className="lp-card-more" aria-label="More details" {...detailLinkProps}>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="lp-project-body">
        <h3>{project.title}</h3>
        <p>{truncateText(project.shortDesc || project.fullDesc || "", 130)}</p>
        {inactive && <span className="lp-disabled-note">Preview only. Only the owner or admin can open this project.</span>}
        {!inactive && (
          <div className="lp-card-links">
            <Link to={detailPath} className="lp-more-link" {...detailLinkProps}>
              More details
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function ContentCard({ item, type, delay = "0ms" }) {
  const image = item.thumbnail || item.coverImage || item.media?.[0]?.url;
  const category = item.category?.name || (type === "blog" ? "Blog" : "Post");
  const inactive = item.active === false;
  const detailPath = (type === "blog" ? routes.blogDetail : routes.postDetail).replace(":id", item.id);
  const detailLinkProps = {
    target: "_blank",
    rel: "noreferrer"
  };

  const media = item.media || (item.coverImage || item.thumbnail ? [item.coverImage || item.thumbnail] : []);

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
          <div className="lp-card-links">
            <Link to={detailPath} className="lp-more-link" {...detailLinkProps}>
              More details
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function LandingPostCard({ post, delay = "0ms" }) {
  const author = post.author || post.owner || {};
  const image = post.thumbnail || post.coverImage || post.media?.[0]?.url;
  const detailPath = routes.postDetail.replace(":id", post.id);
  const inactive = post.active === false;
  
  const avatarUrl =
    author.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      author.fullName || author.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  const detailLinkProps = {
    target: "_blank",
    rel: "noreferrer"
  };

  const media = post.media || (post.coverImage || post.thumbnail ? [post.coverImage || post.thumbnail] : []);

  return (
    <article className={`lp-insta-card reveal-up ${inactive ? "lp-insta-card--inactive" : ""}`} style={{ "--delay": delay }}>
      <div className="lp-insta-header">
        <img src={avatarUrl} alt={author.fullName} className="lp-insta-avatar" />
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
          <Link to={detailPath} className="lp-insta-more-link" {...detailLinkProps}>view more</Link>
        </div>

        {post.tags && (typeof post.tags === 'string' ? post.tags.split(',') : post.tags).length > 0 && (
          <div className="lp-insta-tags">
            {(typeof post.tags === 'string' ? post.tags.split(',') : post.tags).slice(0, 3).map((tag, idx) => (
              <span key={idx} className="lp-insta-tag">#{tag.trim()}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ContributorCard({ user, delay = "0ms" }) {
  const avatarUrl =
    user.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || user.username || "U"
    )}&background=dbeafe&color=1d4ed8&bold=true&size=100`;

  const profilePath = routes.profile.replace(":username", user.username);

  return (
    <div className="lp-contributor-card reveal-up" style={{ "--delay": delay }}>
      <img src={avatarUrl} alt={user.fullName} className="lp-contributor-avatar" />
      <h3>{user.fullName || user.username}</h3>
      <p>@{user.username}</p>
      <div className="lp-contributor-stats">
        <span><FolderKanban size={14} /> {user.projectCount || 0}</span>
        <span><NotebookTabs size={14} /> {user.postCount || 0}</span>
      </div>
      <Link to={profilePath} className="lp-btn-outline" style={{ marginTop: '20px', width: '100%' }}>
        View Profile
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["landing-overview"],
    queryFn: getLandingOverview,
  });

  const stats = data?.stats || {};
  const featuredProjects = data?.featuredProjects || [];
  const latestPosts = data?.latestPosts || [];
  const latestBlogs = data?.latestBlogs || [];
  const featuredContributors = data?.featuredContributors || [];

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="container lp-hero-content">
          <div className="lp-hero-copy reveal-up">
            <h1>
              You have the ambition.<br />
              VCollab gives it <span className="lp-accent">structure</span>
            </h1>
            <p>
              Find project ideas, work with teammates, and connect with
              industry experts in one collaborative platform built for
              students and software engineers.
            </p>
            <div className="lp-hero-actions">
              <Link to={routes.register} className="lp-btn-filled">Create Free Account</Link>
              <a href="#projects" className="lp-btn-outline-dark">Explore Projects</a>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="lp-dual-section">
        <div className="container">
          <div className="lp-section-header-row">
            <div className="lp-section-head">
              <h2>Featured <span className="lp-accent">Projects</span></h2>
              <p>Top projects based on community likes and engagement.</p>
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
          <div className="lp-section-header-row">
            <div className="lp-section-head">
              <h2>Latest <span className="lp-accent">Posts</span></h2>
              <p>Quick updates and announcements from our student community.</p>
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
                <LandingPostCard key={post.id} post={post} delay={`${index * 80}ms`} />
              ))}
            </div>
          ) : (
            <div className="lp-empty">No posts yet.</div>
          )}
        </div>
      </section>

      <section id="contributors" className="lp-dual-section">
        <div className="container">
          <div className="lp-section-header-row">
            <div className="lp-section-head">
              <h2>Top <span className="lp-accent">Contributors</span></h2>
              <p>Meet the most active members building and sharing on VCollab.</p>
            </div>
            <Link to={routes.search} className="lp-btn-outline">
              Discover More Members
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="lp-empty">Loading contributors...</div>
          ) : featuredContributors.length > 0 ? (
            <div className="lp-grid-4">
              {featuredContributors.slice(0, 8).map((user, index) => (
                <ContributorCard key={user.id} user={user} delay={`${index * 80}ms`} />
              ))}
            </div>
          ) : (
            <div className="lp-empty">No contributors found yet.</div>
          )}
        </div>
      </section>

      <section id="blogs" className="lp-dual-section lp-dual-section--alt">
        <div className="container">
          <div className="lp-section-header-row">
            <div className="lp-section-head">
              <h2>Latest <span className="lp-accent">Blogs</span></h2>
              <p>In-depth articles, tutorials, and project development stories.</p>
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

      <section className="lp-stats-strip">
        <div className="container lp-stats-grid">
          <StatCard
            label="Projects"
            value={isLoading ? "..." : stats.projectCount || 0}
            delay="0ms"
          />
          <StatCard
            label="Students"
            value={isLoading ? "..." : (stats.userCount ?? stats.contributorCount) || 0}
            delay="80ms"
          />
          <StatCard
            label="Contributors"
            value={isLoading ? "..." : stats.contributorCount || 0}
            delay="160ms"
          />
          <StatCard
            label="Posts and Blogs"
            value={isLoading ? "..." : (stats.postCount || 0) + (stats.blogCount || 0)}
            delay="240ms"
          />
        </div>
      </section>

      <section className="lp-features-grid-section">
        <div className="container">
          <div className="lp-features-header reveal-up">
            <h2>A Collaboration <span className="lp-accent">Platform Built for Students</span></h2>
            <p>Collaborate with students, share projects, and gain real-world experience with VCollab. You build you, connect first, then find.</p>
          </div>

          <div className="lp-features-split">
            <div className="lp-features-cards">
              <div className="lp-feature-item reveal-up" style={{ "--delay": "100ms" }}>
                <div className="lp-feature-icon lp-feature-icon--blue">
                  <Sparkles size={26} />
                </div>
                <div className="lp-feature-text">
                  <h3>Upload Projects</h3>
                  <p>Share your work and track your progress with the community. Tools your creations need.</p>
                </div>
              </div>
              <div className="lp-feature-item reveal-up" style={{ "--delay": "200ms" }}>
                <div className="lp-feature-icon lp-feature-icon--purple">
                  <BookOpenText size={26} />
                </div>
                <div className="lp-feature-text">
                  <h3>Find Teammates</h3>
                  <p>Connect with like-minded students and build amazing teams. Explore on dream projects.</p>
                </div>
              </div>
              <div className="lp-feature-item reveal-up" style={{ "--delay": "300ms" }}>
                <div className="lp-feature-icon lp-feature-icon--orange">
                  <Sparkles size={26} />
                </div>
                <div className="lp-feature-text">
                  <h3>Discover Ideas</h3>
                  <p>Explore a curated list of project ideas to kickstart your journey. Connect everywhere, goers.</p>
                </div>
              </div>
            </div>
            <div className="lp-features-visual reveal-up" style={{ "--delay": "400ms" }}>
              <img src={heroImg} alt="VCollab collaborative features" />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-steps-section">
        <div className="container">
          <div className="lp-steps-header reveal-up">
            <h2>How to <span className="lp-accent">Get Started</span></h2>
            <p>Students often struggle with semester projects due to lack of guidance. Here's your roadmap.</p>
          </div>

          <div className="lp-steps-grid">
            <div className="lp-step-card reveal-up" style={{ "--delay": "100ms" }}>
              <div className="lp-step-number">1</div>
              <h3>Create an Account</h3>
              <p>Set up your profile to start your collaborative journey and host your projects.</p>
              <div className="lp-step-footer">
                <span><Heart size={14} /> 90 Likes</span>
                <span><MessageCircle size={14} /> 18 Comments</span>
              </div>
            </div>
            <div className="lp-step-card reveal-up" style={{ "--delay": "200ms" }}>
              <div className="lp-step-number lp-step-number--blue">2</div>
              <h3>Build Your Profile</h3>
              <p>Showcase your skills and experience to find potential teammates and mentors.</p>
              <div className="lp-step-footer">
                <span><Heart size={14} /> 115 Likes</span>
                <span><MessageCircle size={14} /> 14 Comments</span>
              </div>
            </div>
            <div className="lp-step-card reveal-up" style={{ "--delay": "300ms" }}>
              <div className="lp-step-number lp-step-number--orange">3</div>
              <h3>Upload Projects</h3>
              <p>Experience competition and collaboration on managing your student projects.</p>
              <div className="lp-step-footer">
                <span><Heart size={14} /> 23 Likes</span>
                <span><MessageCircle size={14} /> 10 Comments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-banner">
        <div className="container lp-cta-inner">
          <div>
            <h2>Ready to start your journey?</h2>
            <p>Join thousands of students building the future of software.</p>
          </div>
          <div className="lp-cta-actions">
            <Link to={routes.register} className="lp-btn-filled">Get Started Free</Link>
            <Link to={routes.login} className="lp-btn-outline-white">Sign In</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="container lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <img src={logoImg} alt="VCollab" />
              <span>VCollab</span>
            </div>
            <p>The professional collaboration platform for student work and public discovery.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><Link to={routes.projects}>Explore Projects</Link></li>
              <li><Link to={routes.posts}>Latest Posts</Link></li>
              <li><Link to={routes.blogs}>Blogs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#about" onClick={(event) => { event.preventDefault(); document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }}>About Us</a></li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <p>support@vcollab.com</p>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <div className="container">&copy; {new Date().getFullYear()} VCollab by VTech AI Solutions. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
