"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";

/* ─────────────────────────────────────────────────────────────
   Scroll-reveal hook — adds .visible to elements with .reveal
───────────────────────────────────────────────────────────── */
function useScrollReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
}

/* ─────────────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const duration = 1800;
          const start = performance.now();
          const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            const current = eased * numericTarget;
            setCount(
              numericTarget % 1 === 0
                ? Math.floor(current)
                : Math.round(current * 10) / 10
            );
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   University icons map
───────────────────────────────────────────────────────────── */
const UNI_ICONS = ["🏛️", "🎓", "🔬", "🏥", "⚕️", "💡", "🌐", "🛰️", "🧬", "⚖️", "🏗️", "🎨", "🌍", "📐", "🔭", "🧪", "🎯"];
import TurkeyFlag from "@/components/TurkeyFlag";

function UniversityModal({ universityName, onClose, courses = [] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);

  const universityCourses = useMemo(() => {
    return courses.filter((c) => c.university === universityName);
  }, [universityName, courses]);

  // Extract campuses
  const campuses = useMemo(() => {
    const set = new Set(universityCourses.map((c) => c.campus).filter(Boolean));
    return set.size > 0 ? Array.from(set) : ["Main Campus"];
  }, [universityCourses]);

  // Extract instructional languages
  const languages = useMemo(() => {
    return Array.from(new Set(universityCourses.map((c) => c.language).filter(Boolean)));
  }, [universityCourses]);

  // Extract academic levels
  const levels = useMemo(() => {
    return Array.from(new Set(universityCourses.map((c) => c.level).filter(Boolean)));
  }, [universityCourses]);

  // Compute tuition fee range
  const feeRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    universityCourses.forEach((c) => {
      const feeVal = c.fee !== null ? c.fee : c.discount_fee;
      if (feeVal !== null && feeVal !== undefined) {
        if (feeVal < min) min = feeVal;
        if (feeVal > max) max = feeVal;
      }
    });
    return {
      min: min === Infinity ? null : min,
      max: max === -Infinity ? null : max,
    };
  }, [universityCourses]);

  // Filter logic
  const filtered = useMemo(() => {
    return universityCourses.filter((c) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.faculty && c.faculty.toLowerCase().includes(term));
      const matchesLevel = level === "All" || c.level === level;
      return matchesSearch && matchesLevel;
    });
  }, [universityCourses, search, level]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [search, level]);

  // Escape key close & scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const formatPrice = (val) => {
    if (val === null || val === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const visibleCourses = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={`${styles.modalContainer} glass`} onClick={(e) => e.stopPropagation()}>
        
        {/* Left Pane: Info & Stats */}
        <div className={styles.modalLeftPane}>
          <div className={styles.modalUniHeader}>
            <div className={styles.modalUniIconCircle}>🏛️</div>
            <div>
              <h2 className={styles.modalUniTitle}>{universityName}</h2>
              <span className={styles.modalUniLoc}>📍 Istanbul, Turkey</span>
            </div>
          </div>

          <p className={styles.modalUniDesc}>
            Accredited high-tier private university partnering with AZ Consultant. 
            Enjoy pre-approved scholarship rates, direct application corridor, 
            and conditional offers issued in 24-72 hours.
          </p>

          <div className={styles.modalStatsList}>
            <div className={styles.modalStatItem}>
              <span className={styles.modalStatLabel}>Total Programs</span>
              <span className={styles.modalStatValue}>{universityCourses.length}</span>
            </div>
            
            <div className={styles.modalStatItem}>
              <span className={styles.modalStatLabel}>Instruction Languages</span>
              <span className={styles.modalStatValue}>{languages.join(" & ") || "English"}</span>
            </div>

            <div className={styles.modalStatItem}>
              <span className={styles.modalStatLabel}>Campuses</span>
              <span className={styles.modalStatValue} title={campuses.join(", ")}>
                {campuses.slice(0, 2).join(", ")}{campuses.length > 2 ? "..." : ""}
              </span>
            </div>

            <div className={styles.modalStatItem}>
              <span className={styles.modalStatLabel}>Fee Range</span>
              <span className={styles.modalStatValue}>
                {feeRange.min !== null
                  ? `${formatPrice(feeRange.min)} - ${formatPrice(feeRange.max)}/yr`
                  : "Undisclosed"}
              </span>
            </div>
          </div>

          <div className={styles.modalLevelsBox}>
            <span className={styles.modalStatLabel} style={{ marginBottom: 8, display: "block" }}>Available Degrees</span>
            <div className={styles.modalLevelPills}>
              {levels.map((lvl) => (
                <span key={lvl} className="badge badge-teal">{lvl}</span>
              ))}
            </div>
          </div>

          <Link
            href={`/eligibility-checker?university=${encodeURIComponent(universityName)}`}
            className="btn btn-secondary"
            style={{ marginTop: "auto", display: "block", textAlign: "center" }}
            onClick={onClose}
          >
            Apply to University
          </Link>
        </div>

        {/* Right Pane: Course Catalog */}
        <div className={styles.modalRightPane}>
          {/* Header controls */}
          <div className={styles.modalCatalogHeader}>
            <div>
              <h3 className={styles.modalCatalogTitle}>Course Catalog</h3>
              <span className={styles.modalCatalogSubtitle}>
                Showing {filtered.length} of {universityCourses.length} courses
              </span>
            </div>
            <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>

          {/* Search and filter toolbar */}
          <div className={styles.modalToolbar}>
            <div className={styles.modalSearchBox}>
              <span className={styles.modalSearchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search programs or faculties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.modalSearchInput}
              />
              {search && (
                <button className={styles.modalClearBtn} onClick={() => setSearch("")}>
                  ✕
                </button>
              )}
            </div>

            <div className={styles.modalLevelFilter}>
              {["All", "Associate", "Undergraduate", "Master's", "PhD"].map((lvl) => (
                <button
                  key={lvl}
                  className={`${styles.modalFilterTab} ${level === lvl ? styles.modalFilterTabActive : ""}`}
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Course Grid */}
          <div className={styles.modalCourseListScroll}>
            {visibleCourses.length > 0 ? (
              <div className={styles.modalCourseGrid}>
                {visibleCourses.map((c, i) => {
                  const feeVal = c.fee !== null ? c.fee : c.discount_fee;
                  const originalFee = c.original_fee;
                  let discountPercent = 0;
                  if (originalFee && feeVal && originalFee > feeVal) {
                    discountPercent = Math.round(((originalFee - feeVal) / originalFee) * 100);
                  }

                  return (
                    <div key={i} className={styles.modalCourseCard}>
                      <div className={styles.modalCourseHeader}>
                        <h4 className={styles.modalCourseName}>{c.name}</h4>
                        {c.faculty && <span className={styles.modalCourseFaculty}>{c.faculty}</span>}
                      </div>

                      <div className={styles.modalCourseMeta}>
                        <span className="badge badge-teal">{c.level}</span>
                        <span className="badge badge-dark-teal">{c.language}</span>
                        {c.duration && <span className="badge badge-gray">⏱ {c.duration} yrs</span>}
                      </div>

                      <div className={styles.modalCourseFooter}>
                        <div className={styles.modalCoursePricing}>
                          {originalFee && originalFee > feeVal && (
                            <span className={styles.modalCourseOriginalFee}>{formatPrice(originalFee)}</span>
                          )}
                          <span className={styles.modalCourseActualFee}>
                            {formatPrice(feeVal)}
                            {feeVal !== null && <span className={styles.modalCourseFeePeriod}>/yr</span>}
                          </span>
                        </div>
                        <Link
                          href={`/eligibility-checker?university=${encodeURIComponent(universityName)}&program=${encodeURIComponent(c.name)}&level=${encodeURIComponent(c.level)}`}
                          className={`${styles.modalCourseApplyBtn} btn btn-primary btn-sm`}
                          onClick={onClose}
                        >
                          Select
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.modalNoResults}>
                <span className={styles.modalNoResultsIcon}>🎓</span>
                <p>No programs match your search or filter criteria.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setLevel("All");
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Pagination Loader */}
            {hasMore && (
              <div className={styles.modalLoadMoreContainer}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                >
                  Load More Programs
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [courses, setCourses] = useState([]);

  useScrollReveal([courses]);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch((err) => console.error("Error loading dynamic courses:", err));
  }, []);

  const activeCourses = courses;

  // derive partner universities from data
  const partnerUniversities = useMemo(() => {
    const counts = {};
    activeCourses.forEach((c) => {
      counts[c.university] = (counts[c.university] || 0) + 1;
    });
    return Object.keys(counts)
      .map((name) => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count);
  }, [activeCourses]);

  const [selectedUni, setSelectedUni] = useState(null);

  // B2B partner form state
  const [form, setForm] = useState({
    agencyName: "", directorName: "", email: "",
    phone: "", country: "", volume: "1-10", message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.directorName,
          email: form.email,
          phone: form.phone,
          level: "B2B Partner Request",
          program: form.agencyName,
          message: `Agency B2B Application Details:\n- Agency Name: ${form.agencyName}\n- Operational Country: ${form.country}\n- Anticipated Yearly Student Volume: ${form.volume}\n- Agency Profile: ${form.message}`,
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ agencyName: "", directorName: "", email: "", phone: "", country: "", volume: "1-10", message: "" });
      } else {
        const d = await res.json();
        setError(d.error || "Submission failed.");
      }
    } catch {
      setError("Connection error. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "relative", overflowX: "hidden" }}>

      {/* ── AMBIENT GLOW BLOBS ── */}
      <div className="glow-bg pulse-glow" style={{ width: 600, height: 600, top: "10%", left: "60%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(0,175,185,0.18) 0%, transparent 70%)" }} />
      <div className="glow-bg pulse-glow" style={{ width: 500, height: 500, top: "50%", left: "-10%", background: "radial-gradient(circle, rgba(14,93,117,0.2) 0%, transparent 70%)", animationDelay: "3s" }} />
      <div className="glow-bg pulse-glow" style={{ width: 400, height: 400, top: "80%", right: "-8%", background: "radial-gradient(circle, rgba(28,229,242,0.1) 0%, transparent 70%)", animationDelay: "5s" }} />

      {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={`${styles.heroContent} container`}>

          <div className={styles.heroTagline}>
            Official Master Recruiter for Turkish Higher Education
          </div>

          <h1 className={styles.heroTitle}>
            Scale Your Agency with Top&nbsp;Turkish&nbsp;University Partnerships
          </h1>

          <p className={styles.heroDesc}>
            Join the <strong style={{ color: "#fff" }}>AZ Consultant</strong> sub-agent network.
            Get direct registrar access, authorized scholarship pricing, fast 72-hour offer letters,
            and full visa guidance, completely free of operational cost.
          </p>

          <div className={styles.heroActions}>
            <a href="#become-a-partner" className={`${styles.heroBtn} btn btn-primary`}>
              Become a Partner Agent ✦
            </a>
            <a href="#services" className={`${styles.heroBtn} btn btn-secondary`}>
              Explore Services
            </a>
          </div>

          <div className={styles.heroBadges}>
            {["17 Partner Universities", "1,950+ Programs", "Zero Fees to Agencies", "72hr Offer Letters"].map((t) => (
              <div key={t} className={styles.heroBadgeItem}>
                <span className={styles.heroBadgeCheck}>✦</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHO WE ARE
      ════════════════════════════════════════════════════════ */}
      <section id="who-we-are" className={styles.section}>
        <div className="container">
          <div className={styles.whoWeAreGrid}>

            {/* Text column */}
            <div className={`${styles.whoText} reveal`}>
              <span className={styles.whoSectionLabel}>About Us</span>
              <h2 className={styles.whoTitle}>
                Who <span>We Are</span>
              </h2>
              <p className={styles.whoDesc}>
                <strong style={{ color: "#fff" }}>AZ Consultant</strong> is a certified higher education master recruiter headquartered in Istanbul.
                We act as a direct liaison between university admission boards and local recruitment agents across Asia, Africa, and the Middle East.
              </p>
              <p className={styles.whoDesc}>
                Our partner agencies bypass slow bureaucratic processes — receive conditional offer letters in hours,
                get embassy-ready document checklists, and earn transparent commission splits on every enrolled student.
              </p>
            </div>

            {/* Stat cards */}
            <div className={`${styles.whoCards} reveal`} style={{ transitionDelay: "0.15s" }}>
              {[
                { val: "17", suffix: "", label: "Partner Universities" },
                { val: "1950", suffix: "+", label: "Available Courses" },
                { val: "100", suffix: "%", label: "Free Counselling" },
                { val: "72", suffix: "hr", label: "Avg. Offer Return" },
              ].map(({ val, suffix, label }) => (
                <div key={label} className={`${styles.whoCard} glass glass-hover`}>
                  <div className={styles.whoCardVal}>
                    <AnimatedCounter target={val} suffix={suffix} />
                  </div>
                  <div className={styles.whoCardLabel}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider} />

      {/* ════════════════════════════════════════════════════════
          COUNTRIES COVERED
      ════════════════════════════════════════════════════════ */}
      <section id="countries" className={`${styles.section} ${styles.darkSection}`}>
        <div className="container">
          <div className={`section-header reveal`}>
            <span className="section-label">Coverage</span>
            <h2 className="section-title">Countries Covered</h2>
            <p className="section-desc">
              We specialize in Turkey — Europe's fastest growing destination for international students.
            </p>
            <div className="divider" />
          </div>

          <div className={`${styles.countryCard} glass reveal`} style={{ transitionDelay: "0.1s" }}>
            <div className={styles.countryHeader}>
              <div className={styles.countryHeaderText}>
                <h3 className={styles.countryName} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  Republic of Turkey <TurkeyFlag style={{ width: "32px", height: "24px", boxShadow: "none" }} />
                </h3>
                <p className={styles.countrySubtitle}>Bologna-compliant degrees • No mandatory IELTS • EU-recognized</p>
              </div>
              <span className={`${styles.countryFlag} animate-float`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TurkeyFlag style={{ width: "64px", height: "48px", boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }} />
              </span>
            </div>

            {/* Country stats strip */}
            <div className={styles.countryStats}>
              {[
                { val: "200+", label: "Universities Nationwide" },
                { val: "36", label: "Countries Sending Students" },
                { val: "$350", label: "Avg Monthly Living Cost" },
                { val: "100%", label: "Bologna ECTS Compatible" },
              ].map(({ val, label }) => (
                <div key={label} className={styles.countryStat}>
                  <span className={styles.countryStatVal}>{val}</span>
                  <span className={styles.countryStatLabel}>{label}</span>
                </div>
              ))}
            </div>

            <ul className={styles.countryBenefitsList}>
              {[
                { title: "Bologna Process", desc: "ECTS credits transfer seamlessly to UK, EU, or North American institutions." },
                { title: "No Mandatory IELTS", desc: "Universities accept internal English tests or offer a pre-sessional language prep year." },
                { title: "Low Living Costs", desc: "Students comfortably live on $300–$500/month including housing and dining." },
                { title: "Direct Visa Corridor", desc: "Simplified documentation backed by official agency support letters from AZ Consultant." },
                { title: "English-Medium Degrees", desc: "Hundreds of fully English-taught programs across engineering, medicine, and business." },
                { title: "Post-Study Options", desc: "Turkey residency permits and EU proximity create multiple post-graduation pathways." },
              ].map(({ title, desc }) => (
                <li key={title} className={styles.countryBenefitItem}>
                  <span className={styles.countryBenefitCheck}>✓</span>
                  <div>
                    <span className={styles.countryBenefitTitle}>{title}</span>
                    {desc}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider} />

      {/* ════════════════════════════════════════════════════════
          PARTNER UNIVERSITIES
      ════════════════════════════════════════════════════════ */}
      <section id="universities" className={styles.section}>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Our Network</span>
            <h2 className="section-title">Partner Universities</h2>
            <p className="section-desc">
              Direct registrar access and verified discount pricing at 17 accredited Turkish universities.
            </p>
            <div className="divider" />
          </div>

          <div className={styles.uniGrid}>
            {partnerUniversities.length > 0 ? (
              partnerUniversities.map((uni, idx) => (
                <div
                  key={uni.name}
                  className={`${styles.uniCard} glass glass-hover reveal`}
                  style={{ transitionDelay: `${(idx % 6) * 0.07}s`, cursor: "pointer" }}
                  onClick={() => setSelectedUni(uni.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedUni(uni.name);
                    }
                  }}
                >
                  <span className={styles.uniIndexBadge}>{String(idx + 1).padStart(2, "0")}</span>

                  <div className={styles.uniIconCircle}>
                    {UNI_ICONS[idx % UNI_ICONS.length]}
                  </div>

                  <h3 className={styles.uniTitle}>{uni.name}</h3>

                  <div className={styles.uniMeta}>
                    <span className={styles.uniLoc}>📍 Istanbul, Turkey</span>
                    <div className={styles.uniStatRow}>
                      <span className={styles.uniStat}>{uni.count} Programs Available</span>
                      <span className="badge badge-teal">Partner</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className={`${styles.uniCard} glass`} style={{ opacity: 0.6, minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ height: 20, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ height: 14, width: "40%", background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider} />

      {/* ════════════════════════════════════════════════════════
          SERVICES FOR CONSULTANTS
      ════════════════════════════════════════════════════════ */}
      <section id="services" className={`${styles.section} ${styles.darkSection}`}>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">What You Get</span>
            <h2 className="section-title">Services for Consultants</h2>
            <p className="section-desc">
              Everything a sub-agent needs to convert international students efficiently and profitably.
            </p>
            <div className="divider" />
          </div>

          <div className={styles.servicesGrid}>
            {[
              {
                icon: "💼",
                title: "Lucrative Commission Splits",
                desc: "Transparent commission schedules with verified amounts per enrolled student. Timely payouts, zero hidden deductions.",
              },
              {
                icon: "⚡",
                title: "72-Hour Fast-Track Offers",
                desc: "Direct pipeline to registrar offices returns conditional offer letters within 24 to 72 business hours on complete files.",
              },
              {
                icon: "🛂",
                title: "Full Visa Consultation",
                desc: "Our embassy liaison team reviews documents, prepares checklists, and coaches students for consulate interviews.",
              },
              {
                icon: "📄",
                title: "White-Label Catalogues",
                desc: "Access agency-specific fee tables, scholarship matrices, and branded marketing kits for your student briefings.",
              },
            ].map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className={`${styles.serviceCard} glass glass-hover reveal`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={styles.serviceIconWrap}>{icon}</div>
                <h3 className={styles.serviceTitle}>{title}</h3>
                <p className={styles.serviceDesc}>{desc}</p>
                <span className={styles.serviceArrow}>Learn More →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider} />

      {/* ════════════════════════════════════════════════════════
          BECOME A PARTNER
      ════════════════════════════════════════════════════════ */}
      <section id="become-a-partner" className={`${styles.section} ${styles.formSection}`}>
        <div className="container">
          <div className={styles.formLayoutGrid}>

            {/* Left info */}
            <div className={`${styles.formInfoSide} reveal`}>
              <span className="section-label" style={{ width: "fit-content" }}>Join Our Network</span>
              <h2 className={styles.formInfoTitle}>
                Start Earning With Our <span>Partner Program</span>
              </h2>
              <p className={styles.formInfoDesc}>
                Complete the form with your agency details. Our B2B relations team will respond within
                24 hours with the sub-agency contract, commission structure, and catalog access credentials.
              </p>

              <ul className={styles.benefitsList}>
                {[
                  "Receive an agency agreement within 24 hours",
                  "Access live scholarship discount pricing sheets",
                  "Get dedicated WhatsApp B2B support line",
                  "Earn commissions on every enrolled student",
                  "Access 1,950+ programs across 17 universities",
                ].map((b) => (
                  <li key={b} className={styles.benefitItem}>
                    <span className={styles.benefitCheck}>✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right form card */}
            <div className={`${styles.formCard} glass reveal`} style={{ transitionDelay: "0.15s" }}>
              {success ? (
                <div className={styles.formSuccess}>
                  <div className={styles.successIconRing}>✓</div>
                  <h3 className={styles.successTitle}>Application Submitted!</h3>
                  <p className={styles.successDesc}>
                    Your agency partnership request has been received. Our B2B officer will send the
                    contract agreement to your email within 24 hours.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8 }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className={styles.formTitle}>Become a Partner Agent</h3>

                  <div className="form-group">
                    <label className="form-label" htmlFor="agencyName">Agency / Company Name</label>
                    <input id="agencyName" name="agencyName" type="text" required
                      placeholder="e.g. Paramount Education Services"
                      className="input-field" value={form.agencyName} onChange={handleChange} />
                  </div>

                  <div className="grid grid-2 gap-sm" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="directorName">Director / Contact</label>
                      <input id="directorName" name="directorName" type="text" required
                        placeholder="e.g. John Doe"
                        className="input-field" value={form.directorName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Official Email</label>
                      <input id="email" name="email" type="email" required
                        placeholder="partnership@agency.com"
                        className="input-field" value={form.email} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-2 gap-sm" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">WhatsApp / Phone</label>
                      <input id="phone" name="phone" type="tel" required
                        placeholder="+1 234 567 890"
                        className="input-field" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="country">Country of Operation</label>
                      <input id="country" name="country" type="text" required
                        placeholder="e.g. Pakistan, Nigeria, UAE"
                        className="input-field" value={form.country} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="volume">Expected Yearly Student Volume</label>
                    <select id="volume" name="volume" className="input-field input-select"
                      value={form.volume} onChange={handleChange}>
                      <option value="1-10">1 – 10 Students / year</option>
                      <option value="11-50">11 – 50 Students / year</option>
                      <option value="51-100">51 – 100 Students / year</option>
                      <option value="100+">100+ Students / year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="message">Agency Profile / Message</label>
                    <textarea id="message" name="message" rows={3}
                      placeholder="Describe your agency's experience and main recruitment channels..."
                      className="input-field" style={{ resize: "none" }}
                      value={form.message} onChange={handleChange} />
                  </div>

                  {error && (
                    <p style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 14, textAlign: "center" }}>
                      ⚠️ {error}
                    </p>
                  )}

                  <button type="submit" disabled={submitting} className={`${styles.submitBtn} btn btn-primary`}>
                    {submitting ? "Submitting…" : "Register as Sub-Agent ✦"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      {selectedUni && (
        <UniversityModal
          universityName={selectedUni}
          onClose={() => setSelectedUni(null)}
          courses={activeCourses}
        />
      )}
    </div>
  );
}
