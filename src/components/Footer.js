import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerWrapper}>
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Image
              src="/logo.png"
              alt="AZ Consultant Logo"
              width={140}
              height={65}
              className={styles.logo}
            />
            <p className={styles.brandDesc}>
              Empowering students globally to discover, compare, and apply to top-tier Turkish universities. 
              Our expert counselling and visa guidance are 100% free of charge.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialIcon} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className={styles.columnTitle}>Services</h3>
            <ul className={styles.linksList}>
              <li><Link href="/courses" className={styles.footerLink}>Browse 1,950+ Courses</Link></li>
              <li><Link href="/eligibility-checker" className={styles.footerLink}>Eligibility Calculator</Link></li>
              <li><a href="#services" className={styles.footerLink}>Free Visa Assistance</a></li>
              <li><a href="#services" className={styles.footerLink}>Scholarship Matching</a></li>
              <li><a href="#services" className={styles.footerLink}>IELTS Test Prep Support</a></li>
            </ul>
          </div>

          {/* Featured Universities Column */}
          <div>
            <h3 className={styles.columnTitle}>Top Universities</h3>
            <ul className={styles.linksList}>
              <li><Link href="/courses?university=Bahçeşehir+University+(BAU)" className={styles.footerLink}>Bahçeşehir University</Link></li>
              <li><Link href="/courses?university=Istanbul+Medipol+University" className={styles.footerLink}>Istanbul Medipol University</Link></li>
              <li><Link href="/courses?university=Istanbul+Aydın+University" className={styles.footerLink}>Istanbul Aydın University</Link></li>
              <li><Link href="/courses?university=Istinye+University" className={styles.footerLink}>Istinye University</Link></li>
              <li><Link href="/courses?university=Atlas+University" className={styles.footerLink}>Atlas University</Link></li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div>
            <h3 className={styles.columnTitle}>Get in Touch</h3>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>✉</span>
              <span>info@azconsultant.com</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>☎</span>
              <div className={styles.contactDetails}>
                <span>Pakistan: +92 306 5394346</span>
                <span>Turkey: +90 551 470 10 75</span>
              </div>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <span>B-104, Bina No. 12, Hilal Konutları, Safa Caddesi, Şehli Mahallesi, Pendik, Istanbul</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyText}>
            © {currentYear} AZ Consultant. All rights reserved.
          </p>
          <p className={styles.disclaimerText}>
            Disclaimer: AZ Consultant is an authorized representative of partner Turkish higher education institutions. 
            All application processing, scholarship verification, and initial visa consultation services are sponsored 
            by our partner universities and offered completely free of charge to students.
          </p>
        </div>
      </div>
    </footer>
  );
}
