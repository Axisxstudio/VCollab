import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { routes } from "../../config/routes";
import {
  createConversation,
  listConversations,
  markConversationRead
} from "../../services/conversation.service";
import {
  deleteMessage,
  listMessages,
  sendMessage,
  updateMessage
} from "../../services/message.service";
import {
  Check,
  Edit2,
  ImagePlus,
  Loader2,
  MessageSquare,
  Search,
  SendHorizontal,
  Smile,
  Trash2,
  Users,
  X
} from "lucide-react";
import { uploadMedia } from "../../services/media.service";
import { useAuthStore } from "../../store/authStore";
import { formatTimeAgo } from "../../utils/date";
import { publishTyping } from "../../websocket/stompClient";
import useConversationTyping from "../../websocket/useConversationTyping";
import useMessageUpdates from "../../websocket/useMessageUpdates";
import usePresenceUpdates from "../../websocket/usePresenceUpdates";

const EMOJI_OPTIONS = [
  { label: "Smile", value: "\u{1F60A}" },
  { label: "Laugh", value: "\u{1F602}" },
  { label: "Heart", value: "\u{2764}\u{FE0F}" },
  { label: "Thumbs up", value: "\u{1F44D}" },
  { label: "Fire", value: "\u{1F525}" },
  { label: "Party", value: "\u{1F389}" },
  { label: "Idea", value: "\u{1F4A1}" },
  { label: "Rocket", value: "\u{1F680}" }
];

const getParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((participant) => participant.id !== currentUserId)
  || conversation?.participants?.[0];

const getInitial = (participant) =>
  (participant?.fullName || participant?.username || "V").charAt(0).toUpperCase();

const formatMessageTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

const buildContextDraft = (context) => (context ? `Regarding your ${context}: ` : "");

const getPresenceLabel = (participant) => {
  if (!participant) return "Offline";
  if (participant.online) return "Active now";
  if (participant.lastSeenAt) return `Last seen ${formatTimeAgo(participant.lastSeenAt)}`;
  return "Offline";
};

const getMessageStateLabel = (message) => {
  if (message?.readAt) return "Read";
  if (message?.deliveredAt) return "Delivered";
  return "Sent";
};

const isImageMessage = (message) =>
  message?.messageType === "IMAGE" || Boolean(message?.attachmentUrl);

const hasMessagePayload = (content = "", attachmentUrl = null) =>
  Boolean(content.trim() || attachmentUrl);

const buildMessagePreviewText = (message) => {
  if (!message) return "No messages yet.";
  const content = message.content?.trim();
  if (isImageMessage(message)) {
    return content ? `Photo: ${content}` : "Photo";
  }
  return content || "No messages yet.";
};

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const threadRef = useRef(null);
  const composerRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const typingStateRef = useRef(false);
  const queryClient = useQueryClient();

  const {
    data: conversationPage,
    isLoading: conversationsLoading
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations({ page: 0, size: 50, sort: "updatedAt,desc" })
  });

  const conversations = conversationPage?.content || [];

  const navigateToConversation = (conversationId) => {
    if (!conversationId) return;
    navigate(`${routes.messages}?conversation=${conversationId}`, { replace: true });
  };

  useEffect(() => {
    if (conversationsLoading) return undefined;

    let cancelled = false;
    const contextDraft = buildContextDraft(searchParams.get("context"));

    const primeDraft = () => {
      if (!contextDraft) return;
      setDraft((currentDraft) => (currentDraft.trim() ? currentDraft : contextDraft));
    };

    const resolveActiveConversation = async () => {
      const conversationParam = searchParams.get("conversation");
      const userIdParam = searchParams.get("userId");
      const usernameParam = searchParams.get("username");

      if (conversationParam) {
        const parsed = Number(conversationParam);
        if (!Number.isNaN(parsed)) {
          setActiveId(parsed);
          primeDraft();
          return;
        }
      }

      if (userIdParam) {
        const targetUserId = Number(userIdParam);
        if (Number.isNaN(targetUserId)) {
          return;
        }

        const existing = conversations.find((conversation) =>
          conversation.participants.some((participant) => participant.id === targetUserId)
        );

        if (existing) {
          if (!cancelled) {
            setActiveId(existing.id);
            primeDraft();
            navigateToConversation(existing.id);
          }
          return;
        }

        try {
          const createdConversation = await createConversation(targetUserId);
          if (!cancelled && createdConversation?.id) {
            await queryClient.invalidateQueries({ queryKey: ["conversations"] });
            setActiveId(createdConversation.id);
            primeDraft();
            navigateToConversation(createdConversation.id);
          }
        } catch (error) {
          if (!cancelled) {
            const message = error?.response?.data?.message || "Unable to open this conversation right now.";
            toast.error(message);
          }
        }
        return;
      }

      if (usernameParam) {
        const existing = conversations.find((conversation) =>
          conversation.participants.some((participant) => participant.username === usernameParam)
        );
        if (existing) {
          setActiveId(existing.id);
          primeDraft();
          navigateToConversation(existing.id);
          return;
        }
      }

      if (!activeId && conversations.length > 0) {
        setActiveId(conversations[0].id);
      }
    };

    resolveActiveConversation();

    return () => {
      cancelled = true;
    };
  }, [searchParams, conversations, conversationsLoading, queryClient, activeId, navigate]);

  useEffect(() => {
    if (!activeId) return;

    markConversationRead(activeId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .catch(() => {});
  }, [activeId, queryClient]);

  useEffect(() => {
    setAttachment(null);
    setEmojiPickerOpen(false);
    setEditingId(null);
    setEditingContent("");
  }, [activeId]);

  const {
    data: messagePage,
    isLoading: messagesLoading
  } = useQuery({
    queryKey: ["messages", String(activeId)],
    queryFn: () => listMessages(activeId, { page: 0, size: 50, sort: "createdAt,desc" }),
    enabled: Boolean(activeId)
  });

  useMessageUpdates(activeId);
  usePresenceUpdates(Boolean(conversations.length));
  const typingUsers = useConversationTyping(activeId, currentUser?.id);

  const messages = useMemo(() => {
    const list = messagePage?.content || [];
    return [...list].reverse();
  }, [messagePage]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  useEffect(() => {
    if (!activeId) return undefined;

    if (!draft.trim()) {
      if (typingStateRef.current) {
        publishTyping(activeId, false);
        typingStateRef.current = false;
      }
      return undefined;
    }

    if (!typingStateRef.current) {
      publishTyping(activeId, true);
      typingStateRef.current = true;
    }

    const timer = window.setTimeout(() => {
      publishTyping(activeId, false);
      typingStateRef.current = false;
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [activeId, draft]);

  useEffect(() => () => {
    if (activeId && typingStateRef.current) {
      publishTyping(activeId, false);
    }
  }, [activeId]);

  const filteredConversations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const participant = getParticipant(conversation, currentUser?.id);
      const haystack = [
        participant?.fullName,
        participant?.username,
        buildMessagePreviewText(conversation.lastMessage)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, currentUser?.id, searchValue]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);
  const activeParticipant = getParticipant(activeConversation, currentUser?.id);
  const activeProfilePath = activeParticipant?.username
    ? routes.profile.replace(":username", activeParticipant.username)
    : routes.messages;
  const typingNames = typingUsers.map((entry) => entry.username).filter(Boolean);

  const handleImageUpload = async (file) => {
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadMedia(file, "message");
      setAttachment({
        url: uploaded.url,
        fileName: uploaded.fileName || file.name
      });
    } catch (error) {
      toast.error("Unable to upload this image right now.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAttachmentInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleImageUpload(file);
    } finally {
      event.target.value = "";
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = composerRef.current;
    if (!textarea) {
      setDraft((current) => `${current}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? draft.length;
    const nextDraft = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
    setDraft(nextDraft);
    setEmojiPickerOpen(false);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + emoji.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSend = async () => {
    const content = draft.trim();
    const attachmentUrl = attachment?.url || null;
    if (!activeId || isSending || isUploadingImage || !hasMessagePayload(content, attachmentUrl)) return;

    setIsSending(true);
    try {
      publishTyping(activeId, false);
      typingStateRef.current = false;
      await sendMessage({
        conversationId: activeId,
        content,
        attachmentUrl
      });
      setDraft("");
      setAttachment(null);
      setEmojiPickerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["messages", String(activeId)] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to send your message right now.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      await queryClient.invalidateQueries({ queryKey: ["messages", String(activeId)] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to delete this message right now.";
      toast.error(message);
    }
  };

  const handleEditClick = (message) => {
    setEditingId(message.id);
    setEditingContent(message.content || "");
  };

  const handleUpdateMessage = async (message) => {
    if (!editingId || !hasMessagePayload(editingContent, message?.attachmentUrl)) return;
    try {
      await updateMessage(editingId, { content: editingContent.trim() });
      await queryClient.invalidateQueries({ queryKey: ["messages", String(activeId)] });
      setEditingId(null);
      setEditingContent("");
    } catch (error) {
      const responseMessage = error?.response?.data?.message || "Unable to update this message right now.";
      toast.error(responseMessage);
    }
  };

  return (
    <div className="collab-page">
      <div className="messenger-shell">
        <aside className="messenger-sidebar">
          <div className="messenger-sidebar__top">
            <label className="messenger-search">
              <Search size={16} />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search messages..."
              />
            </label>
          </div>

          <div className="messenger-sidebar__header">
            <div>
              <h3>Inbox</h3>
              <p>Direct messages</p>
            </div>
            <span className="collab-pill">{filteredConversations.length}</span>
          </div>

          <div className="messenger-sidebar__list">
            {conversationsLoading && <div className="collab-empty-panel slim">Loading conversations...</div>}

            {!conversationsLoading && conversations.length === 0 && (
              <div className="collab-empty-panel slim">
                <h3>No conversations yet</h3>
                <p>Follow people from their profiles to unlock a new message thread.</p>
              </div>
            )}

            {!conversationsLoading && conversations.length > 0 && filteredConversations.length === 0 && (
              <div className="collab-empty-panel slim">
                <h3>No matches found</h3>
                <p>Try a name, username, or a message preview.</p>
              </div>
            )}

            {filteredConversations.map((conversation) => {
              const participant = getParticipant(conversation, currentUser?.id);

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`messenger-conversation-card ${activeId === conversation.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveId(conversation.id);
                    navigateToConversation(conversation.id);
                  }}
                >
                  <div className="messenger-conversation-card__avatar">
                    {participant?.profileImage ? (
                      <img src={participant.profileImage} alt={participant.fullName || participant.username} />
                    ) : (
                      <span>{getInitial(participant)}</span>
                    )}
                  </div>
                  <div className="messenger-conversation-card__body">
                    <div className="messenger-conversation-card__topline">
                      <strong>{participant?.fullName || participant?.username || "Unknown user"}</strong>
                      <span>{formatTimeAgo(conversation.lastMessage?.createdAt)}</span>
                    </div>
                    <p>{buildMessagePreviewText(conversation.lastMessage)}</p>
                    <div className="messenger-conversation-card__meta">
                      <span className={`presence-chip ${participant?.online ? "is-online" : ""}`}>
                        <span className="presence-chip__dot" />
                        {getPresenceLabel(participant)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="collab-pill is-alert">{conversation.unreadCount} unread</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="messenger-thread">
          {activeConversation ? (
            <>
              <header className="messenger-thread__header">
                <div className="messenger-thread__identity">
                  <div className="messenger-thread__avatar">
                    {activeParticipant?.profileImage ? (
                      <img src={activeParticipant.profileImage} alt={activeParticipant.fullName || activeParticipant.username} />
                    ) : (
                      <span>{getInitial(activeParticipant)}</span>
                    )}
                  </div>
                  <div>
                    <Link to={activeProfilePath} className="messenger-thread__name">
                      {activeParticipant?.fullName || activeParticipant?.username || "Conversation"}
                    </Link>
                    <p>{getPresenceLabel(activeParticipant)} - Live sync enabled across your signed-in sessions.</p>
                  </div>
                </div>
                <div className="messenger-thread__summary">
                  <strong>{messages.length}</strong>
                  <span>Messages</span>
                </div>
              </header>

              {typingNames.length > 0 && (
                <div className="messenger-typing-indicator">
                  <span className="messenger-typing-indicator__dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>
                    {typingNames.join(", ")} {typingNames.length > 1 ? "are" : "is"} typing...
                  </span>
                </div>
              )}

              <div className="messenger-thread__messages" ref={threadRef}>
                {messagesLoading && <div className="collab-empty-panel slim">Loading messages...</div>}

                {!messagesLoading && messages.length === 0 && (
                  <div className="collab-empty-panel slim">
                    <h3>Start the conversation</h3>
                    <p>Send the first message to break the ice.</p>
                  </div>
                )}

                {!messagesLoading && messages.map((message) => {
                  const isSelf = message.sender?.id === currentUser?.id;
                  const imageMessage = isImageMessage(message);
                  return (
                    <article
                      key={message.id}
                      className={`messenger-bubble ${isSelf ? "is-self" : ""}`}
                    >
                      {!isSelf && (
                        <div className="messenger-bubble__avatar">
                          {message.sender?.profileImage ? (
                            <img src={message.sender.profileImage} alt={message.sender.fullName || message.sender.username} />
                          ) : (
                            <span>{getInitial(message.sender)}</span>
                          )}
                        </div>
                      )}

                      <div className="messenger-bubble__group">
                        <div className="messenger-bubble__meta">
                          <span>{formatMessageTime(message.createdAt)}</span>
                        </div>

                        <div className="messenger-bubble__row">
                          {isSelf && !editingId && (
                            <div className="messenger-bubble__actions">
                              <button
                                className="btn-bubble-action"
                                onClick={() => handleEditClick(message)}
                                title="Edit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="btn-bubble-action delete"
                                onClick={() => handleDeleteMessage(message.id)}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          <div className="messenger-bubble__content">
                            {editingId === message.id ? (
                              <div className="messenger-bubble__edit-mode">
                                <textarea
                                  className="messenger-bubble__edit-input"
                                  value={editingContent}
                                  onChange={(event) => setEditingContent(event.target.value)}
                                  autoFocus
                                />
                                {imageMessage && message.attachmentUrl ? (
                                  <div className="messenger-attachment-preview messenger-attachment-preview--inline">
                                    <img src={message.attachmentUrl} alt="Message attachment" />
                                    <div className="messenger-attachment-preview__meta">
                                      <strong>Attached image stays with this message</strong>
                                    </div>
                                  </div>
                                ) : null}
                                <div className="messenger-bubble__edit-actions">
                                  <button onClick={() => setEditingId(null)} className="btn-icon-sm"><X size={14} /></button>
                                  <button
                                    onClick={() => handleUpdateMessage(message)}
                                    className="btn-icon-sm success"
                                    disabled={!hasMessagePayload(editingContent, message.attachmentUrl)}
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="messenger-bubble__message">
                                {message.content?.trim() ? <p>{message.content}</p> : null}
                                {imageMessage && message.attachmentUrl ? (
                                  <a
                                    href={message.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="messenger-bubble__image-link"
                                  >
                                    <img
                                      src={message.attachmentUrl}
                                      alt="Shared message attachment"
                                      className="messenger-bubble__image"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {!isSelf && !editingId && (
                            <div className="messenger-bubble__actions">
                              {/* Future friend actions if needed */}
                            </div>
                          )}
                        </div>

                        {isSelf && !editingId && (
                          <div className="messenger-bubble__status">
                            {getMessageStateLabel(message)}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="messenger-composer">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAttachmentInputChange}
                  hidden
                />

                {(attachment || isUploadingImage) && (
                  <div className="messenger-attachment-preview">
                    {attachment ? (
                      <>
                        <img src={attachment.url} alt={attachment.fileName || "Message attachment"} />
                        <div className="messenger-attachment-preview__meta">
                          <strong>{attachment.fileName || "Attached image"}</strong>
                          <button
                            type="button"
                            className="messenger-composer__tool-btn icon-only danger"
                            onClick={() => setAttachment(null)}
                            title="Remove image"
                            aria-label="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="messenger-attachment-preview__loading">
                        <Loader2 className="spin" size={16} />
                        <span>Uploading image...</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="messenger-composer__input-shell">
                  <textarea
                    ref={composerRef}
                    rows="1"
                    value={draft}
                    placeholder="Write a message and press Enter to send"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    onBlur={() => {
                      if (activeId && typingStateRef.current) {
                        publishTyping(activeId, false);
                        typingStateRef.current = false;
                      }
                    }}
                  />
                  <div className="messenger-composer__input-actions">
                    <button
                      type="button"
                      className="messenger-composer__tool-btn icon-only"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={isSending || isUploadingImage}
                      title="Attach image"
                      aria-label="Attach image"
                    >
                      {isUploadingImage ? <Loader2 className="spin" size={14} /> : <ImagePlus size={14} />}
                    </button>
                    <div className="messenger-emoji-picker-wrap">
                      <button
                        type="button"
                        className={`messenger-composer__tool-btn icon-only ${emojiPickerOpen ? "active" : ""}`}
                        onClick={() => setEmojiPickerOpen((current) => !current)}
                        disabled={isSending}
                        title="Insert emoji"
                        aria-label="Insert emoji"
                      >
                        <Smile size={14} />
                      </button>
                      {emojiPickerOpen && (
                        <div className="messenger-emoji-picker">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji.label}
                              type="button"
                              className="messenger-emoji-picker__option"
                              onClick={() => insertEmoji(emoji.value)}
                              title={emoji.label}
                            >
                              {emoji.value}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="messenger-composer__send-btn"
                    type="button"
                    onClick={handleSend}
                    disabled={!activeId || !hasMessagePayload(draft, attachment?.url) || isSending || isUploadingImage}
                    title="Send message"
                    aria-label="Send message"
                  >
                    {isSending ? <Loader2 className="spin" size={16} /> : <SendHorizontal size={16} />}
                  </button>
                </div>
                <div className="messenger-composer__footer">
                  <span>Shift + Enter for a new line</span>
                </div>
              </div>
            </>
          ) : (
            <div className="collab-empty-panel spacious">
              <h3>Select a conversation</h3>
              <p>Your active thread will appear here with realtime updates, unread sync, and quick replies.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
