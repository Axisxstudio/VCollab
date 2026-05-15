import { Link } from "react-router-dom";
import { CalendarDays, HelpCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import SEO from "../../components/seo/SEO";
import PublicFooter from "../../components/public/PublicFooter";
import { routes } from "../../config/routes";
import "./legal-page.css";

const sections = [
  {
    title: "Information We Collect",
    paragraphs: [
      "VCollab collects the information needed to operate a professional collaboration platform, including account details, profile information, published content, uploaded media, messages, engagement activity, and technical usage data.",
      "When you use real-time features such as messaging, notifications, comments, or collaboration feeds, we also process event data required to deliver those updates reliably across the platform."
    ]
  },
  {
    title: "How We Use Information",
    paragraphs: [
      "We use your information to provide core platform functionality, personalize discovery, support moderation, improve reliability, protect platform security, and deliver real-time collaboration experiences.",
      "We may also use aggregated and de-identified usage patterns to understand platform health, feature adoption, and content quality trends."
    ]
  },
  {
    title: "Sharing and Disclosure",
    paragraphs: [
      "Public content such as projects, posts, blogs, selected profile details, and engagement counts may be visible to other users and, where configured, public visitors.",
      "We do not sell personal information. We may share information with service providers that help us host, secure, analyze, or support the platform, and when required for legal compliance or abuse prevention."
    ]
  },
  {
    title: "Retention and Security",
    paragraphs: [
      "We retain data only as long as it is reasonably necessary for platform operations, legal obligations, dispute resolution, and safety controls. Backup copies and audit records may persist for a limited period after deletion requests.",
      "VCollab applies administrative, technical, and operational safeguards to protect account data, uploaded content, and communication activity, but no internet-based system can guarantee absolute security."
    ]
  },
  {
    title: "Your Choices",
    paragraphs: [
      "You can manage profile information, edit or remove content you own, and contact us to request support related to account access or data concerns.",
      "For privacy questions or requests, contact us at info@axisxstudio.com or 077 453 4056."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <SEO
        title="Privacy Policy"
        description="Learn how VCollab collects, uses, and protects platform data across public discovery and real-time collaboration features."
      />

      <section className="legal-hero">
        <div className="container legal-hero__inner reveal-up">
          <span className="legal-eyebrow">Trust & Privacy</span>
          <h1>Privacy Policy</h1>
          <p>
            This policy explains how VCollab handles account, content, and collaboration data across the platform.
          </p>
          <div className="legal-hero__actions">
            <a href="#legal-document" className="legal-primary-link">Read Policy</a>
            <Link to={routes.terms} className="legal-secondary-link">View Terms</Link>
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
              <ShieldCheck size={18} />
              <div>
                <span className="legal-sidebar-label">Scope</span>
                <strong>Public pages, accounts, content, messaging, and live collaboration features</strong>
              </div>
            </div>
            <div className="legal-sidebar-card reveal-up" style={{ "--delay": "200ms" }}>
              <HelpCircle size={18} />
              <div>
                <span className="legal-sidebar-label">Need Help?</span>
                <a href="mailto:info@axisxstudio.com">info@axisxstudio.com</a>
              </div>
            </div>

            <nav className="legal-toc reveal-up" style={{ "--delay": "260ms" }} aria-label="Privacy policy sections">
              <span className="legal-sidebar-label">On this page</span>
              {sections.map((section, index) => (
                <a key={section.title} href={`#privacy-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article id="legal-document" className="legal-card reveal-up" style={{ "--delay": "120ms" }}>
            <div className="legal-card__masthead">
              <div className="legal-card__icon"><LockKeyhole size={22} /></div>
              <div>
                <span>VCollab Data Notice</span>
                <strong>How privacy is handled across the platform</strong>
              </div>
            </div>

            <div className="legal-card__intro">
              <p>
                VCollab is operated by AxisX Studio to support student collaboration, public discovery, and professional portfolio building. By using the platform, you acknowledge the practices described in this Privacy Policy.
              </p>
            </div>

            {sections.map((section, index) => (
              <section key={section.title} id={`privacy-${index + 1}`} className="legal-section">
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
                If you do not agree with this policy, please discontinue use of the platform. You can return to the <Link to={routes.landing}>home page</Link> or review our <Link to={routes.terms}>Terms of Service</Link>.
              </p>
            </div>
          </article>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
