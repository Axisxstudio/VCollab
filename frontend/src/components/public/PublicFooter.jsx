import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import { Globe } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
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
          <p><a href="mailto:vijayakumarvithusan@gmail.com" className="lp-footer-contact-link">vijayakumarvithusan@gmail.com</a></p>
          <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
            Admin and Developer <a href="https://vtnport.vercel.app/" target="_blank" rel="noopener noreferrer" className="admin-link">Vithusan V</a>
          </p>
          
          <div className="lp-social-icons">
            <a href="#" aria-label="Facebook">
              <FaFacebook size={18} color="#1877F2" />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram size={18} color="#E1306C" />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedin size={18} color="#0A66C2" />
            </a>
            <a href="https://vtnport.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="Website">
              <Globe size={18} color="#94a3b8" />
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
