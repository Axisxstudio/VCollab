import { Link } from "react-router-dom";
import { CalendarDays, FileCheck2, HelpCircle, Scale } from "lucide-react";
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
      "VCollab is provided on an as-available basis. To the fullest extent permitted by law, AxisX Studio disclaims warranties not expressly stated here and is not liable for indirect, incidental, or consequential damages arising from platform use.",
      "Questions about these terms can be sent to info@axisxstudio.com or 077 453 4056."
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
          <div className="legal-hero__actions">
            <a href="#legal-document" className="legal-primary-link">Read Terms</a>
            <Link to={routes.privacy} className="legal-secondary-link">View Privacy Policy</Link>
          </div>
        </div>
      </section>

      <section className="legal-content">
        <div className="container legal-layout">
          <aside className="legal-sidebar">
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "80ms" }}>
              <CalendarDays size={18} />
              <div>
                <span className="legal-sidebar-label">Effective Date</span>
                <strong>March 23, 2026</strong>
              </div>
            </div>
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "140ms" }}>
              <Scale size={18} />
              <div>
                <span className="legal-sidebar-label">Operator</span>
                <strong>AxisX Studio</strong>
              </div>
            </div>
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "200ms" }}>
              <HelpCircle size={18} />
              <div>
                <span className="legal-sidebar-label">Related Policy</span>
                <Link to={routes.privacy}>Privacy Policy</Link>
              </div>
            </div>

            <nav className="legal-toc reveal-up" style={{ "--delay": "260ms" }} aria-label="Terms of service sections">
              <span className="legal-sidebar-label">On this page</span>
              {sections.map((section, index) => (
                <a key={section.title} href={`#terms-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article id="legal-document" className="legal-card reveal-up" style={{ "--delay": "120ms" }}>
            <div className="legal-card__masthead">
              <div className="legal-card__icon"><FileCheck2 size={22} /></div>
              <div>
                <span>VCollab Service Agreement</span>
                <strong>The rules for using the platform responsibly</strong>
              </div>
            </div>

            <div className="legal-card__intro">
              <p>
                By accessing or using VCollab, you agree to these Terms of Service. If you do not agree, please do not use the platform.
              </p>
            </div>

            {sections.map((section, index) => (
              <section key={section.title} id={`terms-${index + 1}`} className="legal-section">
                <div className="legal-section__heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title}</h2>
                </div>
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
