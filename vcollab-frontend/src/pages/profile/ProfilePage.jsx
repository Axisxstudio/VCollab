import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EyeOff,
  ExternalLink,
  FileText,
  Folder,
  Github,
  Layout,
  Linkedin,
  Link as LinkIcon,
  MessageSquare,
  Pencil,
  Layers
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import OwnerContentControls from "../../components/content/OwnerContentControls";
import ContentActions from "../../components/interactions/ContentActions";
import FollowButton from "../../components/interactions/FollowButton";
import MediaGallery from "../../components/media/MediaGallery";
import { routes } from "../../config/routes";
import { deleteBlog, listUserBlogs } from "../../services/blog.service";
import { createConversation } from "../../services/conversation.service";
import {
  followUser,
  getFollowStatus,
  listFollowers,
  listFollowing,
  unfollowUser
} from "../../services/follow.service";
import { deletePost, listUserPosts } from "../../services/post.service";
import { getMyProfile, getPublicProfile } from "../../services/profile.service";
import { deleteProject, listUserProjects } from "../../services/project.service";
import { listSavedContent } from "../../services/save.service";
import { useAuthStore } from "../../store/authStore";
import {
  buildBlogGalleryItems,
  buildPostGalleryItems,
  buildProjectGalleryItems,
  buildSavedGalleryItems,
  getContentConfig,
  getContentTypeLabel
} from "../../utils/content";
import { truncateRichText } from "../../utils/richText";
import { formatTimeAgo } from "../../utils/date";
import "./profile-page.css";

const PAGE_SIZE = 12;

const formatDateLong = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  return formatTimeAgo(value);
};

const formatRole = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatPostType = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitial = (label) => (label ? label.charAt(0).toUpperCase() : "V");

const getDisplayName = (profile) => profile?.fullName || profile?.username || "VCollab member";

const getProfilePath = (profile) => {
  if (!profile?.username) return routes.home;
  return routes.profile.replace(":username", profile.username);
};

const getSavedDetailPath = (item) => {
  if (item.contentType === "PROJECT") {
    return routes.projectDetail.replace(":id", item.contentId);
  }
  if (item.contentType === "BLOG") {
    return routes.blogDetail.replace(":id", item.contentId);
  }
  return routes.postDetail.replace(":id", item.contentId);
};

const buildShareUrl = (path) => {
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
};

const canOpenProfileContent = (item, isOwnProfile) => Boolean(isOwnProfile || item?.active !== false);

const renderStatusBadges = (item) => (
  <div className="profile-card-badges">
    {item.visibility === "PRIVATE" && <span className="status-chip private">Private</span>}
    {item.active === false && <span className="status-chip inactive">Inactive</span>}
  </div>
);

const getAuthorAvatar = (user) => {
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={user.fullName || user.username} />;
  }

  return getInitial(user?.fullName || user?.username || "V");
};

const EmptyState = ({ title, description }) => (
  <div className="card profile-empty">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isMe = currentUser?.username === username;
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [contentFilter, setContentFilter] = useState("All");

  useEffect(() => {
    setActiveTab("activity");
    setContentFilter("All");
  }, [username]);

  const profileQueryKey = ["profile", isMe ? "me" : username];

  const { data, isLoading } = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => (isMe ? getMyProfile() : getPublicProfile(username))
  });

  const tabs = [
    { key: "activity", label: "Discovery" },
    { key: "about", label: "About" },
    { key: "projects", label: "Projects" },
    { key: "posts", label: "Posts" },
    { key: "blogs", label: "Blogs" },
    ...(isMe ? [{ key: "saved", label: "Saved" }] : []),
    { key: "connections", label: "Connections" }
  ];

  const filterToggles = [
    { id: "All", label: "All", icon: Layers },
    { id: "Projects", label: "Projects", icon: Layout },
    { id: "Posts", label: "Posts", icon: MessageSquare },
    { id: "Blogs", label: "Blogs", icon: FileText }
  ];

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("activity");
    }
  }, [activeTab, tabs]);

  const profileUsername = data?.username || username;
  const profileUserId = data?.id;

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", data?.id],
    queryFn: () => getFollowStatus(data.id),
    enabled: Boolean(data?.id && !isMe)
  });

  const projectsQuery = useQuery({
    queryKey: ["profile-projects", profileUsername],
    queryFn: () => listUserProjects(profileUsername, { size: PAGE_SIZE }),
    enabled: Boolean(profileUsername && (activeTab === "projects" || (activeTab === "activity" && (contentFilter === "All" || contentFilter === "Projects"))))
  });

  const postsQuery = useQuery({
    queryKey: ["profile-posts", profileUsername],
    queryFn: () => listUserPosts(profileUsername, { size: PAGE_SIZE }),
    enabled: Boolean(profileUsername && (activeTab === "posts" || (activeTab === "activity" && (contentFilter === "All" || contentFilter === "Posts"))))
  });

  const blogsQuery = useQuery({
    queryKey: ["profile-blogs", profileUsername],
    queryFn: () => listUserBlogs(profileUsername, { size: PAGE_SIZE }),
    enabled: Boolean(profileUsername && (activeTab === "blogs" || (activeTab === "activity" && (contentFilter === "All" || contentFilter === "Blogs"))))
  });

  const savedQuery = useQuery({
    queryKey: ["saved-content"],
    queryFn: () => listSavedContent(),
    enabled: Boolean(isMe && activeTab === "saved")
  });

  const followersQuery = useQuery({
    queryKey: ["followers", profileUserId],
    queryFn: () => listFollowers(profileUserId),
    enabled: Boolean(profileUserId && activeTab === "connections")
  });

  const followingQuery = useQuery({
    queryKey: ["following", profileUserId],
    queryFn: () => listFollowing(profileUserId),
    enabled: Boolean(profileUserId && activeTab === "connections")
  });

  const handleFollow = async () => {
    if (!data?.id || followBusy) return;
    setFollowBusy(true);
    try {
      if (followStatus?.following) {
        await unfollowUser(data.id);
      } else {
        await followUser(data.id);
      }
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["follow-status", data.id] });
      await queryClient.invalidateQueries({ queryKey: ["followers", data.id] });
      await queryClient.invalidateQueries({ queryKey: ["following", data.id] });
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!data?.id || messageBusy || !followStatus?.following) return;
    setMessageBusy(true);
    try {
      const conversation = await createConversation(data.id);
      if (conversation?.id) {
        navigate(`${routes.messages}?conversation=${conversation.id}`);
      }
    } finally {
      setMessageBusy(false);
    }
  };

  const invalidateAfterContentChange = async (queryKey) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: profileQueryKey }),
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["saved-content"] }),
      queryClient.invalidateQueries({ queryKey: ["landing-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["feed"] })
    ]);
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm("Delete this project? This action will remove it from the active platform view.");
    if (!confirmed) return;
    await deleteProject(projectId);
    await invalidateAfterContentChange(["profile-projects", profileUsername]);
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm("Delete this post? This action will remove it from the active platform view.");
    if (!confirmed) return;
    await deletePost(postId);
    await invalidateAfterContentChange(["profile-posts", profileUsername]);
  };

  const handleDeleteBlog = async (blogId) => {
    const confirmed = window.confirm("Delete this blog? This action will remove it from the active platform view.");
    if (!confirmed) return;
    await deleteBlog(blogId);
    await invalidateAfterContentChange(["profile-blogs", profileUsername]);
  };

  if (isLoading) {
    return <div className="card">Loading profile...</div>;
  }

  if (!data) {
    return <div className="card">Profile not found.</div>;
  }

  const projectItems = projectsQuery.data?.content || [];
  const postItems = postsQuery.data?.content || [];
  const blogItems = blogsQuery.data?.content || [];
  const savedItems = savedQuery.data?.items || [];
  const followers = followersQuery.data || [];
  const following = followingQuery.data || [];

  // Unified activity items
  const unifiedActivities = [];
  if (contentFilter === "All" || contentFilter === "Projects") {
    projectItems.forEach(item => unifiedActivities.push({ ...item, contentType: "PROJECT", sortDate: new Date(item.createdAt) }));
  }
  if (contentFilter === "All" || contentFilter === "Posts") {
    postItems.forEach(item => unifiedActivities.push({ ...item, contentType: "POST", sortDate: new Date(item.createdAt) }));
  }
  if (contentFilter === "All" || contentFilter === "Blogs") {
    blogItems.forEach(item => unifiedActivities.push({ ...item, contentType: "BLOG", sortDate: new Date(item.createdAt) }));
  }

  unifiedActivities.sort((a, b) => b.sortDate - a.sortDate);

  const getUnifiedArticle = (item) => {
    const isMeItem = isMe;
    const profilePath = getProfilePath(isMeItem ? currentUser : (item.owner || item.author));
    const canOpen = canOpenProfileContent(item, isMe);
    const isProject = item.contentType === "PROJECT";
    const isBlog = item.contentType === "BLOG";
    const isPost = item.contentType === "POST";

    let detailPath = "";
    const config = getContentConfig(item.contentType);
    const Icon = config.icon;
    let galleryItems = [];
    let author = item.owner || item.author;

    if (isProject) {
      detailPath = routes.projectDetail.replace(":id", item.id);
      galleryItems = buildProjectGalleryItems(item);
    } else if (isBlog) {
      detailPath = routes.blogDetail.replace(":id", item.id);
      galleryItems = buildBlogGalleryItems(item);
    } else {
      detailPath = routes.postDetail.replace(":id", item.id);
      galleryItems = buildPostGalleryItems(item);
    }

    const isOwner = Boolean(currentUser?.id && author?.id === currentUser.id);

    return (
      <article key={`${item.contentType}-${item.id}`} className={`content-surface ${!canOpen ? "profile-content-card--disabled" : ""} ${isOwner ? "is-owner" : ""}`}>
        <div className="content-surface__header">
          <div className="content-surface__identity">
            <Link to={profilePath} className="content-surface__avatar">{getAuthorAvatar(author)}</Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Link to={profilePath} className="content-surface__author">
                  {author?.fullName || author?.username || "VCollab member"}
                </Link>
                <FollowButton userId={author?.id} username={author?.username} />
              </div>
              <div className="content-surface__meta">
                <span className="content-surface__date">{formatDate(item.createdAt)}</span>
                <span className={`content-badge-inline content-badge-inline--${config.variant}`}>
                  <Icon size={12} strokeWidth={2.5} /> {config.label}
                </span>
                {item.category?.name && (
                  <span className="content-surface__category">{item.category.name}</span>
                )}
              </div>
            </div>
          </div>
          {renderStatusBadges(item)}
        </div>

        <MediaGallery
          items={galleryItems}
          title={item.title || "Post media"}
          variant="card"
          aspect={isPost ? "square" : "landscape"}
        />

        <div>
          {item.title && <h3 className="content-surface__title">{item.title}</h3>}
          <p className="content-surface__excerpt">
            {truncateRichText(item.content || item.shortDesc || item.fullDesc, isPost ? 220 : 180)}
          </p>
        </div>

        {item.tags?.length > 0 && (
          <div className="tag-list">
            {item.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {canOpen && (item.githubUrl || item.demoUrl) && (
          <div className="feed-link-row">
            {item.githubUrl && (
              <a href={item.githubUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                <Github size={14} /> GitHub
              </a>
            )}
            {item.demoUrl && (
              <a href={item.demoUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                <ExternalLink size={14} /> Live Demo
              </a>
            )}
          </div>
        )}

        <div className="content-surface__footer">
          <div className="profile-content-footer-actions">
            {canOpen ? (
              <Link to={detailPath} className="btn-outline content-more-link">View More</Link>
            ) : (
              <button type="button" className="btn-outline btn-outline--disabled" disabled>Unavailable</button>
            )}
          </div>
          {isMe && (
            <OwnerContentControls
              editPath={(isProject ? routes.projectEdit : isBlog ? routes.blogEdit : routes.postEdit).replace(":id", item.id)}
              onDelete={() => isProject ? handleDeleteProject(item.id) : isBlog ? handleDeleteBlog(item.id) : handleDeletePost(item.id)}
              deleteLabel={`Delete ${item.contentType.toLowerCase()}`}
            />
          )}
        </div>

        <ContentActions
          contentType={item.contentType}
          contentId={item.id}
          counts={item}
          queryKeys={[isProject ? ["profile-projects", profileUsername] : isBlog ? ["profile-blogs", profileUsername] : ["profile-posts", profileUsername]]}
          shareUrl={buildShareUrl(detailPath)}
          disabled={!canOpen}
          authorUsername={author?.username}
        />
      </article>
    );
  };

  return (
    <div className="profile-shell">
      <section className="card profile-hero-card">
        <div className="profile-cover">
          {data.coverImage && <img src={data.coverImage} alt={`${getDisplayName(data)} cover`} />}
          {!data.coverImage && <div className="profile-cover-placeholder" />}
          <div className="profile-role-badge">{formatRole(data.role)}</div>
        </div>

        <div className="profile-hero-body">
          <div className="profile-hero-top">
            <div className="profile-identity-block">
              <div className="profile-avatar-large">
                {data.profileImage ? (
                  <img src={data.profileImage} alt={getDisplayName(data)} />
                ) : (
                  getInitial(getDisplayName(data))
                )}
              </div>
              <div className="profile-name-stack">
                <h2>{getDisplayName(data)}</h2>
                <div className="profile-meta">@{data.username}</div>
                <p>{data.bio || "This profile is ready for projects, collaborations, and ideas."}</p>

                {(data.githubUrl || data.linkedinUrl || data.websiteUrl) && (
                  <div className="profile-social-icons">
                    {data.githubUrl && (
                      <a href={data.githubUrl} target="_blank" rel="noreferrer" title="GitHub">
                        <Github size={18} />
                      </a>
                    )}
                    {data.linkedinUrl && (
                      <a href={data.linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn">
                        <Linkedin size={18} />
                      </a>
                    )}
                    {data.websiteUrl && (
                      <a href={data.websiteUrl} target="_blank" rel="noreferrer" title="Website">
                        <LinkIcon size={18} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-top-actions">
              {isMe ? (
                <Link to={routes.profileEdit} className="admin-icon-btn profile-edit-icon" title="Edit Profile">
                  <Pencil size={18} />
                </Link>
              ) : (
                <div className="profile-actions">
                  <button className="btn-primary" type="button" onClick={handleFollow} disabled={followBusy}>
                    {followStatus?.following ? "Following" : "Follow"}
                  </button>
                  <div className="profile-actions-stack">
                    <button
                      className="btn-outline"
                      type="button"
                      onClick={handleMessage}
                      disabled={messageBusy || !followStatus?.following}
                    >
                      {followStatus?.following ? "Message" : "Follow to message"}
                    </button>
                    {!followStatus?.following && (
                      <span className="profile-actions-hint">Messaging unlocks once you follow this collaborator.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-summary-grid">
            <div className="profile-summary-card"><strong>{data.projectCount || 0}</strong><span>Projects</span></div>
            <div className="profile-summary-card"><strong>{data.postCount || 0}</strong><span>Posts</span></div>
            <div className="profile-summary-card"><strong>{data.blogCount || 0}</strong><span>Blogs</span></div>
            <div className="profile-summary-card"><strong>{data.followerCount || 0}</strong><span>Followers</span></div>
            <div className="profile-summary-card"><strong>{data.followingCount || 0}</strong><span>Following</span></div>
          </div>
        </div>
      </section>

      <section className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", flexWrap: "wrap", gap: "16px" }}>
        <div className="profile-tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`profile-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "activity" && (
          <div style={{
            display: "flex",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0"
          }}>
            {filterToggles.map((f) => (
              <button
                key={f.id}
                onClick={() => setContentFilter(f.id)}
                style={{
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: contentFilter === f.id ? "#fff" : "transparent",
                  color: contentFilter === f.id ? "var(--color-primary)" : "#64748b",
                  boxShadow: contentFilter === f.id ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <f.icon size={16} />
                {f.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {activeTab === "activity" && (
        <section className="profile-pane">
          {projectsQuery.isLoading || postsQuery.isLoading || blogsQuery.isLoading ? (
            <div className="card">Loading discovery feed...</div>
          ) : unifiedActivities.length === 0 ? (
            <EmptyState
              title={`No ${contentFilter.toLowerCase()} found`}
              description={isMe ? "Start sharing your work to see it here." : "This contributor hasn't shared anything matching this filter yet."}
            />
          ) : (
            <div className="profile-content-grid">
              {unifiedActivities.map(item => getUnifiedArticle(item))}
            </div>
          )}
        </section>
      )}

      {activeTab === "about" && (
        <section className="profile-pane">
          <div className="about-grid">
            <div className="about-item"><label>Education Path</label><span>{data.educationType ? (data.educationType === "SCHOOL" ? "School" : "University / Institute") : "-"}</span></div>
            {data.educationType === "SCHOOL" && (
              <>
                <div className="about-item"><label>School Name</label><span>{data.institutionName || "-"}</span></div>
                <div className="about-item"><label>Grade</label><span>{data.grade || "-"}</span></div>
              </>
            )}
            {data.educationType === "UNIVERSITY" && (
              <>
                <div className="about-item"><label>Institution</label><span>{data.institutionName || "-"}</span></div>
                <div className="about-item"><label>Academic Year</label><span>{data.academicYear || "-"}</span></div>
                <div className="about-item"><label>Semester</label><span>{data.semester || "-"}</span></div>
                <div className="about-item"><label>Faculty / Dept</label><span>{data.faculty || "-"}</span></div>
              </>
            )}
            {(!data.educationType) && (
              <>
                <div className="about-item"><label>Institution</label><span>{data.institution || "-"}</span></div>
                <div className="about-item"><label>Department</label><span>{data.department || "-"}</span></div>
                <div className="about-item"><label>Year Of Study</label><span>{data.yearOfStudy || "-"}</span></div>
              </>
            )}
            <div className="about-item"><label>Date Of Birth</label><span>{data.dob ? formatDateLong(data.dob) : "-"}</span></div>
            <div className="about-item"><label>Joined</label><span>{formatDateLong(data.joinedAt)}</span></div>
          </div>

          <div className="card">
            <h3>Skills and interests</h3>
            {data.skills?.length ? (
              <div className="tag-list">
                {data.skills.map((skill) => (
                  <span key={skill} className="tag-chip">{skill}</span>
                ))}
              </div>
            ) : (
              <p>No skills added yet.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "projects" && (
        <section className="profile-pane">
          {projectsQuery.isLoading ? (
            <div className="card">Loading projects...</div>
          ) : projectItems.length === 0 ? (
            <EmptyState
              title="No projects here yet"
              description={isMe ? "Your projects will appear here once you publish them." : "This contributor has not shared any visible projects yet."}
            />
          ) : (
            <div className="profile-content-grid">
              {projectItems.map((project) => getUnifiedArticle({ ...project, contentType: "PROJECT" }))}
            </div>
          )}
        </section>
      )}

      {activeTab === "posts" && (
        <section className="profile-pane">
          {postsQuery.isLoading ? (
            <div className="card">Loading posts...</div>
          ) : postItems.length === 0 ? (
            <EmptyState
              title="No posts here yet"
              description={isMe ? "Your posts will appear here once you share updates." : "This contributor has not shared any visible posts yet."}
            />
          ) : (
            <div className="profile-content-grid">
              {postItems.map((post) => getUnifiedArticle({ ...post, contentType: "POST" }))}
            </div>
          )}
        </section>
      )}

      {activeTab === "blogs" && (
        <section className="profile-pane">
          {blogsQuery.isLoading ? (
            <div className="card">Loading blogs...</div>
          ) : blogItems.length === 0 ? (
            <EmptyState
              title="No blogs here yet"
              description={isMe ? "Your blogs will appear here once you publish them." : "This contributor has not shared any visible blogs yet."}
            />
          ) : (
            <div className="profile-content-grid">
              {blogItems.map((blog) => getUnifiedArticle({ ...blog, contentType: "BLOG" }))}
            </div>
          )}
        </section>
      )}

      {activeTab === "saved" && isMe && (
        <section className="profile-pane">
          {savedQuery.isLoading ? (
            <div className="card">Loading saved content...</div>
          ) : savedItems.length === 0 ? (
            <EmptyState
              title="Your saved collection is empty"
              description="Save projects, posts, and blogs you want to revisit, and they will appear here."
            />
          ) : (
            <div className="profile-content-grid">
              {savedItems.map((item) => {
                const detailPath = getSavedDetailPath(item);
                const profilePath = getProfilePath(item.author);
                const galleryItems = buildSavedGalleryItems(item);
                const config = getContentConfig(item.contentType);
                const Icon = config.icon;
                const typeLabel = config.label;
                const aspect = item.contentType === "POST" ? "square" : "landscape";

                const isOwner = Boolean(currentUser?.id && item.author?.id === currentUser.id);

                return (
                  <article key={`${item.contentType}-${item.contentId}`} className={`content-surface ${isOwner ? "is-owner" : ""}`}>
                    <div className="content-surface__header">
                      <div className="content-surface__identity">
                        <Link to={profilePath} className="content-surface__avatar">{getAuthorAvatar(item.author)}</Link>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Link to={profilePath} className="content-surface__author">
                              {item.author?.fullName || item.author?.username || "VCollab member"}
                            </Link>
                            <FollowButton userId={item.author?.id} username={item.author?.username} />
                          </div>
                          <div className="content-surface__meta">
                            <span className={`content-badge-inline content-badge-inline--${config.variant}`}>
                              <Icon size={12} strokeWidth={2.5} /> {config.label}
                            </span>
                            {item.category?.name && (
                              <span className="content-surface__category">{item.category.name}</span>
                            )}
                            <span className="content-surface__date">Saved {formatDate(item.savedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="feed-badges">
                        <span className="feed-badge">Saved</span>
                      </div>
                    </div>

                    <MediaGallery items={galleryItems} title={item.title || typeLabel} variant="card" aspect={aspect} />

                    <div>
                      {item.title && <h3 className="content-surface__title">{item.title}</h3>}
                      <p className="content-surface__excerpt">{truncateRichText(item.excerpt, 180)}</p>
                    </div>

                    {item.tags?.length > 0 && (
                      <div className="tag-list">
                        {item.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="tag-chip">{tag}</span>
                        ))}
                      </div>
                    )}

                    {(item.githubUrl || item.demoUrl) && (
                      <div className="feed-link-row">
                        {item.githubUrl && (
                          <a href={item.githubUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                            <Github size={14} /> GitHub
                          </a>
                        )}
                        {item.demoUrl && (
                          <a href={item.demoUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                            <ExternalLink size={14} /> Live Demo
                          </a>
                        )}
                      </div>
                    )}

                    <div className="content-surface__footer">
                      <div className="profile-content-footer-actions">
                        <Link to={detailPath} className="btn-outline content-more-link">View More</Link>
                        {item.author?.username && (
                          <Link to={profilePath} className="btn-outline">View Author</Link>
                        )}
                      </div>
                    </div>

                    <ContentActions
                      contentType={item.contentType}
                      contentId={item.contentId}
                      counts={item}
                      queryKeys={[["saved-content"]]}
                      shareUrl={buildShareUrl(detailPath)}
                      authorUsername={item.author?.username}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
      {activeTab === "connections" && (
        <section className="profile-pane">
          {followersQuery.isLoading || followingQuery.isLoading ? (
            <div className="card">Loading connections...</div>
          ) : (
            <div className="connection-grid">
              <div className="card connection-column">
                <div>
                  <h3>Followers</h3>
                  <p className="profile-meta">People who are keeping up with {isMe ? "your" : "this"} profile.</p>
                </div>
                {followers.length === 0 ? (
                  <p>No followers yet.</p>
                ) : (
                  <div className="connection-list">
                    {followers.map((follower) => {
                      const followerProfile = follower.follower;
                      return (
                        <div key={follower.id} className="connection-card">
                          <Link to={getProfilePath(followerProfile)} className="connection-identity">
                            <div className="connection-avatar">{getAuthorAvatar(followerProfile)}</div>
                            <div className="connection-info">
                              <div className="connection-name">{getDisplayName(followerProfile)}</div>
                              <div className="connection-meta">@{followerProfile.username}</div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card connection-column">
                <div>
                  <h3>Following</h3>
                  <p className="profile-meta">People {isMe ? "you are" : "this contributor is"} following.</p>
                </div>
                {following.length === 0 ? (
                  <p>No connections yet.</p>
                ) : (
                  <div className="connection-list">
                    {following.map((follow) => {
                      const followingProfile = follow.following;
                      return (
                        <div key={follow.id} className="connection-card">
                          <Link to={getProfilePath(followingProfile)} className="connection-identity">
                            <div className="connection-avatar">{getAuthorAvatar(followingProfile)}</div>
                            <div className="connection-info">
                              <div className="connection-name">{getDisplayName(followingProfile)}</div>
                              <div className="connection-meta">@{followingProfile.username}</div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
