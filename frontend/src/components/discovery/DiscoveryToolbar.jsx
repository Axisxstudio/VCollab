import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from "lucide-react";
import { listCategories } from "../../services/category.service";
import { DISCOVERY_SORT_OPTIONS } from "../../utils/discovery";

export default function DiscoveryToolbar({
  title,
  description,
  categoryType,
  filters,
  onChange,
  onReset,
  searchPlaceholder = "Search"
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", categoryType],
    queryFn: () => listCategories(categoryType),
    enabled: Boolean(categoryType)
  });

  const [mentionState, setMentionState] = useState({ active: false, query: "", index: 0, results: [], anchor: null, field: null });

  const searchUsers = useCallback(async (query) => {
    try {
      const resp = await axios.get(`/api/v1/users/discover?query=${query}`);
      const users = resp.data.data.content || [];
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

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    const offset = e.target.selectionStart;
    const textBefore = value.substring(0, offset);
    const lastAt = textBefore.lastIndexOf("@");

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBefore[lastAt - 1]))) {
      const query = textBefore.substring(lastAt + 1);
      if (!query.includes(" ")) {
        const rect = e.target.getBoundingClientRect();
        setMentionState(s => ({ ...s, active: true, query, field, anchor: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX } }));
      } else {
        setMentionState(s => ({ ...s, active: false }));
      }
    } else {
      setMentionState(s => ({ ...s, active: false }));
    }
    onChange(field, value);
  };

  const selectMention = (username) => {
    const currentVal = filters[mentionState.field] || "";
    // We don't have caret position easily saved for simple input, so we use a basic regex replace of the last @query
    const parts = currentVal.split("@");
    parts[parts.length - 1] = username + " ";
    const newVal = parts.join("@");
    onChange(mentionState.field, newVal);
    setMentionState(s => ({ ...s, active: false }));
  };

  return (
    <section className="discovery-premium-toolbar">
      <div className="discovery-toolbar-main">
        <div className="discovery-search-wrapper">
          <Search className="discovery-search-icon" size={20} />
          <input
            id={`${categoryType}-search`}
            type="text"
            className="discovery-main-input mention-input-focus"
            value={filters.search}
            placeholder={searchPlaceholder}
            onChange={(event) => handleInputChange("search", event)}
          />
        </div>

        <div className="discovery-tag-wrapper">
          <input
            id={`${categoryType}-tag`}
            type="text"
            className="discovery-main-input"
            value={filters.tag}
            placeholder="Filter by tag (e.g. react, ai)"
            onChange={(event) => onChange("tag", event.target.value)}
          />
        </div>

        <div className="discovery-toolbar-actions">
          <button
            type="button"
            className={`btn-filter-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal size={18} />
            <span className="discovery-btn-label">Filters</span>
            <span className="discovery-btn-chevron">
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          
          <button type="button" className="btn-reset-light discovery-btn-reset" onClick={onReset} title="Reset all filters">
            <X size={18} />
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="discovery-advanced-panel">
          <div className="discovery-filter-grid">
            <div className="discovery-field">
              <label htmlFor={`${categoryType}-category`}>Category</label>
              <select
                id={`${categoryType}-category`}
                value={filters.categoryId}
                onChange={(event) => onChange("categoryId", event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="discovery-field">
              <label htmlFor={`${categoryType}-sort`}>Sort by</label>
              <select
                id={`${categoryType}-sort`}
                value={filters.sort}
                onChange={(event) => onChange("sort", event.target.value)}
              >
                {DISCOVERY_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="discovery-field">
              <label htmlFor={`${categoryType}-owner`}>Contributor</label>
              <input
                id={`${categoryType}-owner`}
                type="text"
                value={filters.owner}
                placeholder="Username or name"
                onChange={(event) => onChange("owner", event.target.value)}
              />
            </div>

            <div className="discovery-field-group">
              <div className="discovery-field">
                <label htmlFor={`${categoryType}-from-date`}>From</label>
                <input
                  id={`${categoryType}-from-date`}
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) => onChange("fromDate", event.target.value)}
                />
              </div>
              <div className="discovery-field">
                <label htmlFor={`${categoryType}-to-date`}>To</label>
                <input
                  id={`${categoryType}-to-date`}
                  type="date"
                  value={filters.toDate}
                  onChange={(event) => onChange("toDate", event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            padding: "8px",
            minWidth: "180px"
          }}
        >
          {mentionState.results.map((user, idx) => (
            <div 
              key={user.username}
              onClick={() => selectMention(user.username)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                background: idx === mentionState.index ? "#f1f5f9" : "transparent"
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#22c55e" }}>@{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
