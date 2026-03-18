import { useEffect, useMemo, useRef, useState } from "react";
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
  const sanitizedValue = useMemo(() => sanitizeRichText(value), [value]);

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

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") || "";
    runEditorCommand("insertText", text);
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
            onInput={emitChange}
            onBlur={emitChange}
            onPaste={handlePaste}
            style={{ minHeight }}
          />
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