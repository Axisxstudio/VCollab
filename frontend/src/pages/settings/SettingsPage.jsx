import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bookmark,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  Folder,
  Globe,
  LibraryBig,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  UserRound,
  UserRoundCog,
  UsersRound,
  Facebook,
  Instagram,
  Linkedin
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { routes } from "../../config/routes";
import { listSavedContent, unsaveContent } from "../../services/save.service";
import { useAuthStore } from "../../store/authStore";

function getSavedPath(item) {
  const type = String(item.content_type || item.contentType || "").toUpperCase();
  const id = item.content_id || item.contentId;
  if (!id) return routes.search;
  if (type === "PROJECT") return routes.projectDetail.replace(":id", id);
  if (type === "POST") return routes.postDetail.replace(":id", id);
  if (type === "BLOG") return routes.blogDetail.replace(":id", id);
  return routes.search;
}

function getSavedLabel(item) {
  return String(item.content_type || item.contentType || "Content").replaceAll("_", " ").toLowerCase();
}

const axisxContact = {
  email: "info@axisxstudio.com",
  phone: "077 453 4056",
  phoneHref: "tel:0774534056",
  website: "https://axisxstudio.com"
};

const settingsPanels = {
  saved: {
    group: "Workspace",
    title: "Saved",
    icon: Bookmark
  },
  about: {
    group: "Support",
    title: "Help and about",
    icon: CircleHelp,
    intro: "VCollab is a professional collaboration platform for students, developers, and creators to publish work, connect with others, and grow projects through visible community interaction.",
    sections: [
      {
        title: "What VCollab helps you do",
        body: "Create and showcase projects, share posts and blogs, manage resources, send project requests, and keep conversations organized in one workspace."
      },
      {
        title: "Built for professional collaboration",
        body: "Instead of leaving projects, ideas, and useful content scattered across chats and drives, VCollab brings publishing, discovery, messaging, and feedback into one focused platform."
      },
      {
        title: "Getting started",
        body: "Complete your profile, publish your first project or post, explore contributors, save useful content, and use messages or project requests when you want to collaborate."
      },
      {
        title: "Need support?",
        body: `For platform questions or account support, contact AxisX Studio at ${axisxContact.email} or ${axisxContact.phone}.`
      }
    ]
  },
  privacy: {
    group: "Support",
    title: "Privacy Policy",
    icon: FileText,
    intro: "This policy explains how VCollab handles account, content, and collaboration data across the signed-in workspace.",
    meta: [
      ["Effective date", "March 23, 2026"],
      ["Scope", "Accounts, content, messaging, notifications, and live collaboration features"]
    ],
    sections: [
      {
        title: "Information we collect",
        body: "VCollab collects the information needed to operate the platform, including account details, profile information, published content, uploaded media, messages, engagement activity, and technical usage data."
      },
      {
        title: "How information is used",
        body: "We use information to provide core functionality, personalize discovery, support moderation, improve reliability, protect platform security, and deliver real-time collaboration experiences."
      },
      {
        title: "Visibility and sharing",
        body: "Public content such as projects, posts, blogs, selected profile details, and engagement counts may be visible to other users and, where configured, public visitors. VCollab does not sell personal information."
      },
      {
        title: "Retention and security",
        body: "Data is retained only as long as reasonably necessary for platform operations, legal obligations, dispute resolution, and safety controls. Administrative, technical, and operational safeguards are applied to protect account data and content."
      },
      {
        title: "Your choices",
        body: "You can manage profile information, edit or remove content you own, and contact support for account access or data concerns."
      },
      {
        title: "Privacy support",
        body: `For privacy questions, data requests, or account concerns, contact AxisX Studio at ${axisxContact.email} or ${axisxContact.phone}.`
      }
    ]
  },
  terms: {
    group: "Support",
    title: "Terms of Service",
    icon: FileText,
    intro: "These terms define how VCollab can be used across public discovery, publishing, messaging, and real-time collaboration.",
    meta: [
      ["Effective date", "March 23, 2026"],
      ["Operator", "AxisX Studio"]
    ],
    sections: [
      {
        title: "Using the platform",
        body: "VCollab is intended for professional collaboration, project discovery, publishing, and communication. You are responsible for the accuracy of your account details and activity performed through your account."
      },
      {
        title: "Content ownership and responsibility",
        body: "You retain ownership of content you create and upload. By publishing content on VCollab, you grant the rights needed to host, display, distribute, and process that content within platform features."
      },
      {
        title: "Content standards",
        body: "Do not upload unlawful, infringing, deceptive, abusive, or malicious content. Content that violates platform rules, safety standards, or legal requirements may be removed or restricted."
      },
      {
        title: "Realtime features and availability",
        body: "Notifications, live feeds, comments, messaging, and collaboration updates are provided on a best-effort basis and may be affected by browser support, network conditions, maintenance, or security controls."
      },
      {
        title: "Moderation and enforcement",
        body: "VCollab may investigate abuse, enforce content standards, limit access, suspend accounts, or preserve records when necessary to protect the community or comply with law."
      },
      {
        title: "Questions about these terms",
        body: `Questions about these terms can be sent to AxisX Studio at ${axisxContact.email} or ${axisxContact.phone}.`
      }
    ]
  }
};

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { panel } = useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const profilePath = user?.username ? routes.profile.replace(":username", user.username) : routes.home;

  const { data: savedItems = [], isLoading: savedLoading } = useQuery({
    queryKey: ["saved-content"],
    queryFn: listSavedContent
  });

  const handleLogout = () => {
    clearAuth();
    navigate(routes.landing);
  };

  const handleUnsave = async (item) => {
    await unsaveContent(item.content_type || item.contentType, item.content_id || item.contentId);
    await queryClient.invalidateQueries({ queryKey: ["saved-content"] });
  };

  const settingsGroups = [
    {
      label: "Account",
      items: [
        { id: "profile", label: "My profile", description: "View your public profile", icon: UserRound, path: profilePath },
        { id: "edit-profile", label: "Edit profile", description: "Update profile details and images", icon: UserRoundCog, path: routes.profileEdit }
      ]
    },
    {
      label: "Workspace",
      items: [
        { id: "saved", label: "Saved", description: `${savedItems.length} saved item${savedItems.length === 1 ? "" : "s"}`, icon: Bookmark, panel: "saved" },
        { id: "notifications", label: "Notifications", description: "Open your realtime inbox", icon: Bell, path: routes.notifications },
        { id: "messages", label: "Messages", description: "Open conversations", icon: MessageSquare, path: routes.messages },
        { id: "requests", label: "Project requests", description: "Review sent and received requests", icon: UsersRound, path: routes.requests },
        { id: "resources", label: "Resources", description: "Manage your resource files", icon: LibraryBig, path: routes.resourceManage },
        { id: "warnings", label: "Warnings", description: "Review moderation and safety alerts", icon: AlertTriangle, path: routes.warnings }
      ]
    },
    {
      label: "Support",
      items: [
        { id: "search", label: "Search VCollab", description: "Find people, projects, posts, and blogs", icon: Search, path: routes.search },
        { id: "about", label: "Help and about", description: "Learn about VCollab", icon: CircleHelp, panel: "about" },
        { id: "privacy", label: "Privacy Policy", description: "Read data and privacy details", icon: FileText, panel: "privacy" },
        { id: "terms", label: "Terms of Service", description: "Read platform terms", icon: FileText, panel: "terms" }
      ]
    }
  ];

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return settingsGroups;
    return settingsGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query))
      }))
      .filter((group) => group.items.length > 0);
  }, [searchQuery, savedItems.length]);

  const handleItemClick = (item) => {
    if (item.panel) {
      navigate(routes.settingsPanel.replace(":panel", item.panel));
      return;
    }
    if (item.path) navigate(item.path);
  };

  const activePanel = panel || null;
  const activePanelInfo = activePanel ? settingsPanels[activePanel] : null;
  const ActivePanelIcon = activePanelInfo?.icon || Bookmark;

  const renderPanelContent = () => {
    if (activePanel === "saved") {
      return (
        <div className="settings-ig-detail__stack">
          {savedLoading && <div className="settings-ig-no-results">Loading saved content...</div>}

          {!savedLoading && savedItems.length === 0 && (
            <div className="settings-ig-placeholder">
              <Bookmark size={54} />
              <h4>No saved content yet</h4>
              <p>Projects, posts, and blogs you save will appear here.</p>
              <button className="settings-ig-action" type="button" onClick={() => navigate(routes.search)}>
                <Search size={18} />
                <span>Explore content</span>
              </button>
            </div>
          )}

          {!savedLoading && savedItems.length > 0 && (
            <div className="settings-ig-saved-list">
              {savedItems.map((item) => (
                <article className="settings-ig-saved-item" key={item.id}>
                  <span className="settings-ig-saved-item__icon">
                    {String(item.content_type || item.contentType).toUpperCase() === "PROJECT" ? <Folder size={18} /> : <FileText size={18} />}
                  </span>
                  <div>
                    <strong>{getSavedLabel(item)}</strong>
                    <span>Saved item #{item.content_id || item.contentId}</span>
                  </div>
                  <div className="settings-ig-saved-item__actions">
                    <button type="button" onClick={() => navigate(getSavedPath(item))} aria-label="Open saved item">
                      <ExternalLink size={16} />
                    </button>
                    <button type="button" onClick={() => handleUnsave(item)} aria-label="Remove saved item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="settings-account-doc">
        <p className="settings-account-doc__intro">{activePanelInfo.intro}</p>

        <div className="settings-contact-card">
          <div>
            <span>Contact AxisX Studio</span>
            <strong>Support for VCollab users</strong>
          </div>
          <div className="settings-contact-card__actions">
            <a href={`mailto:${axisxContact.email}`} aria-label="Email AxisX Studio">
              <Mail size={16} />
              <span>Email</span>
            </a>
            <a href={axisxContact.phoneHref} aria-label="Call AxisX Studio">
              <Phone size={16} />
              <span>Call</span>
            </a>
            <a href={axisxContact.website} target="_blank" rel="noreferrer" aria-label="Open AxisX Studio website">
              <Globe size={16} />
              <span>Website</span>
            </a>
            <a href="https://www.facebook.com/axisxstudio" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook size={16} />
              <span>Facebook</span>
            </a>
            <a href="https://www.instagram.com/axisxstudio/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={16} />
              <span>Instagram</span>
            </a>
            <a href="https://www.linkedin.com/company/axisxstudio/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <Linkedin size={16} />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        {activePanelInfo.meta && (
          <div className="settings-account-doc__meta">
            {activePanelInfo.meta.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="settings-account-doc__sections">
          {activePanelInfo.sections.map((section) => (
            <section key={section.title} className="settings-account-doc__section">
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    );
  };

  if (activePanel && !activePanelInfo) {
    return <Navigate to={routes.settings} replace />;
  }

  if (activePanelInfo) {
    return (
      <div className="settings-ig section">
        <div className="settings-subpage">
          <button type="button" className="settings-subpage__back" onClick={() => navigate(routes.settings)}>
            <ArrowLeft size={18} />
            <span>Settings</span>
          </button>

          <section className="settings-ig-detail settings-ig-detail--page" aria-live="polite">
            <div className="settings-ig-detail__header">
              <span className="settings-ig-detail__icon">
                <ActivePanelIcon size={24} />
              </span>
              <div>
                <span>{activePanelInfo.group}</span>
                <h3>{activePanelInfo.title}</h3>
              </div>
            </div>

            {renderPanelContent()}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-ig section">
      <div className="settings-ig__shell settings-ig__shell--single">
        <section className="settings-ig-menu" aria-label="Settings">
          <div className="settings-ig-menu__header">
            <div>
              <span>Settings</span>
              <h2>{user?.fullName || user?.username || "VCollab"}</h2>
            </div>
            <Link to={profilePath} className="settings-ig-menu__avatar" aria-label="Open profile">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "V"}
            </Link>
          </div>

          <label className="settings-ig-search">
            <Search size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search settings"
            />
          </label>

          <div className="settings-ig-list">
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <div className="settings-ig-group" key={group.label}>
                  <h3>{group.label}</h3>
                  <div className="settings-ig-group__items">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="settings-ig-row"
                      >
                        <span className="settings-ig-row__icon">
                          <item.icon size={21} />
                        </span>
                        <span className="settings-ig-row__copy">
                          <strong>{item.label}</strong>
                          <span>{item.description}</span>
                        </span>
                        <ChevronRight className="settings-ig-row__chevron" size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="settings-ig-no-results">
                <Search size={30} />
                <strong>No settings found</strong>
                <span>Try a different search term.</span>
              </div>
            )}
          </div>

          <button type="button" className="settings-ig-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </section>
      </div>
    </div>
  );
}
