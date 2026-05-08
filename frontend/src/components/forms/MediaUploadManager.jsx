import { useRef, useState } from "react";
import { 
  FileVideo, 
  Image as ImageIcon, 
  Loader2, 
  Plus, 
  Trash2, 
  Upload, 
  UploadCloud, 
  Video,
  FileText 
} from "lucide-react";
import { uploadMedia } from "../../services/media.service";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function resequence(items = []) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index
  }));
}

export default function MediaUploadManager({
  label,
  context,
  items = [],
  onChange,
  multiple = true,
  accept = "image/*,video/*",
  buttonLabel,
  helperText,
  emptyLabel = "Drag and drop your files here, or click to browse",
  compact = false
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = async (selectedFiles) => {
    if (!selectedFiles.length) return;
    setUploading(true);
    try {
      const uploadedItems = [];
      for (const file of selectedFiles) {
        const uploaded = await uploadMedia(file, context);
        uploadedItems.push({
          url: uploaded.url,
          mediaType: uploaded.mediaType,
          fileName: uploaded.fileName || file.name,
          fileSize: uploaded.size || file.size || null,
          sortOrder: 0
        });
      }

      const nextItems = multiple
        ? resequence([...(items || []), ...uploadedItems])
        : resequence(uploadedItems.slice(0, 1));

      onChange?.(nextItems);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFilesSelected = (event) => {
    processFiles(Array.from(event.target.files || []));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleRemove = (index) => {
    const nextItems = resequence((items || []).filter((_, itemIndex) => itemIndex !== index));
    onChange?.(nextItems);
  };

  const isCoverMode = !multiple && items.length > 0;

  if (compact) {
    return (
      <div className={`media-manager-compact ${isDragOver ? "is-dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFilesSelected}
          hidden
        />
        <div className="media-manager-compact__input-group">
          <div className="media-manager-compact__display" onClick={() => inputRef.current?.click()}>
            <FileText size={18} className="media-manager-compact__icon" />
            <span className="media-manager-compact__filename">
              {uploading ? "Uploading..." : items.length > 0 ? items[0].fileName : emptyLabel}
            </span>
          </div>
          {items.length > 0 ? (
            <button type="button" className="media-manager-compact__action-btn delete" onClick={() => handleRemove(0)}>
              <Trash2 size={16} />
            </button>
          ) : (
            <button type="button" className="media-manager-compact__action-btn upload" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`media-manager-pro ${isDragOver ? "is-dragging" : ""}`}>
      <div className="media-manager-pro__header">
        <div className="media-manager-pro__title-box">
          <label>{label}</label>
          {helperText && <p>{helperText}</p>}
        </div>
      </div>

      <div 
        className={`media-manager-pro__dropzone ${isCoverMode ? "has-cover" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFilesSelected}
          hidden
        />

        {items.length === 0 ? (
          <div className="media-manager-pro__empty" onClick={() => inputRef.current?.click()}>
            <div className="media-manager-pro__icon-glow">
              {uploading ? <Loader2 className="spin" size={32} /> : <UploadCloud size={32} />}
            </div>
            <div className="media-manager-pro__empty-text">
              <strong>{uploading ? "Uploading files..." : buttonLabel || "Click or Drag to Upload"}</strong>
              <span>{emptyLabel}</span>
            </div>
          </div>
        ) : multiple ? (
          <div className="media-manager-pro__grid">
            {items.map((item, index) => (
              <div key={`${item.url}-${index}`} className="media-manager-pro__item">
                <div className="media-manager-pro__preview">
                  {item.mediaType === "VIDEO" ? (
                    <video src={item.url} preload="metadata" />
                  ) : item.mediaType === "DOCUMENT" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px" }}>
                      <FileText size={48} color="#EF4444" />
                    </div>
                  ) : (
                    <img src={item.url} alt="" />
                  )}
                  <div className="media-manager-pro__overlay">
                    <button type="button" onClick={() => handleRemove(index)} title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="media-manager-pro__info">
                  <span title={item.fileName}>{item.fileName}</span>
                </div>
              </div>
            ))}
            {!uploading && (
              <button 
                type="button" 
                className="media-manager-pro__add-btn"
                onClick={() => inputRef.current?.click()}
              >
                <Plus size={24} />
                <span>Add More</span>
              </button>
            )}
            {uploading && (
              <div className="media-manager-pro__add-btn is-uploading">
                <Loader2 className="spin" size={24} />
              </div>
            )}
          </div>
        ) : (
          <div className="media-manager-pro__cover">
            <div className="media-manager-pro__cover-preview">
              {items[0].mediaType === "VIDEO" ? (
                <video src={items[0].url} controls />
              ) : items[0].mediaType === "DOCUMENT" ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px" }}>
                  <FileText size={64} color="#EF4444" />
                </div>
              ) : (
                <img src={items[0].url} alt="Cover" />
              )}
            </div>
            <div className="media-manager-pro__cover-actions">
              <div className="media-manager-pro__cover-info">
                <strong>{items[0].fileName}</strong>
                <span>{formatBytes(items[0].fileSize)}</span>
              </div>
              <div className="media-manager-pro__btn-group">
                <button type="button" className="btn-glass-pro" onClick={() => inputRef.current?.click()} title="Change Media">
                  <Upload size={18} />
                </button>
                <button type="button" className="btn-danger-glass" onClick={() => handleRemove(0)} title="Remove Media">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}