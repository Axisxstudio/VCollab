import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ChevronLeft, ChevronRight, Loader2, SendHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { routes } from "../../config/routes";
import { createVHubThread, getVHubThread, listVHubReplies, listVHubThreads, createVHubReply } from "../../services/vhub.service";
import { formatTimeAgo } from "../../utils/date";
import "../../styles/vhub.css";

function getAuthorLabel(author) {
  if (!author) return "Visitor";
  return author.displayName || author.fullName || author.username || "Visitor";
}

export default function VHubLauncher({ mode }) {
  const navigate = useNavigate();
  const launcherRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const disabled = !mode || mode === "DISABLED";
  const queryClient = useQueryClient();
  const [view, setView] = useState("HISTORY"); // HISTORY, COMPOSE, or THREAD_DETAIL
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [inlineReplyId, setInlineReplyId] = useState(null);
  const [composerBody, setComposerBody] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const { data: threadPage, isLoading, isError } = useQuery({
    queryKey: ["v-hub", "launcher", "threads"],
    queryFn: () => listVHubThreads({ page: 0, size: 40, sort: "lastActivityAt,desc" }),
    enabled: isOpen && !disabled && view === "HISTORY"
  });

  const { data: fetchedThreadDetail, isLoading: isLoadingDetail, isError: isErrorDetail } = useQuery({
    queryKey: ["v-hub", "launcher", "thread", selectedThreadId],
    queryFn: () => getVHubThread(selectedThreadId),
    enabled: !!selectedThreadId && view === "THREAD_DETAIL"
  });

  const { data: repliesData, isLoading: isLoadingReplies, isError: isErrorReplies } = useQuery({
    queryKey: ["v-hub", "launcher", "replies", selectedThreadId],
    queryFn: () => listVHubReplies(selectedThreadId, { page: 0, size: 50, sort: "createdAt,asc" }),
    enabled: !!selectedThreadId && view === "THREAD_DETAIL"
  });

  const createThreadMutation = useMutation({
    mutationFn: (payload) => createVHubThread(payload),
    onSuccess: () => {
      toast.success("Message posted to community.");
      queryClient.invalidateQueries({ queryKey: ["v-hub", "launcher", "threads"] });
      setComposerBody("");
      setView("HISTORY");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Unable to post message.");
    }
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ threadId, payload }) => createVHubReply(threadId, payload),
    onSuccess: (_, variables) => {
      toast.success("Reply posted.");
      queryClient.invalidateQueries({ queryKey: ["v-hub", "launcher", "replies", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["v-hub", "launcher", "threads"] });
      setReplyBody("");
      setInlineReplyId(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Unable to post reply.");
    }
  });

  const recentThreads = threadPage?.content || [];
  const replies = repliesData?.content || [];
  const activeThread = fetchedThreadDetail || recentThreads.find(t => String(t.id) === String(selectedThreadId));

  const groupedThreads = (() => {
    const groups = {};
    recentThreads.forEach(thread => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const date = new Date(thread.lastActivityAt || thread.createdAt);
      date.setHours(0, 0, 0, 0);
      
      let label = "";
      if (date.getTime() === today.getTime()) label = "Today";
      else if (date.getTime() === yesterday.getTime()) label = "Yesterday";
      else label = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(thread);
    });
    return groups;
  })();

  useEffect(() => {
    if (disabled || !isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (launcherRef.current && !launcherRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openComposeView = () => {
    setView("COMPOSE");
  };

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!composerBody.trim()) {
      toast.error("Please describe what you need help with.");
      return;
    }
    createThreadMutation.mutate({
      title: "Community Inquiry",
      body: composerBody,
      threadType: "HELP",
      tags: []
    });
  };

  const openThread = (threadId) => {
    setSelectedThreadId(threadId);
    setView("THREAD_DETAIL");
  };

  const handleReplySubmit = (e, threadIdOverride = null) => {
    e.preventDefault();
    const threadId = threadIdOverride || selectedThreadId;
    if (!replyBody.trim()) {
      toast.error("Please enter a reply.");
      return;
    }
    createReplyMutation.mutate({ threadId, payload: { body: replyBody } });
  };

  const startInlineReply = (threadId) => {
    setInlineReplyId(threadId);
    setReplyBody("");
    setTimeout(() => {
      const input = document.getElementById(`inline-reply-${threadId}`);
      if (input) input.focus();
    }, 100);
  };

  if (disabled) {
    return null;
  }

  return (
    <div ref={launcherRef} className={`vhub-launcher ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        className="vhub-launcher__button"
        aria-label="Open V Hub"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
        title={mode === "READ_ONLY" ? "Open V Hub in read-only mode" : "Open V Hub"}
      >
        <span className="vhub-launcher__letter">V</span>
      </button>

      {isOpen && <div className="vhub-launcher__backdrop" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <section className="vhub-launcher__menu" role="dialog" aria-label="V Hub launcher content">
          {view === "HISTORY" && (
            <>
              <div className="vhub-launcher__menu-header">
                <div>
                  <span className="vhub-launcher__eyebrow">{mode === "READ_ONLY" ? "Read only" : "Public threads"}</span>
                  <h3 className="vhub-launcher__title">Community history</h3>
                </div>
                <button
                  type="button"
                  className="vhub-launcher__action"
                  onClick={openComposeView}
                  disabled={mode === "READ_ONLY"}
                >
                  <MessageCircle size={14} />
                  Ask in public
                </button>
              </div>

              <div className="vhub-launcher__menu-copy">
                Review the latest community conversations, or start a new public discussion.
              </div>

              <div className="vhub-launcher__history">
                {isLoading && (
                  <div className="vhub-launcher__empty">
                    <Loader2 size={16} className="spin" />
                    <span>Loading community...</span>
                  </div>
                )}

                {!isLoading && isError && (
                  <div className="vhub-launcher__empty">
                    <span>Unable to load contents.</span>
                  </div>
                )}

                {!isLoading && !isError && recentThreads.length === 0 && (
                  <div className="vhub-launcher__empty">
                    <span>No conversations yet.</span>
                  </div>
                )}

                {!isLoading && !isError && recentThreads.length > 0 && (
                  <div className="vhub-launcher__history-scroll">
                    {Object.entries(groupedThreads).map(([label, threads]) => (
                      <div key={label} className="vhub-launcher__history-group">
                        <div className="vhub-launcher__history-date-header">
                          <span>{label}</span>
                        </div>
                        <div className="vhub-launcher__history-list">
                          {threads.map((thread) => (
                            <div key={thread.id} className="vhub-launcher__history-item-wrapper">
                              <button
                                type="button"
                                className="vhub-launcher__history-item"
                                onClick={() => openThread(thread.id)}
                              >
                                <span className="vhub-launcher__history-body-preview">{thread.body}</span>
                                <div className="vhub-launcher__history-meta">
                                  <span>{getAuthorLabel(thread.author)}</span>
                                  <span className="vhub-meta-dot">•</span>
                                  <span>{thread.replyCount} replies</span>
                                  <span className="vhub-meta-dot">•</span>
                                  <span>{formatTimeAgo(thread.lastActivityAt || thread.createdAt)}</span>
                                  <ChevronRight size={14} className="vhub-launcher__meta-chevron" />
                                </div>
                              </button>
                              
                              {inlineReplyId === thread.id ? (
                                <form 
                                  className="vhub-launcher__inline-reply-box"
                                  onSubmit={(e) => handleReplySubmit(e, thread.id)}
                                >
                                  <textarea
                                    id={`inline-reply-${thread.id}`}
                                    placeholder="Write a quick reply..."
                                    value={replyBody}
                                    onChange={(e) => setReplyBody(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="vhub-launcher__inline-reply-actions">
                                    <button 
                                      type="button" 
                                      className="vhub-launcher__inline-reply-cancel"
                                      onClick={() => setInlineReplyId(null)}
                                    >
                                      <X size={14} />
                                    </button>
                                    <button 
                                      type="submit" 
                                      className="vhub-launcher__inline-reply-send"
                                      disabled={!replyBody.trim() || createReplyMutation.isPending}
                                    >
                                      {createReplyMutation.isPending ? <Loader2 size={12} className="spin" /> : <SendHorizontal size={14} />}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  className="vhub-launcher__history-reply-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startInlineReply(thread.id);
                                  }}
                                  title="Quick reply"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form 
                className="vhub-launcher__reply-composer" 
                onSubmit={handleComposeSubmit}
                style={{ borderTop: "1px solid var(--vhub-border)", padding: "12px 16px" }}
              >
                <textarea
                  placeholder="Share something with the community..."
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  disabled={mode === "READ_ONLY" || createThreadMutation.isPending}
                  style={{ minHeight: "40px", fontSize: "0.8rem" }}
                />
                <button
                  type="submit"
                  className="vhub-launcher__reply-send"
                  disabled={mode === "READ_ONLY" || !composerBody.trim() || createThreadMutation.isPending}
                >
                  {createThreadMutation.isPending ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <SendHorizontal size={16} />
                  )}
                </button>
              </form>
            </>
          )}

          {view === "COMPOSE" && (
            <>
              <div className="vhub-launcher__menu-header">
                <div>
                  <span className="vhub-launcher__eyebrow">Public community</span>
                  <h3 className="vhub-launcher__title">Start a discussion</h3>
                </div>
                <button
                  type="button"
                  className="vhub-launcher__action"
                  onClick={() => setView("HISTORY")}
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              </div>

              <form className="vhub-launcher__compose" onSubmit={handleComposeSubmit}>
                <div className="vhub-launcher__field">
                  <label htmlFor="vhub-body">What do you want to share or discuss?</label>
                  <textarea
                    id="vhub-body"
                    placeholder="Tell us more about what you need..."
                    value={composerBody}
                    onChange={(e) => setComposerBody(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="vhub-launcher__footer">
                  <button
                    type="submit"
                    className="vhub-primary-btn"
                    disabled={createThreadMutation.isPending}
                    style={{ width: "100%", borderRadius: "12px", minHeight: "44px" }}
                  >
                    {createThreadMutation.isPending ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <>
                        <SendHorizontal size={14} />
                        <span>Post message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {view === "THREAD_DETAIL" && (
            <div className="vhub-launcher__detail-view">
              <div className="vhub-launcher__menu-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="vhub-launcher__eyebrow">Thread Detail</span>
                  <h3 className="vhub-launcher__title text-truncate">
                    {activeThread?.title || (isLoadingDetail ? "Loading..." : "Original Post")}
                  </h3>
                </div>
                <button
                  type="button"
                  className="vhub-launcher__action"
                  onClick={() => {
                    setView("HISTORY");
                    setSelectedThreadId(null);
                  }}
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              </div>

              <div className="vhub-launcher__thread-content">
                {isErrorDetail ? (
                  <div className="vhub-launcher__empty">
                    <span>Unable to load contents.</span>
                  </div>
                ) : !activeThread && isLoadingDetail ? (
                  <div className="vhub-launcher__empty">
                    <Loader2 size={16} className="spin" />
                    <span>Loading discussion...</span>
                  </div>
                ) : (
                  <>
                    <div className="vhub-launcher__thread-original">
                      <div className="vhub-launcher__thread-author-meta">
                        <strong>{getAuthorLabel(activeThread?.author)}</strong>
                        <span>{formatTimeAgo(activeThread?.createdAt)}</span>
                      </div>
                      <p>{activeThread?.body}</p>
                    </div>

                    <div className="vhub-launcher__replies-section">
                      <div className="vhub-launcher__replies-header">
                        {replies.length} {replies.length === 1 ? "reply" : "replies"}
                      </div>

                      {isLoadingReplies ? (
                        <div className="vhub-launcher__empty" style={{ minHeight: "60px" }}>
                          <Loader2 size={14} className="spin" />
                        </div>
                      ) : isErrorReplies ? (
                        <div className="vhub-launcher__empty-small">
                          Unable to load replies.
                        </div>
                      ) : replies.length === 0 ? (
                        <div className="vhub-launcher__empty-small">
                          No replies yet. Be the first to help!
                        </div>
                      ) : (
                        <div className="vhub-launcher__replies-list" style={{ flex: 1, minHeight: 0 }}>
                          {replies.map((reply) => (
                            <div key={reply.id} className="vhub-launcher__reply-item">
                              <div className="vhub-launcher__reply-author">
                                <strong>{getAuthorLabel(reply.author)}</strong>
                                <span>{formatTimeAgo(reply.createdAt)}</span>
                              </div>
                              <p>{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <form className="vhub-launcher__reply-composer" onSubmit={(e) => handleReplySubmit(e, selectedThreadId)}>
                <textarea
                  id="vhub-reply-textarea"
                  placeholder={mode === "READ_ONLY" ? "Read-only mode" : "Write a reply..."}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  disabled={mode === "READ_ONLY" || createReplyMutation.isPending}
                />
                <button
                  type="submit"
                  className="vhub-launcher__reply-send"
                  disabled={mode === "READ_ONLY" || !replyBody.trim() || createReplyMutation.isPending}
                >
                  {createReplyMutation.isPending ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <SendHorizontal size={16} />
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
