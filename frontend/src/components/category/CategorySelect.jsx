import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { createCategory, listCategories } from "../../services/category.service";

export default function CategorySelect({ type, value, onChange }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ["categories", type || "all"], [type]);
  const { data = [] } = useQuery({
    queryKey,
    queryFn: () => listCategories(type)
  });

  const handleSelect = (event) => {
    const selected = event.target.value;
    if (selected === "__new__") {
      setShowCreate(true);
      return;
    }
    setShowCreate(false);
    onChange?.(selected);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createCategory({ name: newName.trim(), type });
    setNewName("");
    setShowCreate(false);
    await queryClient.invalidateQueries({ queryKey });
    onChange?.(created.id);
  };

  return (
    <div className="category-select">
      <div className="input-icon-group">
        <Layers size={18} />
        <select value={value || ""} onChange={handleSelect}>
          <option value="" disabled>
            Select category
          </option>
          {data.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
            ))}
          <option value="__new__">+ Create new category</option>
        </select>
      </div>
      {showCreate && (
        <div className="category-create" style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <input
            style={{ padding: "8px 12px" }}
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn-primary" style={{ padding: "8px 16px", background: "#4a5568" }} type="button" onClick={handleCreate}>
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
