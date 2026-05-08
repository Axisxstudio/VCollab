import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import {
  Bold,
  Code,
  Eraser,
  Eye,
  EyeOff,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Mail,
  Palette,
  Paperclip,
  Type,
  Underline
} from "lucide-react";
import { isRichTextBlank, prepareRichTextSubmission, sanitizeRichText } from "../../utils/richText";
import RichTextContent from "../content/RichTextContent";

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "XL", value: "6" }
];

const TOOLBAR_GROUPS = [
  {
    items: [
      { label: "Bold", command: "bold", icon: Bold },
      { label: "Italic", command: "italic", icon: Italic },
      { label: "Underline", command: "underline", icon: Underline }
    ]
  },
  {
    items: [
      { label: "Link", command: "createLink", icon: LinkIcon, prompt: "Enter URL:" },
      { label: "Email", command: "createLink", icon: Mail, value: "mailto:", prompt: "Enter Email:" },
      { label: "Attach", command: "insertHorizontalRule", icon: Paperclip }
    ]
  },
  {
    items: [
      { label: "Code", command: "formatBlock", icon: Code, value: "PRE" },
      { label: "Bullets", command: "insertUnorderedList", icon: List },
      { label: "Numbers", command: "insertOrderedList", icon: ListOrdered }
    ]
  }
];

function runEditorCommand(command, value = null) {
  if (typeof document === "undefined") {
    return;
  }

  document.execCommand("styleWithCSS", false, true);
  document.execCommand(command, false, value);
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write here...",
  minHeight = 220,
  helperText,
  maxLength = 5000
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef(null);
  const lastValueRef = useRef(value || "");
  const [mentionState, setMentionState] = useState({ active: false, query: "", index: 0, results: [], anchor: null });
  const sanitizedValue = useMemo(() => sanitizeRichText(value), [value]);

  const searchUsers = useCallback(async (query) => {
    try {
      const resp = await axios.get(`/api/v1/users/discover?query=${query}`);
      const users = resp.data.data.content || [];
      // Add 'all' option if query is 'all' or empty
      const results = users.map(u => ({ username: u.username, fullName: u.fullName }));
      if ("all".startsWith(query.toLowerCase())) {
        results.unshift({ username: "all", fullName: "Everyone (@all)" });
      }
      setMentionState(s => ({ ...s, results: results.slice(0, 8) }));
    } catch (err) {
      console.error("Mention search failed", err);
    }
  }, []);

  useEffect(() => {
    if (mentionState.active && mentionState.query.length >= 0) {
      const timer = setTimeout(() => searchUsers(mentionState.query), 200);
      return () => clearTimeout(timer);
    }
  }, [mentionState.active, mentionState.query, searchUsers]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== sanitizedValue && document.activeElement !== editor) {
      editor.innerHTML = sanitizedValue;
      lastValueRef.current = sanitizedValue;
      setCharCount(editor.innerText.replace(/\n/g, "").length);
    }
  }, [sanitizedValue]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextValue = prepareRichTextSubmission(editor.innerHTML);
    lastValueRef.current = nextValue;
    setCharCount(editor.innerText.replace(/\n/g, "").length);
    onChange?.(nextValue);
  };

  const handleCommand = (command, valueOverride = null, promptText = null) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();

    let finalValue = valueOverride;
    if (promptText) {
      const input = window.prompt(promptText, valueOverride || "");
      if (!input) return;
      finalValue = input;
    }

    runEditorCommand(command, finalValue);
    emitChange();
  };

  const insertMention = (username) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    // Find the @ trigger position in the current text node
    const textNode = range.startContainer;
    const offset = range.startOffset;
    const text = textNode.textContent || "";
    const mentionStart = text.lastIndexOf("@", offset - 1);

    if (mentionStart !== -1) {
      range.setStart(textNode, mentionStart);
      range.setEnd(textNode, offset);
      range.deleteContents();

      const mentionNode = document.createElement("span");
      mentionNode.className = "mention";
      mentionNode.textContent = `@${username}`;
      // Set as non-editable but keep the outer container editable
      mentionNode.setAttribute("contenteditable", "false");
      
      range.insertNode(mentionNode);
      
      // Add a trailing space
      const spaceNode = document.createTextNode("\u00A0");
      mentionNode.after(spaceNode);
      
      // Move cursor after the space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      setMentionState({ active: false, query: "", index: 0, results: [], anchor: null });
      emitChange();
    }
  };

  const handleInput = (e) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.startContainer.textContent || "";
      const offset = range.startOffset;
      const lastAt = text.lastIndexOf("@", offset - 1);
      
      // Check if @ is preceded by space or start of line
      if (lastAt !== -1 && (lastAt === 0 || /\s/.test(text[lastAt - 1]))) {
        const query = text.substring(lastAt + 1, offset);
        if (!query.includes(" ")) {
          // Get position for the dropdown
          const rect = range.getBoundingClientRect();
          setMentionState(s => ({ ...s, active: true, query, anchor: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX } }));
        } else {
          setMentionState(s => ({ ...s, active: false }));
        }
      } else {
        setMentionState(s => ({ ...s, active: false }));
      }
    }
    emitChange();
  };

  const handleKeyDown = (e) => {
    if (mentionState.active && mentionState.results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionState(s => ({ ...s, index: (s.index + 1) % s.results.length }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionState(s => ({ ...s, index: (s.index - 1 + s.results.length) % s.results.length }));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionState.results[mentionState.index].username);
      } else if (e.key === "Escape") {
        setMentionState(s => ({ ...s, active: false }));
      }
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const htmlSnippet = event.clipboardData?.getData("text/html");
    const plainText = event.clipboardData?.getData("text/plain");

    if (htmlSnippet) {
      const sanitized = sanitizeRichText(htmlSnippet);
      runEditorCommand("insertHTML", sanitized);
    } else if (plainText) {
      // Basic text-to-html conversion for simple lists (dash/bullet)
      const lines = plainText.split("\n");
      const hasBulletedLines = lines.some(line => line.trim().startsWith("- ") || line.trim().startsWith("* "));
      
      if (hasBulletedLines && lines.length > 2) {
        // Advanced: convert simple list to HTML if it looks like a list
        const listHtml = `<ul>${lines.map(line => `<li>${line.replace(/^[-*]\s*/, "")}</li>`).join("")}</ul>`;
        runEditorCommand("insertHTML", listHtml);
      } else {
        runEditorCommand("insertText", plainText);
      }
    }
    emitChange();
  };

  return (
    <div className={`rich-editor ${showPreview ? "rich-editor--preview" : ""}`}>
      <div className="rich-editor__label">
        <span>{label}</span>
        <div className="rich-editor__count">
          {charCount} {maxLength ? `/ ${maxLength}` : ""}
        </div>
      </div>

      <div className="rich-editor__container">
        <div className="rich-editor__toolbar" role="toolbar">
          {TOOLBAR_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="rich-editor__tool-group">
              {group.items.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className="rich-editor__tool"
                    onClick={() => handleCommand(action.command, action.value, action.prompt)}
                    title={action.label}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          ))}

          <div className="rich-editor__tool-group">
            <label className="rich-editor__select" title="Font size">
              <Type size={18} />
              <select 
                defaultValue="3" 
                onChange={(event) => handleCommand("fontSize", event.target.value)}
              >
                {FONT_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rich-editor__tool rich-editor__tool--color" title="Text color">
              <Palette size={18} />
              <input
                type="color"
                defaultValue="#17324d"
                onChange={(event) => handleCommand("foreColor", event.target.value)}
              />
            </label>

            <button
              type="button"
              className="rich-editor__tool"
              onClick={() => handleCommand("removeFormat")}
              title="Clear formatting"
            >
              <Eraser size={18} />
            </button>
          </div>

          <button
            type="button"
            className="rich-editor__view-toggle"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <><EyeOff size={14} /> Edit</>
            ) : (
              <><Eye size={14} /> Preview</>
            )}
          </button>
        </div>

        <div className={`rich-editor__frame ${showPreview ? "rich-editor__frame--split" : ""}`} style={{ minHeight }}>
          <div
            ref={editorRef}
            className={`rich-editor__canvas ${isRichTextBlank(lastValueRef.current) ? "rich-editor__canvas--empty" : ""}`}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            data-placeholder={placeholder}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={emitChange}
            onPaste={handlePaste}
            style={{ minHeight }}
          />
          {mentionState.active && mentionState.results.length > 0 && (
            <div 
              className="mention-dropdown" 
              style={{ 
                position: "fixed", 
                top: mentionState.anchor.top, 
                left: mentionState.anchor.left,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                padding: "8px",
                minWidth: "180px"
              }}
            >
              {mentionState.results.map((user, idx) => (
                <div 
                  key={user.username}
                  onClick={() => insertMention(user.username)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: idx === mentionState.index ? "#f1f5f9" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: idx === mentionState.index ? "#22c55e" : "#0f172a" }}>
                    @{user.username}
                  </span>
                  {user.fullName && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{user.fullName}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {showPreview && (
            <div className="rich-editor__preview" style={{ minHeight }}>
              <div className="rich-editor__preview-label">Live Preview</div>
              <RichTextContent value={lastValueRef.current} />
            </div>
          )}
        </div>
      </div>

      {helperText && <p className="rich-editor__help">{helperText}</p>}
    </div>
  );
}