import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpenText,
  FolderKanban,
  MessageSquare,
  Search,
  UserRound
} from "lucide-react";
import { routes } from "../../config/routes";
import { searchWorkspace } from "../../services/search.service";
import { formatDate, formatRole, getProfilePath, truncateText } from "../../utils/discovery";

const SEARCH_SIZE = 6;

const SEARCH_TABS = [
  { value: "all", label: "All" },
  { value: "users", label: "People" },
  { value: "projects", label: "Projects" },
  { value: "posts", label: "Posts" },
  { value: "blogs", label: "Blogs" }
];

function getContentConfig(type) {
  if (type === "PROJECT") {
    return { label: "Project", icon: FolderKanban };
  }
  if (type === "BLOG") {
    return { label: "Blog", icon: BookOpenText };
  }
  return { label: "Post", icon: MessageSquare };
}

function getContentDetailPath(type, id) {
  if (type === "PROJECT") {
    return routes.projectDetail.replace(":id", id);
  }
  if (type === "BLOG") {
    return routes.blogDetail.replace(":id", id);
  }
  return routes.postDetail.replace(":id", id);
}

function getContentTitle(type, item) {
  if (type === "PROJECT" || type === "BLOG") {
    return item.title;
  }
  return truncateText(item.content, 60) || "Community post";
}

function getContentExcerpt(type, item) {
  if (type === "PROJECT") {
    return truncateText(item.shortDesc || item.fullDesc, 180);
  }
  return truncateText(item.content, 180);
}

function renderAvatar(name, image) {
  if (image) {
    return <img src={image} alt={name} />;
  }
  return <span>{(name || "V").charAt(0).toUpperCase()}</span>;
}

function SearchSummaryCard({ icon: Icon, label, count }) {
  return (
    <article className="search-summary-card">
      <div className="search-summary-card__icon">
        <Icon size={18} />
      </div>
      <div>
        <span className="search-summary-card__label">{label}</span>
        <strong className="search-summary-card__count">{count ?? 0}</strong>
      </div>
    </article>
  );
}

function SearchUserCard({ user }) {
  const profilePath = getProfilePath(user.username);

  return (
    <article className="card search-user-card">
      <Link to={profilePath} className="search-user-card__avatar">
        {renderAvatar(user.fullName || user.username, user.profileImage)}
      </Link>
      <div className="search-user-card__body">
        <div className="search-user-card__identity">
          <Link to={profilePath} className="search-user-card__name">
            {user.fullName || user.username}
          </Link>
          <span className="search-user-card__username">@{user.username}</span>
        </div>
        <div className="feed-badges">
          <span className="feed-badge">{formatRole(user.role)}</span>
          {user.department && <span className="feed-badge feed-badge--soft">{user.department}</span>}
        </div>
        <p className="search-user-card__bio">{truncateText(user.bio, 140) || "Open the full profile to review experience, links, and published work."}</p>
        <div className="search-user-card__stats">
          <span>{user.projectCount || 0} projects</span>
          <span>{user.postCount || 0} posts</span>
          <span>{user.blogCount || 0} blogs</span>
        </div>
      </div>
      <Link to={profilePath} className="btn-outline search-user-card__action">
        View profile
      </Link>
    </article>
  );
}

function SearchContentCard({ type, item }) {
  const config = getContentConfig(type);
  const Icon = config.icon;
  const detailPath = getContentDetailPath(type, item.id);
  const author = item.owner || item.author;
  const authorName = author?.fullName || author?.username || "VCollab member";
  const profilePath = getProfilePath(author?.username);

  return (
    <article className="card discovery-card search-result-card">
      <div className="search-result-card__meta">
        <div className="feed-badges">
          <span className="feed-badge">
            <Icon size={12} />
            {config.label}
          </span>
          {item.category?.name && <span className="feed-badge feed-badge--soft">{item.category.name}</span>}
        </div>
        {item.createdAt && <span className="search-result-card__date">{formatDate(item.createdAt)}</span>}
      </div>

      <div className="search-result-card__body">
        <h3>{getContentTitle(type, item)}</h3>
        <p>{getContentExcerpt(type, item)}</p>
      </div>

      <div className="search-result-card__author">
        <Link to={profilePath} className="search-result-card__author-avatar">
          {renderAvatar(authorName, author?.profileImage)}
        </Link>
        <div className="feed-author-block">
          <Link to={profilePath} className="feed-author-name">
            {authorName}
          </Link>
          <div className="meta-row">
            {author?.username && <span>@{author.username}</span>}
            {item.likeCount != null && <span>{item.likeCount} likes</span>}
            {item.commentCount != null && <span>{item.commentCount} comments</span>}
          </div>
        </div>
      </div>

      {item.tags?.length > 0 && (
        <div className="tag-list">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="search-result-card__footer">
        <Link to={detailPath} className="btn-outline content-more-link">
          Open {config.label.toLowerCase()}
        </Link>
      </div>
    </article>
  );
}

function SearchResultSection({ title, count, children }) {
  return (
    <section className="search-section-stack">
      <div className="discovery-results-header">
        <h3>{title}</h3>
        <span className="discovery-results-meta">{count} total match{count === 1 ? "" : "es"}</span>
      </div>
      {children}
    </section>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const initialTab = searchParams.get("tab") || "all";
  const [draft, setDraft] = useState(query);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", query, SEARCH_SIZE],
    queryFn: () => searchWorkspace({ query, size: SEARCH_SIZE }),
    enabled: Boolean(query)
  });

  const stats = data?.stats || {};
  const users = data?.users || [];
  const projects = data?.projects || [];
  const posts = data?.posts || [];
  const blogs = data?.blogs || [];

  const tabs = SEARCH_TABS.map((tab) => {
    if (tab.value === "users") return { ...tab, count: stats.userCount || 0 };
    if (tab.value === "projects") return { ...tab, count: stats.projectCount || 0 };
    if (tab.value === "posts") return { ...tab, count: stats.postCount || 0 };
    if (tab.value === "blogs") return { ...tab, count: stats.blogCount || 0 };
    return { ...tab, count: stats.totalResults || 0 };
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    const next = new URLSearchParams(searchParams);

    if (!trimmed) {
      next.delete("q");
      next.delete("tab");
      setSearchParams(next);
      return;
    }

    next.set("q", trimmed);
    next.set("tab", "all");
    setSearchParams(next);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };

  const hasQuery = Boolean(query);
  const totalResults = stats.totalResults || 0;
  const activeCounts = {
    all: totalResults,
    users: stats.userCount || 0,
    projects: stats.projectCount || 0,
    posts: stats.postCount || 0,
    blogs: stats.blogCount || 0
  };

  return (
    <div className="section search-page-shell">
      <div className="project-actions">
        <div>
          <h2>Universal Search</h2>
          <p className="profile-meta">
            Search contributors, projects, posts, and blogs from one workspace view.
          </p>
        </div>
      </div>

      <div className="card search-hero-card">
        <form className="search-hero-form" onSubmit={handleSubmit}>
          <label className="search-input-shell" htmlFor="workspace-search">
            <Search size={18} />
            <input
              id="workspace-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Try: react, robotics, cyber security, or a username"
            />
          </label>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
        <p className="search-helper-text">
          Use one query to scan people profiles and active community content.
        </p>
      </div>

      {!hasQuery && (
        <div className="card search-empty-state">
          <h3>Start with a topic, skill, teammate, or content title</h3>
          <p>
            Search works best for technologies, departments, contributor usernames, and content keywords.
          </p>
          <div className="search-empty-state__actions">
            <Link to={routes.projects} className="btn-outline">
              Browse projects
            </Link>
            <Link to={routes.posts} className="btn-outline">
              Browse posts
            </Link>
            <Link to={routes.blogs} className="btn-outline">
              Browse blogs
            </Link>
          </div>
        </div>
      )}

      {hasQuery && isLoading && (
        <div className="card search-empty-state">
          <h3>Searching VCollab...</h3>
          <p>We are scanning contributors and community content for matches to "{query}".</p>
        </div>
      )}

      {hasQuery && isError && (
        <div className="card search-empty-state">
          <h3>Search is unavailable right now</h3>
          <p>Please try again in a moment.</p>
        </div>
      )}

      {hasQuery && !isLoading && !isError && (
        <>
          <div className="search-summary-grid">
            <SearchSummaryCard icon={Search} label="Total matches" count={totalResults} />
            <SearchSummaryCard icon={UserRound} label="People" count={stats.userCount || 0} />
            <SearchSummaryCard icon={FolderKanban} label="Projects" count={stats.projectCount || 0} />
            <SearchSummaryCard icon={MessageSquare} label="Posts" count={stats.postCount || 0} />
            <SearchSummaryCard icon={BookOpenText} label="Blogs" count={stats.blogCount || 0} />
          </div>

          <div className="search-tab-strip">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`search-tab-chip ${activeTab === tab.value ? "active" : ""}`}
                onClick={() => handleTabChange(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{tab.count}</strong>
              </button>
            ))}
          </div>

          {totalResults === 0 ? (
            <div className="card search-empty-state">
              <h3>No results for "{query}" yet</h3>
              <p>Try a broader keyword, a teammate username, or a shorter phrase.</p>
            </div>
          ) : activeCounts[activeTab] === 0 ? (
            <div className="card search-empty-state">
              <h3>No {SEARCH_TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()} matches for "{query}"</h3>
              <p>Switch tabs or try a broader term to explore other result types.</p>
            </div>
          ) : (
            <div className="search-results-stack">
              {(activeTab === "all" || activeTab === "users") && stats.userCount > 0 && (
                <SearchResultSection title="People" count={stats.userCount}>
                  <div className="search-user-grid">
                    {users.map((user) => (
                      <SearchUserCard key={user.id} user={user} />
                    ))}
                  </div>
                </SearchResultSection>
              )}

              {(activeTab === "all" || activeTab === "projects") && stats.projectCount > 0 && (
                <SearchResultSection title="Projects" count={stats.projectCount}>
                  <div className="grid-3">
                    {projects.map((project) => (
                      <SearchContentCard key={project.id} type="PROJECT" item={project} />
                    ))}
                  </div>
                </SearchResultSection>
              )}

              {(activeTab === "all" || activeTab === "posts") && stats.postCount > 0 && (
                <SearchResultSection title="Posts" count={stats.postCount}>
                  <div className="grid-3">
                    {posts.map((post) => (
                      <SearchContentCard key={post.id} type="POST" item={post} />
                    ))}
                  </div>
                </SearchResultSection>
              )}

              {(activeTab === "all" || activeTab === "blogs") && stats.blogCount > 0 && (
                <SearchResultSection title="Blogs" count={stats.blogCount}>
                  <div className="grid-3">
                    {blogs.map((blog) => (
                      <SearchContentCard key={blog.id} type="BLOG" item={blog} />
                    ))}
                  </div>
                </SearchResultSection>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
