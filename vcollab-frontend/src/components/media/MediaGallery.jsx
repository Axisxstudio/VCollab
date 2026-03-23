import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, PlayCircle } from "lucide-react";

export default function MediaGallery({
  items = [],
  title = "Content gallery",
  variant = "detail",
  aspect = "landscape",
  showCaption = true,
  className = ""
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryItems = useMemo(() => items.filter((item) => item?.url), [items]);

  useEffect(() => {
    setActiveIndex(0);
  }, [galleryItems]);

  if (!galleryItems.length) {
    return null;
  }

  const boundedIndex = Math.min(activeIndex, galleryItems.length - 1);
  const activeItem = galleryItems[boundedIndex];

  const goPrevious = () => {
    setActiveIndex((current) => (current === 0 ? galleryItems.length - 1 : current - 1));
  };

  const goNext = () => {
    setActiveIndex((current) => (current === galleryItems.length - 1 ? 0 : current + 1));
  };

  const viewportClassName = [
    "media-gallery__viewport",
    `media-gallery__viewport--${variant}`,
    variant === "card" ? `media-gallery__viewport--${aspect}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={["media-gallery", className].filter(Boolean).join(" ")}>
      <div className={viewportClassName}>
        {galleryItems.length > 1 && (
          <>
            <button type="button" className="media-gallery__nav media-gallery__nav--prev" onClick={goPrevious} aria-label="Previous media">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="media-gallery__nav media-gallery__nav--next" onClick={goNext} aria-label="Next media">
              <ChevronRight size={18} />
            </button>
            <div className="media-gallery__counter">
              {boundedIndex + 1} / {galleryItems.length}
            </div>
          </>
        )}

        <div className="media-gallery__slide">
          {activeItem.mediaType === "VIDEO" ? (
            <video controls src={activeItem.url} preload="metadata" />
          ) : (
            <img src={activeItem.url} alt={activeItem.label || title} />
          )}
        </div>

        {showCaption && (variant === "detail" || activeItem.label) && (
          <div className="media-gallery__caption">{activeItem.label || title}</div>
        )}
      </div>

      {/* Gallery thumbs removed as per request - only main image with arrows allowed */}

      {galleryItems.length > 1 && variant === "card" && (
        <div className="media-gallery__dots" aria-label={`${title} navigation`}>
          {galleryItems.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              className={`media-gallery__dot ${index === boundedIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to media ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}