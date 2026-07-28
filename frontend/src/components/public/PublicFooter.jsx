import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import { Facebook, Instagram, Linkedin, Globe } from "lucide-react";
import logoImg from "../../assets/logo.png";

export default function PublicFooter() {
  return (
    <footer className="lp-footer">
      <div className="container lp-footer-grid">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <img src={logoImg} alt="VCollab" />
            <span>VCollab</span>
          </div>
          <p>The professional platform for projects, content, and trusted collaboration.</p>
        </div>

        <div>
          <h4>Platform</h4>
          <ul>
            <li><Link to={routes.resources}>Resources</Link></li>
            <li><Link to={routes.projects}>Explore Projects</Link></li>
            <li><Link to={routes.posts}>Latest Posts</Link></li>
            <li><Link to={routes.blogs}>Blogs</Link></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to={routes.about}>About Us</Link></li>
            <li><Link to={routes.privacy}>Privacy Policy</Link></li>
            <li><Link to={routes.terms}>Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <p><a href="mailto:info@vcollab.com" className="lp-footer-contact-link">info@vcollab.com</a></p>
          
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <a href="#" aria-label="Facebook" className="lp-footer-contact-link">
              <Facebook size={20} />
            </a>
            <a href="#" aria-label="Instagram" className="lp-footer-contact-link">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="LinkedIn" className="lp-footer-contact-link">
              <Linkedin size={20} />
            </a>
            <a href="#" aria-label="Website" className="lp-footer-contact-link">
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div className="container">&copy; {new Date().getFullYear()} VCollab. All rights reserved.</div>
      </div>
    </footer>
  );
}
