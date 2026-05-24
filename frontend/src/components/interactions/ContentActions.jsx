import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Heart,
  MessageCircle,
  RotateCcw,
  Share2,
  ShieldAlert,
  MoreVertical,
  User,
  Flag,
  X
} from "lucide-react";
import { getLikeStatus, likeContent, unlikeContent } from "../../services/like.service";
import { getSaveStatus, saveContent, unsaveContent } from "../../services/save.service";
import { shareContent } from "../../services/share.service";
import { createReport } from "../../services/report.service";
import { routes } from "../../config/routes";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import CommentThread from "../comments/CommentThread";
import CommentModal from "../comments/CommentModal";

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
  { value: "COPYRIGHT", label: "Copyright" },
  { value: "MISLEADING", label: "Fake or Misleading" },
  { value: "OTHER", label: "Other" }
];

export default function ContentActions({
  contentType,
  contentId,
  counts = {},
  queryKeys = [],
  shareUrl,
  layout = "default",
  disabled = false,
  disabledReason = "This content is inactive right now.",
  authorUsername, // New prop
  title,
  author,
  mediaUrl
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const reportRef = useRef(null);
  const successRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [showInlineComments, setShowInlineComments] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [busyStates, setBusyStates] = useState({
    like: false,
    save: false,
    share: false,
    report: false
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportNote, setReportNote] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  const [isReported, setIsReported] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const { data: likeStatus } = useQuery({
    queryKey: ["like-status", contentType, contentId],
    queryFn: () => getLikeStatus(contentType, contentId),
    enabled: Boolean(contentType && contentId && !disabled)
  });

  const { data: saveStatus } = useQuery({
    queryKey: ["save-status", contentType, contentId],
    queryFn: () => getSaveStatus(contentType, contentId),
    enabled: Boolean(contentType && contentId && !disabled)
  });

  useEffect(() => {
    if (!reportOpen && !showSuccessPopup && !moreMenuOpen) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setReportOpen(false);
        setMoreMenuOpen(false);
        setShowSuccessPopup(false);
      }
    };

    const handleClickOutside = (event) => {
      if (reportOpen && reportRef.current && !reportRef.current.contains(event.target)) {
        setReportOpen(false);
      }
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
      if (showSuccessPopup && successRef.current && !successRef.current.contains(event.target)) {
        setShowSuccessPopup(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportOpen, showSuccessPopup, moreMenuOpen]);

  const handleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (busyStates.like) return;
    setBusyStates(prev => ({ ...prev, like: true }));
    
    const previousLikeStatus = likeStatus;
    const nextLiked = !likeStatus?.liked;

    try {
      // Optimistically update status instantly
      queryClient.setQueryData(["like-status", contentType, contentId], { liked: nextLiked });

      if (previousLikeStatus?.liked) {
        await unlikeContent(contentType, contentId);
      } else {
        await likeContent(contentType, contentId);
      }

      // Invalidate in background (do not await)
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({ queryKey: ["like-status", contentType, contentId] });
    } catch (error) {
      console.error("Like interaction error:", error);
      // Rollback to previous state on error
      queryClient.setQueryData(["like-status", contentType, contentId], previousLikeStatus);
    } finally {
      setBusyStates(prev => ({ ...prev, like: false }));
    }
  };

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (busyStates.save) return;
    setBusyStates(prev => ({ ...prev, save: true }));

    const previousSaveStatus = saveStatus;
    const nextSaved = !saveStatus?.saved;

    try {
      // Optimistically update status instantly
      queryClient.setQueryData(["save-status", contentType, contentId], { saved: nextSaved });

      if (previousSaveStatus?.saved) {
        await unsaveContent(contentType, contentId);
      } else {
        await saveContent(contentType, contentId);
      }

      // Invalidate in background (do not await)
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({ queryKey: ["save-status", contentType, contentId] });
    } catch (error) {
      console.error("Save interaction error:", error);
      // Rollback on error
      queryClient.setQueryData(["save-status", contentType, contentId], previousSaveStatus);
    } finally {
      setBusyStates(prev => ({ ...prev, save: false }));
      setMoreMenuOpen(false);
    }
  };
    
  const handleCommentClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    const detailUrl = routes[`${contentType.toLowerCase()}Detail`]?.replace(":id", contentId);
    if (!detailUrl) return;

    if (window.location.pathname === detailUrl) {
      document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowCommentModal(true);
    }
  };

  const handleShare = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (busyStates.share) return;
    setBusyStates(prev => ({ ...prev, share: true }));
    try {
      const destination =
        shareUrl || (typeof window !== "undefined" && window.location?.href
          ? window.location.href
          : "");

      let shareActionCompleted = false;
      let userAborted = false;
      
      // Attempt native Web Share API (supports sharing to WhatsApp, Slack, Messages, etc.)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          const shareTitle = title || `VCollab ${contentType}`;
          const shareText = `Check out this ${contentType.toLowerCase()} on VCollab: "${shareTitle}"`;
          
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: destination
          });
          shareActionCompleted = true;
        } catch (shareError) {
          if (shareError.name === "AbortError") {
            userAborted = true;
            console.log("User aborted native share.");
          } else {
            console.warn("Web Share API failed, falling back to clipboard:", shareError);
          }
        }
      }

      // Fallback: Copy link to clipboard (only if native share was not completed and user didn't abort)
      if (!shareActionCompleted && !userAborted && destination) {
        try {
          await navigator.clipboard?.writeText(destination);
          shareActionCompleted = true;
          toast.success("Link copied to clipboard!");
        } catch (clipboardError) {
          console.error("Clipboard copy failed:", clipboardError);
          toast.error("Failed to copy link.");
        }
      }

      // Only increase the share count in the database if shared successfully or copied
      if (shareActionCompleted) {
        await shareContent(contentType, contentId);

        // Invalidate in background (do not await)
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    } catch (error) {
      console.error("Share interaction error:", error);
    } finally {
      setBusyStates(prev => ({ ...prev, share: false }));
    }
  };

  const handleReport = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (busyStates.report) return;
    setBusyStates(prev => ({ ...prev, report: true }));
    setReportFeedback("");
    try {
      await createReport({
        contentType,
        contentId,
        reason: reportReason,
        description: reportNote.trim() || undefined
      });
      setReportNote("");
      setReportOpen(false);
      setIsReported(true);
      setShowSuccessPopup(true);
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to submit report.";
      setReportFeedback(message);
    } finally {
      setBusyStates(prev => ({ ...prev, report: false }));
    }
  };

  const profilePath = authorUsername ? routes.profile.replace(":username", authorUsername) : null;

  return (
    <div className="action-area">
      {/* 3-Dot More Menu Button (Absolute positioned like Instagram) */}
      <div className="feed-top-right-actions" ref={moreMenuRef}>
        <button
          className="top-action-btn"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          disabled={disabled}
          title="More options"
        >
          <MoreVertical size={22} strokeWidth={2.5} />
        </button>

        {moreMenuOpen && (
          <div className="user-nav-dropdown" style={{
            width: "220px",
            top: "40px",
            right: "0",
            animation: "slideInUp 0.15s ease-out"
          }}>
            <button
              className="dropdown-item dropdown-item--danger"
              onClick={() => { !isReported && setReportOpen(true); setMoreMenuOpen(false); }}
              disabled={isReported}
            >
              <Flag size={18} fill={isReported ? "currentColor" : "none"} />
              {isReported ? "Reported" : "Report"}
            </button>
            <button className={`dropdown-item ${saveStatus?.saved ? "active-save" : ""}`} onClick={handleSave} disabled={busyStates.save}>
              <Bookmark size={18} fill={saveStatus?.saved ? "currentColor" : "none"} />
              {saveStatus?.saved ? "Remove from favorite" : "Add to favorite"}
            </button>
            {profilePath && (
              <Link to={profilePath} className="dropdown-item" onClick={() => setMoreMenuOpen(false)}>
                <User size={18} />
                About this account
              </Link>
            )}
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={() => setMoreMenuOpen(false)} style={{ justifyContent: "center", color: "#64748b" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {layout === "facebook" ? (
        <>
          <div className="feed-reaction-summary-pro">
            <div className="reaction-counts-pro">
              <div className="reaction-icon-group-pro">
                <div className="reaction-icon-mini like">
                  <Heart size={10} fill="#fff" />
                </div>
                {counts.saveCount > 0 && (
                  <div className="reaction-icon-mini heart">
                    <Bookmark size={10} fill="#fff" />
                  </div>
                )}
              </div>
              <span>{counts.likeCount || 0} Likes</span>
            </div>
            <div className="reaction-counts-pro">
              <span>{counts.commentCount || 0} Comments</span>
              <span>|</span>
              <span>{counts.shareCount || 0} Shares</span>
            </div>
          </div>

          <div className="feed-actions-pro" style={{ padding: "4px 8px" }}>
            <button
              className={`feed-action-btn-pro ${likeStatus?.liked ? "active-like" : ""}`}
              onClick={handleLike}
              disabled={disabled || busyStates.like}
              title={disabled ? disabledReason : likeStatus?.liked ? "Unlike" : "Like"}
            >
              {busyStates.like ? (
                <RotateCcw size={18} className="spin" />
              ) : (
                <Heart size={20} fill={likeStatus?.liked ? "currentColor" : "none"} />
              )}
              <span>Like</span>
            </button>
            <button
              className="feed-action-btn-pro"
              onClick={handleCommentClick}
              disabled={disabled}
              title={disabled ? disabledReason : "Open comments on the detail page"}
            >
              <MessageCircle size={20} />
              <span>Comment</span>
            </button>
            <button
              className="feed-action-btn-pro"
              onClick={handleShare}
              disabled={disabled || busyStates.share}
              title={disabled ? disabledReason : "Share"}
            >
              {busyStates.share ? <RotateCcw size={18} className="spin" /> : <Share2 size={20} />}
              <span>Share</span>
            </button>

            <button
              className={`feed-action-btn-pro ${saveStatus?.saved ? "active-save" : ""}`}
              onClick={handleSave}
              disabled={disabled || busyStates.save}
              title={disabled ? disabledReason : saveStatus?.saved ? "Remove from saves" : "Save"}
              style={{ marginLeft: "auto", flex: "0 0 auto", width: "auto", padding: "6px 12px" }}
            >
              {busyStates.save ? (
                <RotateCcw size={18} className="spin" />
              ) : (
                <Bookmark size={20} fill={saveStatus?.saved ? "currentColor" : "none"} />
              )}
              <span>Save</span>
            </button>
          </div>
        </>
      ) : (
        <div className="action-bar-pro">
          <button
            className={`action-btn-pro ${likeStatus?.liked ? "active" : ""}`}
            type="button"
            onClick={handleLike}
            disabled={disabled || busyStates.like}
            title={disabled ? disabledReason : likeStatus?.liked ? "Unlike" : "Like"}
          >
            {busyStates.like ? <RotateCcw size={18} className="spin" /> : <Heart size={18} fill={likeStatus?.liked ? "currentColor" : "none"} />}
            <span>{counts.likeCount ?? 0}</span>
          </button>

          <button
            className="action-btn-pro"
            type="button"
            onClick={handleCommentClick}
            disabled={disabled}
            title={disabled ? disabledReason : "Open comments on the detail page"}
          >
            <MessageCircle size={18} />
            <span>{counts.commentCount ?? 0}</span>
          </button>

          <button
            className={`action-btn-pro ${saveStatus?.saved ? "active" : ""}`}
            type="button"
            onClick={handleSave}
            disabled={disabled || busyStates.save}
            title={disabled ? disabledReason : saveStatus?.saved ? "Remove from saves" : "Save"}
          >
            {busyStates.save ? <RotateCcw size={18} className="spin" /> : <Bookmark size={18} fill={saveStatus?.saved ? "currentColor" : "none"} />}
            <span>{counts.saveCount ?? 0}</span>
          </button>

          <button
            className="action-btn-pro"
            type="button"
            onClick={handleShare}
            disabled={disabled || busyStates.share}
            title={disabled ? disabledReason : "Share"}
          >
            {busyStates.share ? <RotateCcw size={18} className="spin" /> : <Share2 size={18} />}
            <span>{counts.shareCount ?? 0}</span>
          </button>
        </div>
      )}

      {showSuccessPopup && (
        <div className="report-overlay-pro">
          <div className="report-modal-pro" ref={successRef}>
            <div className="report-modal-body" style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ color: "#10b981", marginBottom: "16px" }}>
                <ShieldAlert size={48} />
              </div>
              <h3 style={{ marginBottom: "8px" }}>Report Submitted</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
                Thank you for helping keep VCollab safe. Our moderators will review this content shortly.
              </p>
              <button className="btn-primary" onClick={() => setShowSuccessPopup(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="report-overlay-pro">
          <div className="report-modal-pro" ref={reportRef}>
            <div className="report-modal-header">
              <h3>Report Content</h3>
              <button type="button" className="close-btn" onClick={() => setReportOpen(false)}>
                <RotateCcw size={18} />
              </button>
            </div>
            <div className="report-modal-body">
              <div className="report-field">
                <label>Reason for reporting</label>
                <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="report-field">
                <label>Additional Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={reportNote}
                  placeholder="Help our moderators understand the issue..."
                  onChange={(event) => setReportNote(event.target.value)}
                />
              </div>
              <button className="btn-primary" type="button" style={{ background: "#ef4444", borderColor: "#ef4444", width: "100%", justifyContent: "center" }} onClick={handleReport} disabled={busyStates.report}>
                {busyStates.report ? "Submitting..." : "Submit Report"}
              </button>
              <button className="btn-outline" type="button" style={{ marginTop: '8px', width: "100%", justifyContent: "center" }} onClick={() => setReportOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {reportFeedback && <div className="comment-feedback-toast">{reportFeedback}</div>}

      {showInlineComments && (
        <div className="inline-comments-section">
          <CommentThread
            contentType={contentType}
            contentId={contentId}
            readOnly={!isAuthenticated}
            variant="inline"
            loginPath={routes.login}
          />
        </div>
      )}

      {showCommentModal && (
        <CommentModal
          contentType={contentType}
          contentId={contentId}
          title={title}
          author={author}
          mediaUrl={mediaUrl}
          counts={counts}
          initialLikeStatus={likeStatus?.liked}
          onLikeToggle={handleLike}
          onShareChange={handleShare}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </div>
  );
}
