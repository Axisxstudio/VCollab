const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "span",
  "div",
  "a",
  "font",
  "blockquote"
]);

const ALLOWED_STYLE_PROPERTIES = new Set([
  "color",
  "font-size",
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration"
]);

const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%]+\)|[a-z]+)$/i;
const SAFE_FONT_SIZE = /^\d+(px|rem|em|%)$/i;
const SAFE_ALIGNMENT = /^(left|center|right|justify)$/i;
const SAFE_URL = /^(https?:|mailto:|\/)/i;

function canUseDom() {
  return typeof window !== "undefined" && typeof window.DOMParser !== "undefined";
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeStyleValue(property, value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (property === "color") {
    return SAFE_COLOR.test(trimmed) ? trimmed : null;
  }

  if (property === "font-size") {
    return SAFE_FONT_SIZE.test(trimmed) ? trimmed : null;
  }

  if (property === "text-align") {
    return SAFE_ALIGNMENT.test(trimmed) ? trimmed : null;
  }

  if (property === "font-weight" || property === "font-style" || property === "text-decoration") {
    return /^[a-z\s-]+$/i.test(trimmed) ? trimmed : null;
  }

  return null;
}

function sanitizeStyleAttribute(value) {
  if (!value) {
    return "";
  }

  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(":"))
    .filter(([property]) => property)
    .map(([property, rawValue]) => {
      const key = property.trim().toLowerCase();
      if (!ALLOWED_STYLE_PROPERTIES.has(key)) {
        return null;
      }

      const safeValue = sanitizeStyleValue(key, rawValue || "");
      if (!safeValue) {
        return null;
      }

      return `${key}: ${safeValue}`;
    })
    .filter(Boolean)
    .join("; ");
}

function isSafeHref(value) {
  return SAFE_URL.test(value.trim());
}

function unwrapElement(element) {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

function sanitizeElement(element) {
  Array.from(element.children).forEach((child) => sanitizeElement(child));

  const tag = element.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    unwrapElement(element);
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value || "";

    if (name === "style") {
      const sanitized = sanitizeStyleAttribute(value);
      if (sanitized) {
        element.setAttribute("style", sanitized);
      } else {
        element.removeAttribute("style");
      }
      return;
    }

    if (tag === "a" && name === "href") {
      if (isSafeHref(value)) {
        element.setAttribute("href", value.trim());
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer noopener");
      } else {
        element.removeAttribute("href");
      }
      return;
    }

    if (tag === "font" && name === "color") {
      if (!SAFE_COLOR.test(value.trim())) {
        element.removeAttribute(name);
      }
      return;
    }

    if (tag === "font" && name === "size") {
      if (!/^[1-7]$/.test(value.trim())) {
        element.removeAttribute(name);
      }
      return;
    }

    if (
      (tag === "a" && (name === "target" || name === "rel")) ||
      (tag === "font" && (name === "color" || name === "size"))
    ) {
      return;
    }

    element.removeAttribute(name);
  });
}

export function sanitizeRichText(value) {
  if (!value) {
    return "";
  }

  if (!canUseDom()) {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*['\"][^'\"]*['\"]/gi, "")
      .trim();
  }

  const parser = new window.DOMParser();
  const document = parser.parseFromString(`<div>${value}</div>`, "text/html");
  const wrapper = document.body.firstElementChild;
  if (!wrapper) {
    return "";
  }

  sanitizeElement(wrapper);

  const sanitized = wrapper.innerHTML
    .replace(/<div><br><\/div>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .trim();

  return isRichTextBlank(sanitized) ? "" : sanitized;
}

export function stripRichText(value) {
  if (!value) {
    return "";
  }

  if (!canUseDom()) {
    return normalizeWhitespace(value.replace(/<[^>]+>/g, " "));
  }

  const container = window.document.createElement("div");
  container.innerHTML = value;
  return normalizeWhitespace(container.textContent || "");
}

export function truncateRichText(value, maxLength = 160) {
  const plainText = stripRichText(value);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function isRichTextBlank(value) {
  return stripRichText(value).length === 0;
}

export function prepareRichTextSubmission(value) {
  return sanitizeRichText(value);
}