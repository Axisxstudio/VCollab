import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Edit2, ImagePlus, Loader2, MessageSquare, Reply, Send, Smile, Trash2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, listComments, updateComment } from "../../services/comment.service";
import { uploadMedia } from "../../services/media.service";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { formatTimeAgo } from "../../utils/date";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const getProfilePath = (username) => username ? `/profile/${username}` : "#";
const getInitial = (author) => (author?.fullName || author?.username || "V").charAt(0).toUpperCase();
const hasCommentContent = (content = "", imageUrl = null) => Boolean(content.trim() || imageUrl);
const COMMENT_EMOJI_OPTIONS = [
  { label: "Smile", value: "\u{1F60A}" },
  { label: "Laugh", value: "\u{1F602}" },
  { label: "Heart", value: "\u{2764}\u{FE0F}" },
  { label: "Thumbs up", value: "\u{1F44D}" },
  { label: "Fire", value: "\u{1F525}" },
  { label: "Party", value: "\u{1F389}" },
  { label: "Idea", value: "\u{1F4A1}" },
  { label: "Rocket", value: "\u{1F680}" }
];

const countComments = (items) => items.reduce(
  (total, item) => total + 1 + countComments(item.replies || []),
  0
);

function CommentComposer({
  currentUser,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  replyTo,
  variant = "main",
  autoFocus = false,
  image,
  uploadingImage,
  onSelectImage,
  onRemoveImage
}) {
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (autoFocus && textareaRef.current) textareaRef.current.focus();
  }, [autoFocus]);

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onSelectImage) return;
    try {
      await onSelectImage(file);
    } finally {
      event.target.value = "";
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${emoji}`);
      setEmojiPickerOpen(false);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    onChange(nextValue);
    setEmojiPickerOpen(false);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + emoji.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className={`comment-composer-card ${variant === "inline" ? "comment-composer-inline" : ""}`}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        hidden
      />

      <div className="comment-composer-card__topline">
        <div className="comment-composer-card__avatar">
          {currentUser?.profileImage ? (
            <img src={currentUser.profileImage} alt={currentUser.fullName || currentUser.username} />
          ) : (
            <span>{getInitial(currentUser)}</span>
          )}
        </div>
        <div>
          <strong>{currentUser?.fullName || currentUser?.username || "You"}</strong>
          {variant !== "inline" && <p>Share feedback, context, or the next step...</p>}
        </div>
      </div>

      {replyTo && variant === "main" && (
        <div className="comment-reply-banner">
          <span>Replying to <strong>{replyTo.author?.fullName || replyTo.author?.username || "comment"}</strong></span>
          <button className="btn-outline comment-inline-action" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}

      <div className="comment-composer-card__input-shell">
        <textarea
          ref={textareaRef}
          rows={variant === "inline" ? "2" : "3"}
          value={value}
          placeholder={replyTo ? "Write a reply..." : "Share feedback..."}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="comment-composer-card__input-actions">
          <button
            className="comment-inline-action icon-only"
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage || submitting}
            title="Attach image"
            aria-label="Attach image"
          >
            {uploadingImage ? <Loader2 className="spin" size={14} /> : <ImagePlus size={14} />}
          </button>
          <div className="comment-emoji-picker-wrap">
            <button
              className={`comment-inline-action icon-only ${emojiPickerOpen ? "is-active" : ""}`}
              type="button"
              onClick={() => setEmojiPickerOpen((current) => !current)}
              disabled={submitting}
              title="Insert emoji"
              aria-label="Insert emoji"
            >
              <Smile size={14} />
            </button>
            {emojiPickerOpen && (
              <div className="comment-emoji-picker">
                {COMMENT_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji.label}
                    type="button"
                    className="comment-emoji-picker__option"
                    title={emoji.label}
                    onClick={() => insertEmoji(emoji.value)}
                  >
                    {emoji.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(image || uploadingImage) && (
        <div className="comment-attachment-preview">
          {image ? (
            <>
              <img src={image.url} alt={image.fileName || "Comment attachment"} />
              <div className="comment-attachment-preview__meta">
                <strong>{image.fileName || "Attached image"}</strong>
                <button
                  className="comment-inline-action icon-only"
                  type="button"
                  onClick={onRemoveImage}
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="comment-attachment-preview__loading">
              <Loader2 className="spin" size={16} />
              <span>Uploading image...</span>
            </div>
          )}
        </div>
      )}

      <div className="comment-composer-card__footer">
        <span>{value.trim().length} ch</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {variant === "inline" && (
            <button className="btn-outline" type="button" onClick={onCancel} style={{ padding: "6px" }}>
              <X size={14} />
            </button>
          )}
          <button
            className="btn-primary"
            type="button"
            onClick={onSubmit}
            disabled={submitting || uploadingImage || !hasCommentContent(value, image?.url)}
            style={{ padding: "8px 12px" }}
          >
            {submitting ? <div className="spinner-mini" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  readOnly,
  onReply,
  onDelete,
  activeReplyId,
  onCancelReply,
  currentUser,
  onSubmitReply,
  onSubmitEdit,
  depth = 0
}) {
  const [replyMessage, setReplyMessage] = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyImageUploading, setReplyImageUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const canEdit = !readOnly && currentUserId && comment.author?.id === currentUserId;
  const canDelete = !readOnly && currentUserId && comment.author?.id === currentUserId;
  const profilePath = getProfilePath(comment.author?.username);
  const isReplying = activeReplyId === comment.id;
  const isEditing = editingId === comment.id;

  const handleReplySubmit = async () => {
    setReplySubmitting(true);
    try {
      await onSubmitReply(replyMessage, comment.id, replyImage?.url || null);
      setReplyMessage("");
      setReplyImage(null);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleEditClick = () => {
    setEditingId(comment.id);
    setEditingContent(comment.content || "");
  };

  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      await onSubmitEdit(editingContent, comment.id);
      setEditingId(null);
      setEditingContent("");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleReplyImageUpload = async (file) => {
    setReplyImageUploading(true);
    try {
      const uploaded = await uploadMedia(file, "comment");
      setReplyImage({
        url: uploaded.url,
        fileName: uploaded.fileName || file.name
      });
    } catch (error) {
      toast.error("Failed to upload comment image");
    } finally {
      setReplyImageUploading(false);
    }
  };

  const handleReplyCancel = () => {
    setReplyMessage("");
    setReplyImage(null);
    onCancelReply();
  };

  return (
    <div className="comment-node-branch">
      <article className={`comment-node ${isReplying ? "is-replying" : ""}`}>
        <Link to={profilePath} className="comment-node__avatar">
          {comment.author?.profileImage ? (
            <img src={comment.author.profileImage} alt={comment.author.fullName || comment.author.username} />
          ) : (
            <span>{getInitial(comment.author)}</span>
          )}
        </Link>

        <div className="comment-node__body">
          <div className="comment-node__content">
            <div className="comment-node__meta">
              <Link to={profilePath} className="comment-node__author">
                {comment.author?.fullName || comment.author?.username || "Anonymous"}
              </Link>
              <span>{formatTimeAgo(comment.createdAt)}</span>
            </div>
            {isEditing ? (
              <div className="inline-edit-composer">
                <textarea
                  className="comment-inline-edit-textarea"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  autoFocus
                />
                {comment.imageUrl && (
                  <div className="comment-attachment-preview comment-attachment-preview--readonly">
                    <img src={comment.imageUrl} alt="Comment attachment" />
                    <div className="comment-attachment-preview__meta">
                      <strong>Attached image</strong>
                    </div>
                  </div>
                )}
                <div className="comment-node__actions edit-mode">
                  <button onClick={() => setEditingId(null)} className="comment-icon-action" title="Cancel"><X size={14} /></button>
                  <button
                    onClick={handleEditSubmit}
                    className="comment-icon-action success"
                    title="Save"
                    disabled={editSubmitting || !hasCommentContent(editingContent, comment.imageUrl)}
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="comment-node__message">
                {comment.content?.trim() ? <p>{comment.content}</p> : null}
                {comment.imageUrl ? (
                  <a href={comment.imageUrl} target="_blank" rel="noreferrer" className="comment-node__image-link">
                    <img
                      src={comment.imageUrl}
                      alt="Comment attachment"
                      className="comment-node__image"
                      loading="lazy"
                    />
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {!readOnly && !isEditing && (
            <div className="comment-node__actions">
              <button
                className="comment-icon-action"
                type="button"
                onClick={() => onReply(comment)}
                title="Reply"
              >
                <Reply size={14} />
              </button>
              {canEdit && (
                <button
                  className="comment-icon-action"
                  type="button"
                  onClick={handleEditClick}
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  className="comment-icon-action delete"
                  type="button"
                  onClick={() => onDelete(comment)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="inline-reply-composer" style={{ marginLeft: "24px", marginTop: "10px" }}>
              <CommentComposer
                currentUser={currentUser}
                value={replyMessage}
                onChange={setReplyMessage}
                onSubmit={handleReplySubmit}
                onCancel={handleReplyCancel}
                submitting={replySubmitting}
                variant="inline"
                autoFocus
                image={replyImage}
                uploadingImage={replyImageUploading}
                onSelectImage={handleReplyImageUpload}
                onRemoveImage={() => setReplyImage(null)}
              />
            </div>
          )}
        </div>
      </article>

      {comment.replies?.length > 0 && (
        <div className="comment-node__replies" style={{ "--comment-depth": depth + 1 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              currentUser={currentUser}
              readOnly={readOnly}
              onReply={onReply}
              onDelete={onDelete}
              activeReplyId={activeReplyId}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onSubmitEdit={onSubmitEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({
  contentType,
  contentId,
  readOnly = false,
  variant = "default",
  loginPath,
  lockedMessage = "Sign in to join the discussion."
}) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const commentsQueryKey = ["comments", contentType, contentId];

  const { data = [], isLoading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: () => listComments({ contentType, contentId }),
    enabled: Boolean(contentType && contentId)
  });

  useFeedUpdates({
    contentType,
    contentId,
    queryKeys: [commentsQueryKey],
    enabled: Boolean(contentType && contentId)
  });

  const commentsList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.content)) return data.content;
    return [];
  }, [data]);

  const totalComments = useMemo(() => {
    if (data && typeof data.totalElements === "number") return data.totalElements;
    return countComments(commentsList);
  }, [data, commentsList]);

  const handleImageUpload = async (file) => {
    setImageUploading(true);
    try {
      const uploaded = await uploadMedia(file, "comment");
      setAttachment({
        url: uploaded.url,
        fileName: uploaded.fileName || file.name
      });
    } catch (error) {
      toast.error("Failed to upload comment image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (customMessage = null, parentId = null, imageUrl = null) => {
    const usesMainComposerState = customMessage === null && parentId === null && imageUrl === null;
    const finalMessage = usesMainComposerState ? message : (customMessage ?? "");
    const finalImageUrl = usesMainComposerState ? (attachment?.url || null) : imageUrl;

    if (readOnly || submitting || !hasCommentContent(finalMessage, finalImageUrl)) return;
    if (usesMainComposerState) setSubmitting(true);

    try {
      await createComment({
        contentType,
        contentId,
        content: finalMessage.trim(),
        imageUrl: finalImageUrl,
        parentId: parentId || null
      });
      if (usesMainComposerState) {
        setMessage("");
        setAttachment(null);
      }
      setActiveReplyId(null);
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    } finally {
      if (usesMainComposerState) setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!comment?.id || readOnly) return;
    try {
      await deleteComment(comment.id);
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleUpdate = async (content, id) => {
    if (!id || readOnly) return;
    try {
      await updateComment(id, { content: content.trim() });
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast.success("Comment updated successfully");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  return (
    <section
      id={variant === "default" ? "comments" : undefined}
      className={`comment-thread-upgrade ${variant === "inline" ? "comment-thread-inline" : ""}`}
    >
      {variant === "default" && (
        <div className="comment-thread-upgrade__header">
          <div>
            <span className="collab-page__eyebrow">Discussion</span>
            <h3>Comments</h3>
            <p>Replies stay structured and refresh live while the conversation evolves.</p>
          </div>
          <span className="collab-pill">
            <MessageSquare size={14} />
            {totalComments}
          </span>
        </div>
      )}

      {readOnly ? (
        <div className="comment-readonly-card">
          <p>{lockedMessage}</p>
          {loginPath && (
            <div className="comment-readonly-card__actions">
              <Link to={loginPath} className="btn-primary">
                Sign In
              </Link>
            </div>
          )}
        </div>
      ) : (
        <CommentComposer
          currentUser={currentUser}
          value={message}
          onChange={setMessage}
          onSubmit={() => handleSubmit()}
          submitting={submitting}
          image={attachment}
          uploadingImage={imageUploading}
          onSelectImage={handleImageUpload}
          onRemoveImage={() => setAttachment(null)}
        />
      )}

      {isLoading && <div className="collab-empty-panel slim">Loading comments...</div>}

      {!isLoading && commentsList.length === 0 && (
        <div className="collab-empty-panel slim">
          <h3>No comments yet</h3>
          <p>Start the discussion and make the first contribution.</p>
        </div>
      )}

      {!isLoading && commentsList.length > 0 && (
        <div className="comment-thread-upgrade__list">
          {commentsList.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUser={currentUser}
              readOnly={readOnly}
              onReply={(item) => setActiveReplyId(item.id)}
              onDelete={handleDelete}
              onSubmitEdit={handleUpdate}
              activeReplyId={activeReplyId}
              onCancelReply={() => setActiveReplyId(null)}
              onSubmitReply={handleSubmit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
