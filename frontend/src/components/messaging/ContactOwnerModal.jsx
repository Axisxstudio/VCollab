import { useEffect, useState } from "react";
import { Mail, Send, X, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createConversation } from "../../services/conversation.service";
import { sendMessage } from "../../services/message.service";
import { toast } from "react-hot-toast";
import { routes } from "../../config/routes";

export default function ContactOwnerModal({ isOpen, onClose, owner, context }) {
  const [message, setMessage] = useState(context ? `Regarding your ${context}: ` : "");
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setMessage(context ? `Regarding your ${context}: ` : "");
    }
  }, [isOpen, context, owner?.id]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      if (!owner?.id) {
        toast.error("User information not found.");
        return;
      }
      // 1. Create or Find conversation
      const conversation = await createConversation(owner.id);
      
      // 2. Send initial message
      await sendMessage({
        conversationId: conversation.id,
        content: message.trim()
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", String(conversation.id)] })
      ]);
      
      toast.success("Message sent successfully!");
      onClose();
      navigate(`${routes.messages}?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = error?.response?.data?.message || "Could not send message. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="stellar-modal-overlay">
      <div className="stellar-modal-content contact-popup-card">
        <header className="stellar-modal-header">
          <div className="header-identity">
            <Mail size={18} className="icon-accent" />
            <div>
              <h3>Message Owner</h3>
              <p>Direct inquiry about this content</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="stellar-modal-body">
          {owner && (
            <div className="recipient-preview">
              {owner?.profileImage ? (
                <img src={owner.profileImage} alt={owner.fullName || owner.username} className="recipient-avatar" />
              ) : (
                <div className="recipient-avatar-placeholder">
                  <User size={20} />
                </div>
              )}
              <div className="recipient-details">
                <strong>{owner?.fullName || owner?.username}</strong>
                <span>Owner of {context}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Your Message</label>
            <textarea
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to ask?"
              className="stellar-input-field"
              autoFocus
            />
            <span className="helper-text">This will open the saved conversation in your Messages page.</span>
          </div>
        </div>

        <footer className="stellar-modal-footer">
          <button className="btn-secondary-flat" onClick={onClose} disabled={isSending}>
            Cancel
          </button>
          <button className="btn-primary-v2" onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? "Sending..." : (
              <>
                <Send size={16} /> Send Message
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
