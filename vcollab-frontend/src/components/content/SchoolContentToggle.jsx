import { GraduationCap, School } from "lucide-react";
import HoverActionPill from "../discovery/HoverActionPill";

export default function SchoolContentToggle({ isVisible, showSchool, onToggle }) {
  if (!isVisible) {
    return null;
  }

  return (
    <HoverActionPill
      icon={showSchool ? School : GraduationCap}
      label={showSchool ? "Back to Main Content" : "School Content Only"}
      onClick={onToggle}
      active={showSchool}
      title={showSchool ? "Back to main content" : "Show only school content"}
    />
  );
}
