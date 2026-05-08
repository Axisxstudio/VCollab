import { Copy, X, Check } from "lucide-react";
import { useState } from "react";

export default function ShareModal({ isOpen, onClose, url, title }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="stellar-modal-overlay">
      <div className="stellar-modal-content">
        <header className="stellar-modal-header">
          <div className="header-identity">
            <h3>Share this {title || "content"}</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="stellar-modal-body">
          <p className="description">Copy the link below to share with your network.</p>
          <div className="share-link-box">
            <input type="text" readOnly value={url} className="stellar-input-field" />
            <button className="btn-primary-v2" onClick={handleCopy}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
