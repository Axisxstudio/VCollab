import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, listComments } from "../../services/comment.service";
import { useAuthStore } from "../../store/authStore";
import { formatTimeAgo } from "../../utils/date";

const CommentItem = ({ comment, onReply, onDelete, currentUserId, readOnly = false }) => {
  const canDelete = !readOnly && currentUserId && comment.author?.id === currentUserId;

  return (
    <div className="comment-item">
      <div className="comment-header">
        <strong>{comment.author?.fullName || comment.author?.username || "Anonymous"}</strong>
        <span className="comment-muted">
          {formatTimeAgo(comment.createdAt)}
        </span>
      </div>
      <p>{comment.content}</p>
      {!readOnly && (
        <div className="comment-actions">
          <button className="btn-outline" type="button" onClick={() => onReply(comment)}>
            Reply
          </button>
          {canDelete && (
            <button className="btn-outline" type="button" onClick={() => onDelete(comment)}>
              Delete
            </button>
          )}
        </div>
      )}
      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CommentThread({
  contentType,
  contentId,
  readOnly = false,
  loginPath,
  lockedMessage = "Sign in to join the discussion."
}) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["comments", contentType, contentId],
    queryFn: () => listComments({ contentType, contentId }),
    enabled: Boolean(contentType && contentId)
  });

  const handleSubmit = async () => {
    if (readOnly || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createComment({
        contentType,
        contentId,
        content: message.trim(),
        parentId: replyTo?.id || null
      });
      setMessage("");
      setReplyTo(null);
      await queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!comment?.id || readOnly) return;
    await deleteComment(comment.id);
    await queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
  };

  return (
    <div className="comment-thread">
      <h3>Comments</h3>
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
        <div className="comment-form">
          {replyTo && (
            <div className="comment-muted">
              Replying to {replyTo.author?.fullName || replyTo.author?.username || "comment"}
              <button className="btn-outline" type="button" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </div>
          )}
          <textarea
            rows="3"
            value={message}
            placeholder="Write a comment..."
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      )}
      {isLoading && <div className="comment-muted">Loading comments...</div>}
      {!isLoading && data.length === 0 && <div className="comment-muted">No comments yet.</div>}
      {!isLoading && data.length > 0 && (
        <div className="comment-list">
          {data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={setReplyTo}
              onDelete={handleDelete}
              currentUserId={currentUserId}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
