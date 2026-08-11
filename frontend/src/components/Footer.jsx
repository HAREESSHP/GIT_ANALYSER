import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-tagline">CREATIVITY • INNOVATION • LEADERSHIP • COLLABORATION</div>

      <div className="footer-container">
        <div className="footer-brand">
          <a className="brand-logo" href="https://github.com/HAREESSHP" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
            <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0B0B0B">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.084-.729.084-.729 1.205.084 1.84 1.238 1.84 1.238 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.93 0-1.31.467-2.381 1.235-3.221-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.903-.014 3.297 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </a>

          <p className="brand-desc">
            Analyze any GitHub profile and get deep insights into repositories, statistics, and activity.
          </p>
        </div>

        <div className="footer-contact">
          <h4>CONTACT</h4>
          <ul>
            <li>
              <svg className="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5.5C3 4.67 3.67 4 4.5 4H7c.55 0 1 .45 1 1v2.5c0 .83-.67 1.5-1.5 1.5H6C4.34 9 3 7.66 3 5.5z" stroke="#9FD3FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 18.5c0 .83-.67 1.5-1.5 1.5H18c-.55 0-1-.45-1-1V16.5c0-.83.67-1.5 1.5-1.5H20c1.66 0 3 1.34 3 3v0z" stroke="#9FD3FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="contact-group">
                <a href="tel:+919059332805">+91 90593 32805</a>
                <a href="tel:+919346315298">+91 93463 15298</a>
              </div>
            </li>

            <li>
              <svg className="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6.5h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11z" stroke="#9FD3FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6.5l-10 7L2 6.5" stroke="#9FD3FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="contact-group">
                <a href="mailto:chintit401@gmail.com">chintit401@gmail.com</a>
                <a href="mailto:bagayithiharish@gmail.com">bagayithiharish@gmail.com</a>
              </div>
            </li>

            <li>
              <svg className="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#9FD3FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="2.2" fill="#9FD3FF"/>
              </svg>
              <span>Guru Nanak Institutions, Ibrahimpatnam, RR District, Hyderabad, Telangana 501506</span>
            </li>
          </ul>
        </div>

        <div className="footer-follow">
          <h4>FOLLOW US</h4>

          <div className="socials">
            <a className="social-btn" href="https://www.linkedin.com/in/pavan-sai-varshith" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="Ega Pavan Sai Varshith LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#CFCFCF"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.789-1.75-1.762s.784-1.762 1.75-1.762 1.75.789 1.75 1.762-.784 1.762-1.75 1.762zm13.5 11.268h-3v-5.604c0-1.337-.026-3.058-1.864-3.058-1.866 0-2.152 1.459-2.152 2.966v5.696h-3v-10h2.882v1.367h.041c.401-.758 1.379-1.558 2.84-1.558 3.038 0 3.6 2.001 3.6 4.601v5.59z"/></svg>
            </a>

            <a className="social-btn" href="https://github.com/HAREESSHP" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#CFCFCF"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.51.12-3.15 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 0 1 3.02-.41c1.03.01 2.07.14 3.03.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.85.12 3.15.77.85 1.24 1.93 1.24 3.25 0 4.62-2.82 5.65-5.51 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.88-.01 3.27 0 .32.21.7.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
            </a>

            <a className="social-btn" href="https://www.instagram.com/mr__sky__63?igsh=MWtpaWs0M3Bhd3J5bA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#CFCFCF"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm5.5-3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="credits-text">
          Designed & developed by <a href="https://www.linkedin.com/in/pavan-sai-varshith" target="_blank" rel="noopener noreferrer" className="credit-link">Ega Pavan Sai Varshith</a>, <span className="credit-name">HAREESH</span> & <a href="https://www.linkedin.com/in/rahul-ai-dev" target="_blank" rel="noopener noreferrer" className="credit-link">Rahul</a>
        </p>
        <span className="dot-divider">•</span>
        <p className="credits-text">
          Deployed by <a href="https://www.linkedin.com/in/pavan-sai-varshith" target="_blank" rel="noopener noreferrer" className="credit-link">Ega Pavan Sai Varshith</a>
        </p>
        <span className="dot-divider">•</span>
        <p>&copy; {currentYear} GitHub Insight. All rights reserved.</p>
      </div>
    </footer>
  );
}
