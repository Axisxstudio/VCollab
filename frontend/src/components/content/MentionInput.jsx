import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, User, Tag, Loader2 } from "lucide-react";
import { fetchTagSuggestions } from "../../services/profile.service";
import "./MentionInput.css";

/**
 * MentionInput — Smart @mention textarea
 *
 * Props:
 *   value: string - current content value
 *   onChange: (value: string) => void
 *   placeholder: string
 *   minHeight: string (CSS value, default "120px")
 *   className: string
 */
export default function MentionInput({
  value = "",
  onChange,
  placeholder = "Write something... Use @ to mention users or tag an audience",
  minHeight = "120px",
  className = ""
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Detect @mention trigger
  const handleChange = (e) => {
    const text = e.target.value;
    onChange?.(text);

    const cursor = e.target.selectionStart;
    // Find the @ that triggered the mention
    const beforeCursor = text.slice(0, cursor);
    const atMatch = beforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const q = atMatch[1];
      setMentionQuery(q);
      setMentionStart(cursor - q.length - 1); // position of @
      setShowSuggestions(true);
      setActiveIndex(0);
      debounceFetch(q);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const debounceFetch = useCallback((q) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchTagSuggestions(q);
        setSuggestions(results.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  }, []);

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart || 0);
    const inserted = `@${suggestion.handle} `;
    const newText = before + inserted + after;
    onChange?.(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = (before + inserted).length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Highlight @mentions in the overlay (visual decoration)
  const renderHighlighted = () => {
    return value.replace(/@(\w+)/g, '<mark class="mention-highlight">@$1</mark>');
  };

  return (
    <div className={`mention-input-wrapper ${className}`}>
      <div className="mention-input-container" style={{ minHeight }}>
        {/* Highlight overlay (decorative, pointer-events: none) */}
        <div
          className="mention-highlight-overlay"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderHighlighted() + "\u200B" }}
          aria-hidden="true"
        />
        {/* Real textarea */}
        <textarea
          ref={textareaRef}
          className="mention-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      </div>

      {/* Hint */}
      <div className="mention-hint">
        <AtSign size={12} /> Type @ to mention users or audience tags
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={dropdownRef}
            className="mention-dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading && (
              <div className="mention-loading">
                <Loader2 size={14} className="spin" />
                <span>Searching...</span>
              </div>
            )}

            {!isLoading && suggestions.length === 0 && (
              <div className="mention-empty">No suggestions found</div>
            )}

            {!isLoading && suggestions.map((s, idx) => (
              <button
                key={`${s.type}-${s.handle}`}
                type="button"
                className={`mention-item ${idx === activeIndex ? "active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {/* Avatar / Icon */}
                <div className={`mention-avatar ${s.type === "USER" ? "user" : s.icon || "system"}`}>
                  {s.type === "USER" ? (
                    s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.handle} />
                    ) : (
                      <User size={14} />
                    )
                  ) : (
                    <Tag size={14} />
                  )}
                </div>

                {/* Info */}
                <div className="mention-info">
                  <span className="mention-handle">@{s.handle}</span>
                  <span className="mention-label">{s.label}</span>
                </div>

                {/* Type Badge */}
                <span className={`mention-type-badge ${s.type === "USER" ? "user" : "system"}`}>
                  {s.type === "USER" ? "User" : "Tag"}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
