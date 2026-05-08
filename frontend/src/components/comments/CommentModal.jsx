import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { X, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import CommentThread from "./CommentThread";
import "../../styles/comment-modal.css";

/**
 * Facebook-inspired Content/Comment Modal
 * Displays the content media, current engagement, and a scrollable comment thread.
 */
export default function CommentModal({
  contentType,
  contentId,
  title,
  author,
  mediaUrl,
  counts,
  onClose,
  initialLikeStatus,
  onLikeToggle,
  onShareChange
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return createPortal(
    <div className="comment-modal-overlay" onClick={handleBackdropClick}>
      <div className="comment-modal-container" ref={modalRef}>
        {/* Header with Title and Close Button */}
        <div className="comment-modal-header">
          <h2>{title || (author ? `${author.fullName || author.username}'s post` : "Post Details")}</h2>
          <button className="comment-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="comment-modal-body">
          <div className="comment-modal-content-preview">
            {/* Media section (Image or video placeholder) */}
            {mediaUrl && (
              <div className="comment-modal-media-wrapper" style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="comment-modal-media"
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '450px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Engagement Stats Bar */}
            <div className="comment-modal-engagement">
              <div className="comment-modal-stats">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1877f2, #1f6fe5)', borderRadius: '50%', width: '22px', height: '22px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={12} fill="#fff" />
                  </div>
                  <strong>{counts?.likeCount || 0}</strong>
                </div>
                <div style={{ color: '#65676b', display: 'flex', gap: '10px' }}>
                  <span>{counts?.commentCount || 0} comments</span>
                  <span>{counts?.shareCount || 0} shares</span>
                </div>
              </div>
              <button className="comment-modal-close" style={{ background: 'transparent' }} title="More options">
                <MoreHorizontal size={20} color="#65676b" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="comment-modal-actions">
              <button
                className={`comment-modal-action-btn ${initialLikeStatus ? 'active' : ''}`}
                onClick={onLikeToggle}
              >
                <Heart size={20} fill={initialLikeStatus ? "currentColor" : "none"} strokeWidth={2.5} />
                <span>Like</span>
              </button>
              <button className="comment-modal-action-btn active" style={{ cursor: 'default' }}>
                <MessageCircle size={20} strokeWidth={2.5} />
                <span>Comment</span>
              </button>
              <button className="comment-modal-action-btn" onClick={onShareChange}>
                <Share2 size={20} strokeWidth={2.5} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Scrollable Comment Section */}
          <div className="comment-modal-thread-wrapper">
            <CommentThread
              contentType={contentType}
              contentId={contentId}
              variant="inline"
              lockedMessage="Sign in to post a comment."
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
