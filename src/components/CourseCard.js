import Link from "next/link";
import styles from "./CourseCard.module.css";
import TurkeyFlag from "@/components/TurkeyFlag";

export default function CourseCard({ course }) {
  const {
    university,
    level,
    faculty,
    name,
    language,
    duration,
    fee,
    original_fee,
    discount_fee,
    campus
  } = course;

  const formatPrice = (val) => {
    if (val === null || val === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  const feeVal = fee !== null && fee !== undefined ? fee : discount_fee;
  let discountPercent = 0;
  if (original_fee && feeVal && original_fee > feeVal) {
    discountPercent = Math.round(((original_fee - feeVal) / original_fee) * 100);
  }

  // Level color indicator
  const levelColor = {
    "Associate":     { bg: "rgba(245,158,11,0.12)",  color: "#fcd34d",              border: "rgba(245,158,11,0.25)" },
    "Undergraduate": { bg: "rgba(0,175,185,0.12)",   color: "var(--color-secondary-light)", border: "rgba(0,175,185,0.25)" },
    "Master's":      { bg: "rgba(139,92,246,0.12)",  color: "#c4b5fd",              border: "rgba(139,92,246,0.25)" },
    "PhD":           { bg: "rgba(239,68,68,0.1)",    color: "#fca5a5",              border: "rgba(239,68,68,0.22)" },
  };
  const lvlStyle = levelColor[level] || levelColor["Undergraduate"];

  const applyUrl = `/eligibility-checker?university=${encodeURIComponent(university)}&program=${encodeURIComponent(name)}&level=${encodeURIComponent(level)}`;

  return (
    <div className={`${styles.card} glass glass-hover`}>
      {/* Accent border top */}
      <div className={styles.accentBar} />

      {/* Discount badge */}
      {discountPercent > 0 && (
        <div className={styles.discountBadge}>
          <span className={styles.discountFire}>🔥</span>
          Save {discountPercent}%
        </div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h4 className={styles.programName}>{name}</h4>
          <span className={styles.universityName}>
            <span className={styles.uniIcon}>🏛</span>
            {university}
          </span>
          {faculty && <span className={styles.facultyName}>{faculty}</span>}
        </div>
      </div>

      {/* Badges */}
      <div className={styles.badges}>
        <span
          className={styles.levelBadge}
          style={{ background: lvlStyle.bg, color: lvlStyle.color, border: `1px solid ${lvlStyle.border}` }}
        >
          {level}
        </span>
        <span className="badge badge-dark-teal">
          {language === "English" ? "🇬🇧 " : language === "Turkish" ? <TurkeyFlag style={{ width: "16px", height: "12px", marginRight: "4px", boxShadow: "none" }} /> : "🌐 "}
          {language}
        </span>
        {campus && <span className="badge badge-gray">📍 {campus}</span>}
      </div>

      {/* Details row */}
      <div className={styles.detailsRow}>
        <div className={styles.detailChip}>
          <span className={styles.detailChipIcon}>⏱</span>
          <span>{duration ? `${duration} yrs` : "N/A"}</span>
        </div>
        <div className={styles.detailChip}>
          <span className={styles.detailChipIcon}>✓</span>
          <span>Accredited</span>
        </div>
        <div className={styles.detailChip}>
          <span className={styles.detailChipIcon}>🎓</span>
          <span>Bologna</span>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div className={styles.priceArea}>
        <div className={styles.fees}>
          {original_fee && original_fee > (feeVal || 0) && (
            <span className={styles.originalFee}>{formatPrice(original_fee)}</span>
          )}
          <div className={styles.feeRow}>
            <span className={styles.actualFee}>{formatPrice(feeVal)}</span>
            {feeVal !== null && <span className={styles.feePeriod}>/year</span>}
          </div>
        </div>

        <Link href={applyUrl} className={`${styles.applyBtn} btn btn-primary btn-sm`}>
          Apply Now →
        </Link>
      </div>
    </div>
  );
}
