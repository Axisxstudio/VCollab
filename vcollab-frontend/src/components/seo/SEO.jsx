import { useEffect } from "react";

export default function SEO({ 
  title, 
  description = "A Collaboration Platform Built for Students. Showcase projects, find teammates, and build incredibly massive real-world portfolios.", 
  keywords = "student projects, university, developers, code, collaboration, VTech AI", 
  type = "website",
  image = "/VCollab_hero.png", 
  url = ""
}) {
  useEffect(() => {
    const siteTitle = title ? `${title} | VCollab` : "VCollab | The Ultimate Student Collaboration Platform";
    
    document.title = siteTitle;

    const setMetaTag = (attr, name, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", keywords);

    setMetaTag("property", "og:type", type);
    if (url) setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:title", siteTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", image);

    setMetaTag("property", "twitter:card", "summary_large_image");
    if (url) setMetaTag("property", "twitter:url", url);
    setMetaTag("property", "twitter:title", siteTitle);
    setMetaTag("property", "twitter:description", description);
    setMetaTag("property", "twitter:image", image);

  }, [title, description, keywords, type, image, url]);

  return null;
}
