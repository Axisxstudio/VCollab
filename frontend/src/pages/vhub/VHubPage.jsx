import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCcw,
  Search,
  SendHorizontal,
  Shield,
  Trash2
} from "lucide-react";
import {
  createVHubReply,
  createVHubThread,
  deleteVHubReply,
  deleteVHubThread,
  getVHubSettings,
  getVHubThread,
  listVHubReplies,
  listVHubThreads,
  reopenVHubThread,
  solveVHubThread
} from "../../services/vhub.service";
import { useAuthStore } from "../../store/authStore";
import { formatTimeAgo } from "../../utils/date";
import useVHubUpdates from "../../websocket/useVHubUpdates";
import "../../styles/vhub.css";

const THREAD_TYPES = ["HELP", "QUESTION", "DISCUSSION"];
const STATUS_FILTERS = ["ALL", "OPEN", "SOLVED"];

function buildTags(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function buildThreadParams(filters) {
  const params = { page: 0, size: 30, sort: "lastActivityAt,desc" };
  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.q.trim()) params.q = filters.q.trim();
  return params;
}

function getAuthorName(author) {
  if (!author) return "Visitor";
  return author.displayName || author.fullName || author.username || "Visitor";
}

function getAuthorMeta(author) {
  if (!author) return "Public visitor";
  if (author.guest) return "Public visitor";
  if (author.username) return `@${author.username}`;
  return "Member";
}

export default function VHubPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const composerSectionRef = useRef(null);
  const composerTitleRef = useRef(null);
  const [filters, setFilters] = useState({ q: "", type: "", status: "" });
  const [composer, setComposer] = useState({ title: "", body: "", threadType: "HELP", tags: "" });
  const [replyBody, setReplyBody] = useState("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const threadId = useMemo(() => {
    const raw = searchParams.get("thread");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);
  const composeMode = searchParams.get("compose") === "1";

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["v-hub", "settings"],
    queryFn: getVHubSettings,
    staleTime: 30000
  });

  const guestBlocked = !currentUser && settings && !settings.allowGuestView;

  const { data: threadPage, isLoading: threadListLoading, error: threadListError } = useQuery({
    queryKey: ["v-hub", "threads", filters.q, filters.type, filters.status],
    queryFn: () => listVHubThreads(buildThreadParams(filters)),
    enabled: !settingsLoading && settings?.mode !== "DISABLED" && !guestBlocked
  });

  const threads = threadPage?.content || [];

  const { data: activeThread, isLoading: activeThreadLoading } = useQuery({
    queryKey: ["v-hub", "thread", String(threadId)],
    queryFn: () => getVHubThread(threadId),
    enabled: Boolean(threadId) && !settingsLoading && settings?.mode !== "DISABLED" && !guestBlocked
  });

  const { data: replyPage, isLoading: repliesLoading } = useQuery({
    queryKey: ["v-hub", "replies", String(threadId)],
    queryFn: () => listVHubReplies(threadId, { page: 0, size: 100, sort: "createdAt,asc" }),
    enabled: Boolean(threadId) && !settingsLoading && settings?.mode !== "DISABLED" && !guestBlocked
  });

  const replies = replyPage?.content || [];

  useVHubUpdates(threadId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vhub-guest-identity");
    }
  }, []);

  useEffect(() => {
    if (composeMode) {
      return;
    }
    if (!threadId && threads.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set("thread", String(threads[0].id));
      setSearchParams(next, { replace: true });
    }
  }, [composeMode, threadId, threads, searchParams, setSearchParams]);

  useEffect(() => {
    if (!composeMode) {
      return;
    }

    const timer = window.setTimeout(() => {
      composerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      composerTitleRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [composeMode]);

  const readOnly = settings?.mode === "READ_ONLY";
  const disabled = settings?.mode === "DISABLED";

  const selectThread = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("thread", String(id));
    setSearchParams(next, { replace: true });
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    setIsCreatingThread(true);
    try {
      const created = await createVHubThread({
        title: composer.title,
        body: composer.body,
        threadType: composer.threadType,
        tags: buildTags(composer.tags)
      });
      setComposer({ title: "", body: "", threadType: "HELP", tags: "" });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      const next = new URLSearchParams(searchParams);
      next.delete("compose");
      next.set("thread", String(created.id));
      setSearchParams(next, { replace: true });
      toast.success("Your V Hub thread is live.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to create the thread.");
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleCreateReply = async (event) => {
    event.preventDefault();
    if (!threadId) return;
    setIsCreatingReply(true);
    try {
      await createVHubReply(threadId, { body: replyBody });
      setReplyBody("");
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "replies", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "thread", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      toast.success("Reply posted.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to post the reply.");
    } finally {
      setIsCreatingReply(false);
    }
  };

  const handleMarkBestAnswer = async (replyId) => {
    if (!threadId) return;
    setBusyAction(`solve-${replyId}`);
    try {
      await solveVHubThread(threadId, { bestReplyId: replyId });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "thread", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "replies", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      toast.success("Best answer selected.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to solve the thread.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReopenThread = async () => {
    if (!threadId) return;
    setBusyAction("reopen");
    try {
      await reopenVHubThread(threadId);
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "thread", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "replies", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      toast.success("Thread reopened.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to reopen the thread.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteThread = async () => {
    if (!threadId || !window.confirm("Delete this V Hub thread?")) return;
    setBusyAction("delete-thread");
    try {
      await deleteVHubThread(threadId);
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      const next = new URLSearchParams(searchParams);
      next.delete("thread");
      setSearchParams(next, { replace: true });
      toast.success("Thread deleted.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete the thread.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    setBusyAction(`delete-reply-${replyId}`);
    try {
      await deleteVHubReply(replyId);
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "replies", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "thread", String(threadId)] });
      await queryClient.invalidateQueries({ queryKey: ["v-hub", "threads"] });
      toast.success("Reply deleted.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete the reply.");
    } finally {
      setBusyAction("");
    }
  };

  const renderComposerIdentityNote = () => {
    if (currentUser) {
      return (
        <div className="vhub-identity-note">
          Posting as <strong>{currentUser.fullName || currentUser.username}</strong> from the public V Hub.
        </div>
      );
    }

    return <p className="vhub-mini-copy">Signed-out threads and replies are published as <strong>Visitor</strong>.</p>;
  };

  if (settingsLoading) {
    return (
      <div className="vhub-public-shell">
        <div className="vhub-page-shell">
          <div className="vhub-empty-state">
            <Loader2 size={22} className="spin" />
            <p>Loading V Hub...</p>
          </div>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="vhub-public-shell">
        <div className="vhub-page-shell">
          <section className="vhub-hero-card">
            <div>
              <span className="vhub-eyebrow">V Hub</span>
              <h1>V Hub is currently disabled</h1>
              <p>The admin has turned off this public conversation space for now.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (guestBlocked) {
    return (
      <div className="vhub-public-shell">
        <div className="vhub-page-shell">
          <section className="vhub-hero-card">
            <div>
              <span className="vhub-eyebrow">V Hub</span>
              <h1>V Hub is members-only right now</h1>
              <p>Public visitor access is currently paused by the admin. Signed-in members can still open V Hub when allowed.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="vhub-public-shell">
      <div className="vhub-page-shell">
        <section className="vhub-hero-card">
          <div>
            <span className="vhub-eyebrow">Public community space</span>
            <h1>V Hub</h1>
            <p>Anyone visiting VCollab can ask for help, share an idea, or reply to a thread from this public landing-side community board.</p>
          </div>
          <div className="vhub-hero-status">
            <span className={`vhub-status-pill ${readOnly ? "warning" : "success"}`}>
              {readOnly ? "Read only" : "Public and live"}
            </span>
            <span className="vhub-status-note">{currentUser ? "Signed in member view" : "Visitor view"}</span>
          </div>
        </section>

        {readOnly && (
          <div className="vhub-banner warning">
            V Hub is in read-only mode. Visitors can browse threads, but new posts and replies are paused by the admin.
          </div>
        )}

        {threadListError && (
          <div className="vhub-banner danger">
            {threadListError?.response?.data?.message || "Unable to load V Hub threads right now."}
          </div>
        )}

        <div className="vhub-page-grid">
          <section
            ref={composerSectionRef}
            className={`vhub-sidebar-panel ${composeMode ? "vhub-sidebar-panel--compose" : ""}`}
          >
            <div className="vhub-panel-header">
              <div>
                <span className="vhub-panel-eyebrow">Ask in public</span>
                <h2>Start a thread</h2>
              </div>
            </div>

            <form className="vhub-composer" onSubmit={handleCreateThread}>
              {renderComposerIdentityNote()}
              <input
                ref={composerTitleRef}
                type="text"
                placeholder="Category"
                value={composer.title}
                onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))}
                disabled={readOnly || isCreatingThread}
              />
              <textarea
                rows={5}
                placeholder="Describe the problem or discussion you want help with."
                value={composer.body}
                onChange={(event) => setComposer((current) => ({ ...current, body: event.target.value }))}
                disabled={readOnly || isCreatingThread}
              />
              <button type="submit" className="vhub-primary-btn" disabled={readOnly || isCreatingThread}>
                {isCreatingThread ? <Loader2 size={16} className="spin" /> : <SendHorizontal size={16} />}
                Create thread
              </button>
            </form>

            <div className="vhub-panel-header vhub-panel-header--compact">
              <div>
                <span className="vhub-panel-eyebrow">Discover</span>
                <h2>Browse threads</h2>
              </div>
            </div>

            <div className="vhub-filter-stack">
              <label className="vhub-search-input">
                <Search size={16} />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                  placeholder="Search V Hub"
                />
              </label>

              <div className="vhub-filter-row">
                {THREAD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`vhub-chip ${filters.type === type ? "active" : ""}`}
                    onClick={() => setFilters((current) => ({ ...current, type: current.type === type ? "" : type }))}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="vhub-filter-row">
                {STATUS_FILTERS.map((status) => {
                  const active = (status === "ALL" && !filters.status) || filters.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`vhub-chip ${active ? "active" : ""}`}
                      onClick={() => setFilters((current) => ({ ...current, status: status === "ALL" ? "" : status }))}
                    >
                      {status === "ALL" ? "All" : status}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="vhub-thread-list">
              {threadListLoading && (
                <div className="vhub-empty-state small">
                  <Loader2 size={18} className="spin" />
                  <p>Loading threads...</p>
                </div>
              )}

              {!threadListLoading && threads.length === 0 && (
                <div className="vhub-empty-state small">
                  <p>No threads match the current filters yet.</p>
                </div>
              )}

              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`vhub-thread-card ${threadId === thread.id ? "active" : ""}`}
                  onClick={() => selectThread(thread.id)}
                >
                  <div className="vhub-thread-card__meta">
                    <span className="vhub-type-badge">{thread.threadType}</span>
                    {thread.status === "SOLVED" && <span className="vhub-status-pill success">Solved</span>}
                  </div>
                  <h3>{thread.title}</h3>
                  <p>{thread.bodyPreview}</p>
                  <div className="vhub-thread-card__footer">
                    <span>{getAuthorName(thread.author)}</span>
                    <span>{thread.replyCount} replies</span>
                    <span>{formatTimeAgo(thread.lastActivityAt || thread.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="vhub-detail-panel">
            {!threadId && (
              <div className="vhub-empty-state">
                <p>{composeMode ? "Create your thread and the conversation will appear here after you publish." : "Select a thread to see the full conversation."}</p>
              </div>
            )}

            {threadId && activeThreadLoading && (
              <div className="vhub-empty-state">
                <Loader2 size={22} className="spin" />
                <p>Loading thread...</p>
              </div>
            )}

            {threadId && activeThread && (
              <>
                <header className="vhub-detail-header">
                  <div>
                    <div className="vhub-thread-card__meta">
                      <span className="vhub-type-badge">{activeThread.threadType}</span>
                      {activeThread.status === "SOLVED" ? (
                        <span className="vhub-status-pill success">Solved</span>
                      ) : (
                        <span className="vhub-status-pill neutral">Open</span>
                      )}
                      {activeThread.locked && (
                        <span className="vhub-status-pill neutral">
                          <Lock size={12} />
                          Locked
                        </span>
                      )}
                      {activeThread.currentUserCanModerate && activeThread.hidden && (
                        <span className="vhub-status-pill warning">
                          <Shield size={12} />
                          Hidden
                        </span>
                      )}
                    </div>
                    <h2>{activeThread.title}</h2>
                    <div className="vhub-detail-meta">
                      <span>{getAuthorName(activeThread.author)}</span>
                      <span>{getAuthorMeta(activeThread.author)}</span>
                      <span>{formatTimeAgo(activeThread.lastActivityAt || activeThread.createdAt)}</span>
                      <span>{activeThread.viewCount} views</span>
                      <span>{activeThread.participantCount} members joined</span>
                    </div>
                  </div>

                  <div className="vhub-detail-actions">
                    {activeThread.status === "SOLVED" && (activeThread.currentUserCanEdit || activeThread.currentUserCanModerate) && (
                      <button type="button" className="vhub-secondary-btn" onClick={handleReopenThread} disabled={busyAction === "reopen"}>
                        <RefreshCcw size={16} />
                        Reopen
                      </button>
                    )}
                    {activeThread.currentUserCanDelete && (
                      <button type="button" className="vhub-danger-btn" onClick={handleDeleteThread} disabled={busyAction === "delete-thread"}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                </header>

                <article className="vhub-thread-body">
                  <p>{activeThread.body}</p>
                  {activeThread.tags?.length > 0 && (
                    <div className="vhub-tag-row">
                      {activeThread.tags.map((tag) => (
                        <span key={tag} className="vhub-tag-chip">#{tag}</span>
                      ))}
                    </div>
                  )}
                </article>

                <section className="vhub-reply-section">
                  <div className="vhub-panel-header vhub-panel-header--compact">
                    <div>
                      <span className="vhub-panel-eyebrow">Public replies</span>
                      <h2>{activeThread.replyCount} replies</h2>
                    </div>
                  </div>

                  {repliesLoading && (
                    <div className="vhub-empty-state small">
                      <Loader2 size={18} className="spin" />
                      <p>Loading replies...</p>
                    </div>
                  )}

                  {!repliesLoading && replies.length === 0 && (
                    <div className="vhub-empty-state small">
                      <p>No replies yet. Be the first to respond.</p>
                    </div>
                  )}

                  <div className="vhub-reply-list">
                    {replies.map((reply) => (
                      <article key={reply.id} className={`vhub-reply-card ${reply.bestAnswer ? "best" : ""}`}>
                        <div className="vhub-reply-card__header">
                          <div>
                            <strong>{getAuthorName(reply.author)}</strong>
                            <span>{getAuthorMeta(reply.author)}</span>
                            <span>{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                          <div className="vhub-reply-actions">
                            {reply.bestAnswer && (
                              <span className="vhub-status-pill success">
                                <CheckCircle2 size={12} />
                                Best answer
                              </span>
                            )}
                            {!reply.bestAnswer && activeThread.status !== "SOLVED" && (activeThread.currentUserCanEdit || activeThread.currentUserCanModerate) && (
                              <button
                                type="button"
                                className="vhub-secondary-btn"
                                onClick={() => handleMarkBestAnswer(reply.id)}
                                disabled={busyAction === `solve-${reply.id}`}
                              >
                                <CheckCircle2 size={15} />
                                Mark best
                              </button>
                            )}
                            {reply.currentUserCanDelete && (
                              <button
                                type="button"
                                className="vhub-icon-btn"
                                onClick={() => handleDeleteReply(reply.id)}
                                disabled={busyAction === `delete-reply-${reply.id}`}
                                title="Delete reply"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p>{reply.body}</p>
                      </article>
                    ))}
                  </div>

                  <form className="vhub-reply-composer" onSubmit={handleCreateReply}>
                    {renderComposerIdentityNote()}
                    <textarea
                      rows={4}
                      placeholder={readOnly ? "Replies are currently paused by the admin." : "Write a helpful public reply..."}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      disabled={readOnly || !activeThread.currentUserCanReply || isCreatingReply}
                    />
                    <button
                      type="submit"
                      className="vhub-primary-btn"
                      disabled={readOnly || !activeThread.currentUserCanReply || isCreatingReply}
                    >
                      {isCreatingReply ? <Loader2 size={16} className="spin" /> : <SendHorizontal size={16} />}
                      Reply
                    </button>
                  </form>
                </section>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
