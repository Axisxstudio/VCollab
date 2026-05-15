import { Link } from "react-router-dom";
import { Target, Globe, Code, Users, Rocket, ChevronDown } from "lucide-react";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/seo/SEO";
import useRealtimeLandingOverview from "../../hooks/useRealtimeLandingOverview";
import { routes } from "../../config/routes";
import heroImg from "../../assets/VCollab_hero.png";
import "./landing-page.css";
import "./about-page.css";

function StatCard({ label, value, delay }) {
  return (
    <div className="ap-stat-card reveal-up" style={{ "--delay": delay }}>
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  );
}

const faqItems = [
  {
    question: "What is VCollab designed for?",
    answer: "VCollab is a professional collaboration platform where students, developers, and creators can publish projects, share content, connect with others, and grow their work through visible community interaction."
  },
  {
    question: "How do I start using the platform?",
    answer: "Create an account, complete your profile, publish your first project or post, and explore active contributors, updates, and discussions to begin collaborating in the community."
  },
  {
    question: "What kind of content can I publish on VCollab?",
    answer: "Users can publish projects, updates, blogs, technical insights, creative work, and other professional or educational content that supports discovery, collaboration, and learning."
  },
  {
    question: "Who can view the content I share?",
    answer: "Content published to public areas of VCollab can be visible to other users and, in some cases, public visitors. It is best to share only material you are comfortable presenting professionally."
  },
  {
    question: "How does VCollab handle my data?",
    answer: (
      <>
        VCollab uses account details, profile information, published content, and platform activity to operate core features such as discovery, collaboration, and communication. For more detail, review our{" "}
        <Link to={routes.privacy}>Privacy Policy</Link>.
      </>
    )
  },
  {
    question: "Does VCollab own the content I publish?",
    answer: "You remain responsible for the content you publish. By posting on the platform, you allow VCollab to display and distribute that content within the service according to platform policies and applicable terms."
  },
  {
    question: "Where can I read the platform rules and policies?",
    answer: (
      <>
        Our <Link to={routes.privacy}>Privacy Policy</Link> and{" "}
        <Link to={routes.terms}>Terms of Service</Link> explain how the platform handles data, content responsibilities, and the rules that apply when using VCollab.
      </>
    )
  }
];

export default function AboutPage() {
  const { data, isLoading } = useRealtimeLandingOverview();
  const stats = data?.stats || {};

  return (
    <div className="ap">
      <SEO
        title="About VCollab"
        description="Learn how VCollab helps students, developers, and creators collaborate on projects, publish content, and grow in a trusted professional community."
      />

      <section className="ap-hero">
        <div className="ap-hero-bg">
          <img src={heroImg} alt="VCollab Abstract" />
          <div className="ap-hero-gradient"></div>
        </div>
        <div className="container ap-hero-content">
          <h1>
            A Professional Platform for <span className="ap-accent">Builders and Creators</span>
          </h1>
          <p>
            VCollab helps students, developers, and creators collaborate on projects, publish content, find trusted support, and grow together through real-time community interaction.
          </p>
        </div>
      </section>

      <section className="ap-stats-section">
        <div className="container ap-stats-grid">
          <StatCard label="Live Projects" value={isLoading ? "..." : stats.projectCount || 0} delay="100ms" />
          <StatCard label="Active Members" value={isLoading ? "..." : (stats.userCount ?? stats.contributorCount) || 0} delay="200ms" />
          <StatCard label="Contributors" value={isLoading ? "..." : stats.contributorCount || 0} delay="300ms" />
          <StatCard label="Posts & Blogs" value={isLoading ? "..." : (stats.postCount || 0) + (stats.blogCount || 0)} delay="400ms" />
        </div>
      </section>

      <section className="ap-story-section">
        <div className="container">
          <div className="ap-story-inner reveal-up" style={{ "--delay": "80ms" }}>
            <div className="ap-story-header">
              <h2>Why <span className="ap-accent">VCollab</span></h2>
            </div>
            <div className="ap-story-body">
              <p>
                Developed by <strong>AxisX Studio</strong>, VCollab was designed to make project collaboration more trusted, visible, and practical for people building real work.
              </p>
              <p>
                Instead of leaving projects, ideas, and useful content scattered across chats, drives, and short-lived submissions, VCollab brings collaboration, publishing, and discovery into one professional platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ap-pillars-section">
        <div className="container">
          <div className="ap-pillars-header reveal-up" style={{ "--delay": "80ms" }}>
            <h2>Our Core <span className="ap-accent">Pillars</span></h2>
            <p>The principles shaping how the platform grows.</p>
          </div>

          <div className="ap-pillars-grid">
            <div className="ap-pillar-card reveal-up" style={{ "--delay": "120ms" }}>
              <div className="ap-pillar-icon"><Target size={32} /></div>
              <h3>Our Mission</h3>
              <p>To give students, developers, and creators a professional environment where they can collaborate on projects, publish content, and find trusted support.</p>
            </div>

            <div className="ap-pillar-card reveal-up" style={{ "--delay": "180ms" }}>
              <div className="ap-pillar-icon"><Globe size={32} /></div>
              <h3>Our Vision</h3>
              <p>To build a connected ecosystem where ideas, projects, and knowledge can grow through visibility, contribution, and real-time community interaction.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ap-features-section">
        <div className="container">
          <div className="ap-features-header reveal-up" style={{ "--delay": "80ms" }}>
            <h2>A Platform Designed For <span className="ap-accent">Scale</span></h2>
          </div>

          <div className="ap-features-grid">
            <div className="ap-feature reveal-up" style={{ "--delay": "120ms" }}>
              <div className="ap-feature-icon-wrapper"><Code size={24} /></div>
              <h4>Collaborate on Projects</h4>
              <p>Work together on project ideas, active builds, and technical challenges with people who can contribute, guide, and improve outcomes.</p>
            </div>

            <div className="ap-feature reveal-up" style={{ "--delay": "180ms" }}>
              <div className="ap-feature-icon-wrapper"><Users size={24} /></div>
              <h4>Publish and Showcase Content</h4>
              <p>Share projects, updates, blogs, and useful content in one place so your work stays visible, organized, and discoverable.</p>
            </div>

            <div className="ap-feature reveal-up" style={{ "--delay": "240ms" }}>
              <div className="ap-feature-icon-wrapper"><Rocket size={24} /></div>
              <h4>Grow With Trusted Support</h4>
              <p>Connect with a credible community, get real-time feedback, and use optional expert help when a project needs deeper support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ap-faq-section">
        <div className="container">
          <div className="ap-faq-header reveal-up" style={{ "--delay": "80ms" }}>
            <h2>Platform <span className="ap-accent">Questions</span></h2>
            <p>Clear answers about how VCollab works, what users can publish, and how data and policies are handled.</p>
          </div>

          <div className="ap-faq-grid">
            {faqItems.map((item, index) => (
              <details key={item.question} className="ap-faq-item reveal-up" style={{ "--delay": `${120 + index * 50}ms` }}>
                <summary className="ap-faq-question">
                  <div className="ap-faq-question-copy">
                    <span className="ap-faq-label">Q</span>
                    <h3>{item.question}</h3>
                  </div>
                  <ChevronDown size={18} className="ap-faq-chevron" />
                </summary>
                <div className="ap-faq-answer">
                  <span className="ap-faq-answer-label">A</span>
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ap-cta">
        <div className="container ap-cta-box reveal-up" style={{ "--delay": "120ms" }}>
          <h2>Build, Share, and Grow With Confidence</h2>
          <p>VCollab is built for people who want more than just posting content. It is designed for meaningful work, real collaboration, and visible progress.</p>
          <Link to={routes.register} className="ap-btn-cta">Create Your Free Account</Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
