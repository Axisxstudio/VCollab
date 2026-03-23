import { Link } from "react-router-dom";
import SEO from "../../components/seo/SEO";
import PublicFooter from "../../components/public/PublicFooter";
import { routes } from "../../config/routes";
import "./legal-page.css";

const sections = [
  {
    title: "Using the Platform",
    paragraphs: [
      "VCollab is intended for professional collaboration, project discovery, publishing, and communication. You are responsible for the accuracy of your account details and for activity performed through your account.",
      "You agree to use the platform lawfully, respectfully, and in a way that does not harm other users, degrade system performance, or undermine platform integrity."
    ]
  },
  {
    title: "Content Ownership and Responsibility",
    paragraphs: [
      "You retain ownership of content you create and upload, including projects, posts, blogs, comments, profile media, and related materials. By publishing content on VCollab, you grant us the rights necessary to host, display, distribute, and process that content within platform features.",
      "You must not upload unlawful, infringing, deceptive, abusive, or malicious content. We may remove or restrict content that violates platform rules, safety standards, or legal requirements."
    ]
  },
  {
    title: "Real-Time Features and Availability",
    paragraphs: [
      "VCollab provides real-time experiences such as notifications, presence, live feeds, comments, messaging, and collaboration updates. These features are offered on a best-effort basis and may be affected by network conditions, browser support, maintenance windows, or security controls.",
      "We may modify, suspend, or improve features over time to maintain platform quality, performance, and safety."
    ]
  },
  {
    title: "Accounts, Moderation, and Enforcement",
    paragraphs: [
      "We may investigate abuse, enforce content standards, limit access, suspend accounts, or preserve records when necessary to protect the community or comply with law.",
      "Attempts to bypass permissions, misuse APIs, scrape protected data, interfere with infrastructure, or impersonate other users are prohibited."
    ]
  },
  {
    title: "Liability and Contact",
    paragraphs: [
      "VCollab is provided on an as-available basis. To the fullest extent permitted by law, VTech AI Solutions disclaims warranties not expressly stated here and is not liable for indirect, incidental, or consequential damages arising from platform use.",
      "Questions about these terms can be sent to support@vcollab.com."
    ]
  }
];

export default function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <SEO
        title="Terms of Service"
        description="Review the terms that govern access to VCollab, including content responsibility, moderation, and live collaboration features."
      />

      <section className="legal-hero">
        <div className="container legal-hero__inner reveal-up">
          <span className="legal-eyebrow">Platform Rules</span>
          <h1>Terms of Service</h1>
          <p>
            These terms define how VCollab can be used across public discovery, publishing, messaging, and real-time collaboration.
          </p>
        </div>
      </section>

      <section className="legal-content">
        <div className="container legal-layout">
          <aside className="legal-sidebar">
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "80ms" }}>
              <span className="legal-sidebar-label">Effective Date</span>
              <strong>March 23, 2026</strong>
            </div>
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "140ms" }}>
              <span className="legal-sidebar-label">Operator</span>
              <strong>VTech AI Solutions</strong>
            </div>
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "200ms" }}>
              <span className="legal-sidebar-label">Related Policy</span>
              <Link to={routes.privacy}>Privacy Policy</Link>
            </div>
          </aside>

          <article className="legal-card reveal-up" style={{ "--delay": "120ms" }}>
            <div className="legal-card__intro">
              <p>
                By accessing or using VCollab, you agree to these Terms of Service. If you do not agree, please do not use the platform.
              </p>
            </div>

            {sections.map((section) => (
              <section key={section.title} className="legal-section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}

            <div className="legal-card__closing">
              <p>
                Continued use of VCollab after updates to these terms means you accept the revised version. You can return to the <Link to={routes.landing}>home page</Link> or create an account from the <Link to={routes.register}>registration page</Link>.
              </p>
            </div>
          </article>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
