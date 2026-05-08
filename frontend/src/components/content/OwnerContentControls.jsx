import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

export default function OwnerContentControls({ editPath, onDelete, deleteLabel = "Delete content" }) {
  return (
    <div className="content-surface__owner-actions">
      {editPath && (
        <Link to={editPath} className="icon-chip-btn" title="Edit content" aria-label="Edit content">
          <Pencil size={16} />
        </Link>
      )}
      {onDelete && (
        <button
          type="button"
          className="icon-chip-btn icon-chip-btn--danger"
          onClick={onDelete}
          title={deleteLabel}
          aria-label={deleteLabel}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}