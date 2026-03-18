import { useState } from "react";
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

  return (
    <section className="discovery-premium-toolbar">
      <div className="discovery-toolbar-main">
        <div className="discovery-search-wrapper">
          <Search className="discovery-search-icon" size={20} />
          <input
            id={`${categoryType}-search`}
            type="text"
            className="discovery-main-input"
            value={filters.search}
            placeholder={searchPlaceholder}
            onChange={(event) => onChange("search", event.target.value)}
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
            Filters
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <button type="button" className="btn-reset-light" onClick={onReset} title="Reset all filters">
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
    </section>
  );
}
