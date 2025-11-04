import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Notice', path: '/notice' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' }
  ];

  const supportLinks = [
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'FAQ', path: '/faq' }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="footer-link" onClick={scrollToTop}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="footer-link" onClick={scrollToTop}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Info</h4>
            <div className="contact-info">
              <div className="contact-item">
                <FaEnvelope />
                <span>jamalpurchamber@gmail.com</span>
              </div>
              <div className="contact-item">
                <FaPhone />
                <span>+8801922348844</span>
              </div>
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>New Bus Terminal Road, BASIC Area, Jamalpur, Dhaka</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY. All rights reserved.</p>
            <div className="footer-bottom-links">
              <Link to="/privacy" className="footer-bottom-link" onClick={scrollToTop}>Privacy</Link>
              <Link to="/terms" className="footer-bottom-link" onClick={scrollToTop}>Terms</Link>
              <Link to="/cookies" className="footer-bottom-link" onClick={scrollToTop}>Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
