import { useMemo } from "react";
import { isRichTextBlank, sanitizeRichText } from "../../utils/richText";

export default function RichTextContent({
  value,
  className = "",
  as: Component = "div",
  fallback = "No content added yet."
}) {
  const safeHtml = useMemo(() => sanitizeRichText(value), [value]);

  if (isRichTextBlank(safeHtml)) {
    return <p className={className}>{fallback}</p>;
  }

  return <Component className={`rich-text-output ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}