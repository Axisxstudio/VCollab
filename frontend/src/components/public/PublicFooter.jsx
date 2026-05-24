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
          <p><a href="mailto:info@axisxstudio.com" className="lp-footer-contact-link">info@axisxstudio.com</a></p>
          <p><a href="tel:0774534056" className="lp-footer-contact-link">077 453 4056</a></p>
          <p><a href="https://axisxstudio.com/" target="_blank" rel="noreferrer" className="lp-footer-contact-link">axisxstudio.com</a></p>
          
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <a href="https://www.facebook.com/axisxstudio" target="_blank" rel="noreferrer" aria-label="Facebook" className="lp-footer-contact-link">
              <Facebook size={20} />
            </a>
            <a href="https://www.instagram.com/axisxstudio/" target="_blank" rel="noreferrer" aria-label="Instagram" className="lp-footer-contact-link">
              <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/company/axisxstudio/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="lp-footer-contact-link">
              <Linkedin size={20} />
            </a>
            <a href="https://axisxstudio.com/" target="_blank" rel="noreferrer" aria-label="Website" className="lp-footer-contact-link">
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div className="container">&copy; {new Date().getFullYear()} Developed by AxisX Studio. All rights reserved.</div>
      </div>
    </footer>
  );
}
