"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import styles from "./courses.module.css";

// Items to render per page chunk
const PAGE_SIZE = 30;

function CourseFinderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch((err) => console.error("Error loading dynamic courses:", err));
  }, []);

  const activeCourses = courses;

  // URL parameters initialization
  const initialSearch = searchParams.get("q") || "";
  const initialUniversity = searchParams.get("university") || "";
  const initialLevel = searchParams.get("level") || "All";

  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedUniversities, setSelectedUniversities] = useState(
    initialUniversity ? [initialUniversity] : []
  );
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [maxFee, setMaxFee] = useState(30000);
  const [includeUndisclosed, setIncludeUndisclosed] = useState(true);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Synchronize state with URL parameters (for links from Home Page)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchTerm(q);
    
    const uni = searchParams.get("university");
    if (uni !== null) {
      setSelectedUniversities(uni ? [uni] : []);
    }

    const lvl = searchParams.get("level");
    if (lvl !== null) {
      setSelectedLevel(lvl || "All");
    }
  }, [searchParams]);

  // Extract unique universities dynamically from the dataset
  const universitiesList = useMemo(() => {
    const unis = activeCourses.map((c) => c.university);
    return [...new Set(unis)].sort();
  }, [activeCourses]);

  // Filter logic
  const filteredCourses = useMemo(() => {
    return activeCourses.filter((course) => {
      // 1. Text Search matching name, university, or faculty
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = course.name.toLowerCase().includes(term);
        const matchesUni = course.university.toLowerCase().includes(term);
        const matchesFaculty = course.faculty ? course.faculty.toLowerCase().includes(term) : false;
        
        if (!matchesName && !matchesUni && !matchesFaculty) return false;
      }

      // 2. University Checklist
      if (selectedUniversities.length > 0) {
        if (!selectedUniversities.includes(course.university)) return false;
      }

      // 3. Academic Level Filter
      if (selectedLevel !== "All") {
        if (course.level !== selectedLevel) return false;
      }

      // 4. Language Filter
      if (selectedLanguage !== "All") {
        if (course.language !== selectedLanguage) return false;
      }

      // 5. Tuition Fee Filter
      const feeVal = course.fee !== null ? course.fee : course.discount_fee;
      if (feeVal === null || feeVal === undefined) {
        return includeUndisclosed;
      } else {
        if (feeVal > maxFee) return false;
      }

      return true;
    });
  }, [activeCourses, searchTerm, selectedUniversities, selectedLevel, selectedLanguage, maxFee, includeUndisclosed]);

  // Reset page size when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedUniversities, selectedLevel, selectedLanguage, maxFee, includeUndisclosed]);

  const toggleUniversity = (uni) => {
    if (selectedUniversities.includes(uni)) {
      setSelectedUniversities(selectedUniversities.filter((item) => item !== uni));
    } else {
      setSelectedUniversities([...selectedUniversities, uni]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedUniversities([]);
    setSelectedLevel("All");
    setSelectedLanguage("All");
    setMaxFee(30000);
    setIncludeUndisclosed(true);
    router.replace("/courses");
  };

  // Slice visible courses
  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = filteredCourses.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="container">
      {/* Page Title Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Program Finder</h1>
        <p className={styles.subtitle}>
          Compare 1,950+ certified courses and find tuition rates at zero agent fees.
        </p>
      </header>

      {/* Main Search Grid */}
      <div className={styles.searchLayout}>
        {/* Left Side Filters Sidebar */}
        <aside className={`${styles.sidebar} glass`}>
          
          {/* Header Title with Clear Button */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>Filters</span>
              <span className={styles.clearFilterLink} onClick={clearAllFilters}>
                Clear All
              </span>
            </div>
          </div>

          {/* Academic Level filter */}
          <div className={styles.filterSection}>
            <label className="form-label" htmlFor="levelSelect" style={{ marginBottom: "8px", display: "block" }}>
              Program Level
            </label>
            <select
              id="levelSelect"
              className="input-field input-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Associate">Associate Degree (2 yrs)</option>
              <option value="Undergraduate">Bachelor's Degree (4 yrs)</option>
              <option value="Master's">Master's Degree</option>
              <option value="PhD">PhD / Doctorate</option>
            </select>
          </div>

          {/* Instruction Language filter */}
          <div className={styles.filterSection}>
            <label className="form-label" htmlFor="langSelect" style={{ marginBottom: "8px", display: "block" }}>
              Language of Instruction
            </label>
            <select
              id="langSelect"
              className="input-field input-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Turkish">Turkish</option>
            </select>
          </div>

          {/* Tuition Fee range slider */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>Tuition Budget (USD)</span>
            </div>
            <input
              type="range"
              min="0"
              max="30000"
              step="500"
              className={styles.rangeSlider}
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
            />
            <div className={styles.priceRangeDisplay}>
              <span>$0</span>
              <span>Max: <span className={styles.priceRangeLabel}>${maxFee.toLocaleString()}</span></span>
            </div>

            <label className={styles.checkboxLabel} style={{ marginTop: "16px" }}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={includeUndisclosed}
                onChange={(e) => setIncludeUndisclosed(e.target.checked)}
              />
              <span>Include undisclosed fees</span>
            </label>
          </div>

          {/* Universities Checklist */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>Universities</span>
            </div>
            <div className={styles.checkboxGroup}>
              {universitiesList.map((uni, idx) => (
                <label key={idx} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedUniversities.includes(uni)}
                    onChange={() => toggleUniversity(uni)}
                  />
                  <span>{uni}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side Content Results */}
        <section className={styles.resultsContent}>
          {/* Header search bar */}
          <div className={styles.searchHeader}>
            <div className={styles.resultsCount}>
              Found <span>{filteredCourses.length}</span> programs
            </div>

            <div className={`${styles.searchInputCard} glass`}>
              <span style={{ color: "var(--text-muted)", marginRight: "8px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search programs or keywords..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Programs Grid */}
          {visibleCourses.length > 0 ? (
            <>
              <div className={styles.resultsGrid}>
                {visibleCourses.map((course, idx) => (
                  <CourseCard key={idx} course={course} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className={styles.loadMoreWrapper}>
                  <button onClick={loadMore} className="btn btn-secondary">
                    Load More Programs ({filteredCourses.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`${styles.emptyState} glass`}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>No courses found</h3>
              <p>We couldn't find any courses matching your filters. Try search keywords or clearing selection.</p>
              <button onClick={clearAllFilters} className="btn btn-primary" style={{ marginTop: "12px" }}>
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CourseFinder() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h3>Loading Program Finder...</h3>
      </div>
    }>
      <CourseFinderContent />
    </Suspense>
  );
}
