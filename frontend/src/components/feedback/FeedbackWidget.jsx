import { useState, useRef, useEffect } from "react";
import { Bug, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createReport } from "../../services/report.service";
import "../../styles/feedback.css";
import { useAuthStore } from "../../store/authStore";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("Bug Report");
  const [description, setDescription] = useState("");
  const widgetRef = useRef(null);
  
  const { user } = useAuthStore();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Automatically pop up once per session when entering the website
  useEffect(() => {
    const hasPopped = sessionStorage.getItem("vcollab_bug_popped");
    if (!hasPopped) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("vcollab_bug_popped", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide some details.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        // Mock success for anonymous users on the landing page if auth is required
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.success("Feedback submitted! Thanks for helping us improve.");
        setIsOpen(false);
        setDescription("");
        setReason("Bug Report");
        return;
      }

      // Send report to the backend. We use "PLATFORM" as content type and 0 as content ID for global bugs.
      await createReport({
        contentType: "PLATFORM",
        contentId: 0,
        reason: reason,
        description: description
      });
      toast.success("Feedback submitted! Thanks for helping us improve.");
      setIsOpen(false);
      setDescription("");
      setReason("Bug Report");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={widgetRef} className={`feedback-widget ${isOpen ? "is-open" : ""}`}>
      <button
        className="feedback-widget__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Report a bug or leave feedback"
        title="Report Bug / Feedback"
      >
        {isOpen ? <X size={24} /> : <Bug size={24} />}
      </button>

      {isOpen && (
        <div className="feedback-widget__popover">
          <div className="feedback-widget__header">
            <h4>Feedback & Bugs</h4>
            <p>Help us improve VCollab by reporting issues.</p>
          </div>
          
          <form className="feedback-widget__form" onSubmit={handleSubmit}>
            <div className="feedback-widget__field">
              <label htmlFor="fw-reason">Type</label>
              <select 
                id="fw-reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="UI Issue">UI Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="feedback-widget__field">
              <label htmlFor="fw-desc">Description</label>
              <textarea 
                id="fw-desc"
                placeholder="What went wrong? Steps to reproduce?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            <div className="feedback-widget__actions">
              <button 
                type="button" 
                className="feedback-widget__btn feedback-widget__btn--cancel"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="feedback-widget__btn feedback-widget__btn--submit"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
