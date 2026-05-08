export function isSchoolContent({ targetType, authorEducationType }) {
  return targetType === "SCHOOL" || authorEducationType === "SCHOOL";
}

export function shouldShowContentForViewer({ viewerEducationType, showSchool, targetType, authorEducationType }) {
  if (viewerEducationType !== "UNIVERSITY") {
    return true;
  }

  const schoolContent = isSchoolContent({ targetType, authorEducationType });
  return showSchool ? schoolContent : !schoolContent;
}

export function sortContentForViewerPriority(items, viewerEducationType, getContentMeta) {
  if (!Array.isArray(items) || viewerEducationType !== "SCHOOL") {
    return items;
  }

  return items
    .map((item, index) => ({
      item,
      index,
      schoolContent: isSchoolContent(getContentMeta(item))
    }))
    .sort((left, right) => {
      if (left.schoolContent === right.schoolContent) {
        return left.index - right.index;
      }
      return left.schoolContent ? -1 : 1;
    })
    .map((entry) => entry.item);
}
