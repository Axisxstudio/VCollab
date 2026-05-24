import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Users,
  School,
  University,
  ChevronDown,
  Check,
  Building2,
  X
} from "lucide-react";
import "./AudienceTargetingPanel.css";

const SCHOOL_GRADES = [
  "OL", "AL"
];

const UNIVERSITY_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Semester 1", "Semester 2"];

const TARGET_TYPES = [
  { value: "ALL", label: "All Users", icon: Users, description: "Visible to everyone" },
  { value: "SCHOOL", label: "School Students", icon: School, description: "Target by grade" },
  { value: "UNIVERSITY", label: "University Students", icon: University, description: "Target by year & faculty" },
  { value: "INSTITUTION", label: "Specific Institution", icon: Building2, description: "Target a specific university/school" }
];

/**
 * AudienceTargetingPanel
 * Reusable component for selecting content audience filters.
 * 
 * Props:
 *   value: { targetType, grade, academicYear, semester, faculty, institutionName }
 *   onChange: (newValue) => void
 *   compact: boolean (shows collapsed view by default)
 */
export default function AudienceTargetingPanel({ value = {}, onChange, compact = false }) {
  const [isOpen, setIsOpen] = useState(!compact);

  const update = (patch) => onChange?.({ ...value, ...patch });

  const selectedType = value.targetType || "ALL";
  const selectedTypeInfo = TARGET_TYPES.find(t => t.value === selectedType);

  const clearFilters = () => onChange?.({ targetType: "ALL" });

  const hasFilters = selectedType !== "ALL";

  return (
    <div className="audience-panel">
      {/* Header Toggle */}
      <button
        type="button"
        className={`audience-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="audience-toggle-left">
          <Target size={16} />
          <span>Audience Targeting</span>
          {hasFilters && (
            <span className="audience-active-badge">Active</span>
          )}
        </div>
        <div className="audience-toggle-right">
          {selectedTypeInfo && hasFilters && (
            <span className="audience-current-type">
              <selectedTypeInfo.icon size={12} />
              {selectedTypeInfo.label}
            </span>
          )}
          <ChevronDown size={16} className={`toggle-chevron ${isOpen ? "rotated" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="audience-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Target Type Row */}
            <div className="audience-section">
              <label className="audience-label">Who can see this?</label>
              <div className="target-type-grid">
                {TARGET_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`target-type-btn ${selectedType === type.value ? "selected" : ""}`}
                      onClick={() => update({ targetType: type.value, grade: "", academicYear: "", semester: "", faculty: "", institutionName: "" })}
                    >
                      <Icon size={18} />
                      <span>{type.label}</span>
                      <small>{type.description}</small>
                      {selectedType === type.value && (
                        <div className="target-check"><Check size={10} /></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Filters */}
            <AnimatePresence>
              {selectedType === "SCHOOL" && (
                <motion.div
                  className="audience-section"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <label className="audience-label">Select Grade</label>
                  <div className="filter-chip-group">
                    {SCHOOL_GRADES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`filter-chip ${value.grade === g ? "selected" : ""}`}
                        onClick={() => update({ grade: value.grade === g ? "" : g })}
                      >
                        {g}
                        {value.grade === g && <Check size={10} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* University Filters */}
            <AnimatePresence>
              {selectedType === "UNIVERSITY" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="audience-section">
                    <label className="audience-label">Academic Year</label>
                    <div className="filter-chip-group">
                      {UNIVERSITY_YEARS.map((y) => (
                        <button
                          key={y}
                          type="button"
                          className={`filter-chip ${value.academicYear === y ? "selected" : ""}`}
                          onClick={() => update({ academicYear: value.academicYear === y ? "" : y, semester: "" })}
                        >
                          {y}
                          {value.academicYear === y && <Check size={10} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {value.academicYear && (
                    <motion.div
                      className="audience-section"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <label className="audience-label">Semester</label>
                      <div className="filter-chip-group">
                        {SEMESTERS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`filter-chip ${value.semester === s ? "selected" : ""}`}
                            onClick={() => update({ semester: value.semester === s ? "" : s })}
                          >
                            {s}
                            {value.semester === s && <Check size={10} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="audience-section">
                    <label className="audience-label">Faculty / Department (optional)</label>
                    <input
                      type="text"
                      className="audience-input"
                      placeholder="e.g. Faculty of Computing"
                      value={value.faculty || ""}
                      onChange={(e) => update({ faculty: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Institution Filter */}
            <AnimatePresence>
              {selectedType === "INSTITUTION" && (
                <motion.div
                  className="audience-section"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <label className="audience-label">Institution Name</label>
                  <input
                    type="text"
                    className="audience-input"
                    placeholder="e.g. SLIIT, University of Moratuwa"
                    value={value.institutionName || ""}
                    onChange={(e) => update({ institutionName: e.target.value })}
                  />
                  <div className="institution-chips">
                    {["SLIIT", "UoM", "UoC", "NSBM", "IIT"].map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        className={`filter-chip small ${value.institutionName === inst ? "selected" : ""}`}
                        onClick={() => update({ institutionName: value.institutionName === inst ? "" : inst })}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {hasFilters && (
              <div className="audience-footer">
                <button type="button" className="audience-clear-btn" onClick={clearFilters}>
                  <X size={14} /> Clear targeting
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
