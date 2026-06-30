"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { label: "Who We Are",          hash: "who-we-are"   },
  { label: "Countries",           hash: "countries"    },
  { label: "Universities",        hash: "universities" },
  { label: "Services",            hash: "services"     },
];

const PAGE_LINKS = [
  { label: "Program Finder",      href: "/courses"              },
  { label: "Eligibility Checker", href: "/eligibility-checker"  },
];

export default function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const toggleMenu = () => setIsOpen((o) => !o);
  const closeMenu  = () => setIsOpen(false);

  const navClass = [
    styles.navbarWrapper,
    scrolled ? styles.navbarScrolled : styles.navbarDefault,
  ].join(" ");

  return (
    <nav className={navClass} role="navigation" aria-label="Main navigation">
      <div className={`${styles.navbar} container`}>

        {/* Brand */}
        <Link href="/" className={styles.logoLink} onClick={closeMenu}>
          <Image
            src="/logo.png"
            alt="AZ Consultant Logo"
            width={120}
            height={54}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Desktop Links */}
        <ul className={styles.navLinks} role="list">
          {NAV_LINKS.map(({ label, hash }) => {
            const href = isHome ? `#${hash}` : `/#${hash}`;
            return (
              <li key={hash}>
                <Link href={href} className={styles.navLink} onClick={closeMenu}>
                  {label}
                </Link>
              </li>
            );
          })}

          {PAGE_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navLink} ${pathname === href ? styles.activeNavLink : ""}`}
                onClick={closeMenu}
              >
                {label}
              </Link>
            </li>
          ))}


        </ul>

        {/* Desktop CTA */}
        <div className={styles.navActions}>
          <Link
            href={isHome ? "#become-a-partner" : "/#become-a-partner"}
            className={`${styles.navCta} btn btn-primary btn-sm`}
          >
            Become a Partner ✦
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`${styles.menuToggle} ${isOpen ? styles.menuToggleOpen : ""}`}
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${isOpen ? styles.mobileDrawerOpen : ""}`} aria-hidden={!isOpen}>
        <ul className={styles.mobileNavLinks} role="list">
          {NAV_LINKS.map(({ label, hash }) => {
            const href = isHome ? `#${hash}` : `/#${hash}`;
            return (
              <li key={hash}>
                <Link href={href} className={styles.mobileNavLink} onClick={closeMenu}>
                  {label}
                </Link>
              </li>
            );
          })}
          {PAGE_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.mobileNavLink} ${pathname === href ? styles.mobileActiveNavLink : ""}`}
                onClick={closeMenu}
              >
                {label}
              </Link>
            </li>
          ))}

          <li className={styles.mobileCta}>
            <Link
              href={isHome ? "#become-a-partner" : "/#become-a-partner"}
              className="btn btn-primary"
              onClick={closeMenu}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Become a Partner ✦
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
