"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import styles from "./eligibility.module.css";

function CheckerContent() {
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

  // Get prefilled course selections if coming from "Apply Now"
  const prefilledUniversity = searchParams.get("university") || "";
  const prefilledProgram = searchParams.get("program") || "";
  const prefilledLevel = searchParams.get("level") || "Undergraduate";

  // Form State wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    level: prefilledLevel,
    prefUniversity: prefilledUniversity,
    prefProgram: prefilledProgram,
    gpa: "",
    gpaScale: "100",
    englishExam: "None",
    englishScore: "",
    turkishLevel: "None",
    tuitionBudget: "15000",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedMatches, setCheckedMatches] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sync state if prefilled fields change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      level: searchParams.get("level") || prev.level,
      prefUniversity: searchParams.get("university") || prev.prefUniversity,
      prefProgram: searchParams.get("program") || prev.prefProgram,
    }));
  }, [searchParams]);

  // Extract unique universities dynamically for selection
  const universitiesList = useMemo(() => {
    const unis = activeCourses.map((c) => c.university);
    return [...new Set(unis)].sort();
  }, [activeCourses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    // 1. Perform dynamic matching client-side first
    const matches = activeCourses.filter((course) => {
      // Level check
      if (course.level !== formData.level) return false;

      // Budget check
      const feeVal = course.fee !== null ? course.fee : course.discount_fee;
      if (feeVal !== null && feeVal > Number(formData.tuitionBudget)) return false;

      // Language check
      if (course.language === "English" && formData.englishExam === "None" && course.level === "Master's") {
        // Master's English courses usually require test score, handled as loose match
      }

      // Preferred Program Check (filter by program name or faculty)
      if (formData.prefProgram && formData.prefProgram.trim()) {
        const searchWord = formData.prefProgram.toLowerCase().trim();
        const nameMatches = course.name.toLowerCase().includes(searchWord);
        const facultyMatches = course.faculty ? course.faculty.toLowerCase().includes(searchWord) : false;
        if (!nameMatches && !facultyMatches) return false;
      }

      return true;
    });

    // Highlight preferred university first, then other matching ones
    let sortedMatches = [...matches];
    if (formData.prefUniversity) {
      sortedMatches = [
        ...sortedMatches.filter((c) => c.university === formData.prefUniversity),
        ...sortedMatches.filter((c) => c.university !== formData.prefUniversity)
      ];
    }

    const topMatches = sortedMatches.slice(0, 4);

    // 2. Construct inquiry payload with dynamic matched data
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      level: formData.level,
      program: formData.prefProgram || "General Matching Inquiry",
      university: formData.prefUniversity || "Any",
      gpa: `${formData.gpa}/${formData.gpaScale}`,
      english: `${formData.englishExam} (Score: ${formData.englishScore || "N/A"})`,
      tuitionBudget: `$${Number(formData.tuitionBudget).toLocaleString()}/year`,
      matches: topMatches.map(c => ({
        title: c.name,
        desc: `${c.university} • ${c.level} • ${c.language}`,
        price: c.fee !== null && c.fee !== undefined 
          ? `$${Number(c.fee).toLocaleString()}/yr` 
          : c.discount_fee !== null && c.discount_fee !== undefined
          ? `$${Number(c.discount_fee).toLocaleString()}/yr`
          : "Undisclosed"
      })),
      message: `Eligibility Assessment:
- Pref University: ${formData.prefUniversity || "Any"}
- GPA: ${formData.gpa}/${formData.gpaScale}
- English: ${formData.englishExam} (Score: ${formData.englishScore || "N/A"})
- Turkish Level: ${formData.turkishLevel}
- Annual Tuition Budget: $${Number(formData.tuitionBudget).toLocaleString()}`,
      date: new Date().toISOString()
    };

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to register inquiry.");
      }

      setCheckedMatches(topMatches);
      setHasChecked(true);
    } catch (err) {
      setSubmitError("Failed to submit assessment. Please verify details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.checkerWrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>Eligibility Checker</h1>
          <p className={styles.subtitle}>
            Assess your GPA, language scores, and budget to find matching Turkish university programs instantly.
          </p>
        </header>

      {/* Steps dots tracker */}
      {!hasChecked && (
        <div className={styles.stepsIndicator}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${(currentStep - 1) * 25}%` }} 
          />
          {[
            { nr: 1, label: "Preferences" },
            { nr: 2, label: "Background" },
            { nr: 3, label: "Languages" },
            { nr: 4, label: "Budget" },
            { nr: 5, label: "Review" }
          ].map(({ nr, label }) => {
            const isActive = currentStep === nr;
            const isCompleted = currentStep > nr;
            return (
              <div key={nr} className={styles.stepWrapper}>
                <div
                  className={`${styles.stepDot} ${
                    isActive ? styles.activeStepDot : isCompleted ? styles.completedStepDot : ""
                  }`}
                >
                  {isCompleted ? "✓" : nr}
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    isActive ? styles.activeStepLabel : isCompleted ? styles.completedStepLabel : ""
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard Form container */}
      <div className={`${hasChecked ? styles.resultsPanel : styles.formPanel} glass`}>
        {submitError && (
          <p style={{ color: "var(--color-danger)", marginBottom: "16px", textAlign: "center" }}>
            ⚠️ {submitError}
          </p>
        )}

        {!hasChecked ? (
          <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
            
            {/* Step 1: Program Preferences */}
            {currentStep === 1 && (
              <div className="animate-fade">
                <h3 className={styles.stepTitle}>Step 1: What would you like to study?</h3>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="level">Academic Level</label>
                  <select
                    id="level"
                    name="level"
                    className="input-field input-select"
                    value={formData.level}
                    onChange={handleChange}
                  >
                    <option value="Associate">Associate Degree (2 Years)</option>
                    <option value="Undergraduate">Bachelor's Degree (4 Years)</option>
                    <option value="Master's">Master's Degree</option>
                    <option value="PhD">PhD / Doctorate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prefUniversity">Preferred University (Optional)</label>
                  <select
                    id="prefUniversity"
                    name="prefUniversity"
                    className="input-field input-select"
                    value={formData.prefUniversity}
                    onChange={handleChange}
                  >
                    <option value="">Any University</option>
                    {universitiesList.map((uni, idx) => (
                      <option key={idx} value={uni}>{uni}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prefProgram">Preferred Program / Major</label>
                  <input
                    type="text"
                    id="prefProgram"
                    name="prefProgram"
                    placeholder="e.g. Computer Science or Medicine"
                    className="input-field"
                    value={formData.prefProgram}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Academic background GPA */}
            {currentStep === 2 && (
              <div className="animate-fade">
                <h3 className={styles.stepTitle}>Step 2: Academic Background</h3>
                
                <div className="grid grid-2 gap-sm" style={{ marginBottom: "0px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="gpaScale">GPA Grading System</label>
                    <select
                      id="gpaScale"
                      name="gpaScale"
                      className="input-field input-select"
                      value={formData.gpaScale}
                      onChange={handleChange}
                    >
                      <option value="100">Percentage (0 - 100%)</option>
                      <option value="4">GPA Scale (0.0 - 4.0)</option>
                      <option value="5">GPA Scale (0.0 - 5.0)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="gpa">Your GPA / Score</label>
                    <input
                      type="number"
                      id="gpa"
                      name="gpa"
                      step="0.01"
                      min="0"
                      required
                      placeholder={formData.gpaScale === "100" ? "e.g. 82.5" : "e.g. 3.4"}
                      className="input-field"
                      value={formData.gpa}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Languages test scores */}
            {currentStep === 3 && (
              <div className="animate-fade">
                <h3 className={styles.stepTitle}>Step 3: Language Capabilities</h3>
                
                <div className="grid grid-2 gap-sm" style={{ marginBottom: "0px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="englishExam">English Proficiency Exam</label>
                    <select
                      id="englishExam"
                      name="englishExam"
                      className="input-field input-select"
                      value={formData.englishExam}
                      onChange={handleChange}
                    >
                      <option value="None">None / Take University Exam</option>
                      <option value="IELTS">IELTS Academic</option>
                      <option value="TOEFL">TOEFL iBT</option>
                      <option value="PTE">PTE Academic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="englishScore">Exam Score (If any)</label>
                    <input
                      type="text"
                      id="englishScore"
                      name="englishScore"
                      disabled={formData.englishExam === "None"}
                      placeholder={formData.englishExam === "None" ? "N/A" : "e.g. 6.5 or 85"}
                      className="input-field"
                      value={formData.englishScore}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="turkishLevel">Turkish Proficiency Level</label>
                  <select
                    id="turkishLevel"
                    name="turkishLevel"
                    className="input-field input-select"
                    value={formData.turkishLevel}
                    onChange={handleChange}
                  >
                    <option value="None">No Knowledge / Learn at Prep School</option>
                    <option value="A1-A2">Elementary (A1-A2)</option>
                    <option value="B1-B2">Intermediate (B1-B2)</option>
                    <option value="C1-C2">Advanced / Native (C1-C2)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Tuition budget */}
            {currentStep === 4 && (
              <div className="animate-fade">
                <h3 className={styles.stepTitle}>Step 4: Annual Tuition Budget</h3>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="tuitionBudget">Maximum Yearly Budget (USD)</label>
                  <input
                    type="range"
                    id="tuitionBudget"
                    name="tuitionBudget"
                    min="1500"
                    max="30000"
                    step="500"
                    className={styles.rangeSlider}
                    style={{ margin: "16px 0" }}
                    value={formData.tuitionBudget}
                    onChange={handleChange}
                  />
                  <div className={styles.priceRangeDisplay}>
                    <span>$1,500</span>
                    <span style={{ fontSize: "16px", color: "var(--color-secondary-light)", fontWeight: "700" }}>
                      ${Number(formData.tuitionBudget).toLocaleString()} / year
                    </span>
                    <span>$30,000</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Contact Details */}
            {currentStep === 5 && (
              <div className="animate-fade">
                <h3 className={styles.stepTitle}>Step 5: Finalize & Submit</h3>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. John Doe"
                    className="input-field"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-2 gap-sm" style={{ marginBottom: "0px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="john@example.com"
                      className="input-field"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="e.g. +90 555..."
                      className="input-field"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation button panel */}
            <div className={styles.navButtons}>
              {currentStep > 1 ? (
                <button type="button" onClick={prevStep} className="btn btn-secondary">
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStep === 2 && !formData.gpa}
                  className="btn btn-primary"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Calculating Matches..." : "Check Matches ✓"}
                </button>
              )}
            </div>

          </form>
        ) : (
          /* Match Results Presentation */
          <div className="animate-fade">
            <div className={styles.successHeader}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.resultsTitle}>Calculation Complete!</h2>
              <p className={styles.resultsDesc}>
                We successfully compiled your profile. Based on your academic preferences, 
                GPA level, and tuition budget limit of <strong>${Number(formData.tuitionBudget).toLocaleString()}/year</strong>, 
                we matched you with the following recommended programs.
              </p>
            </div>

            {checkedMatches.length > 0 ? (
              <>
                <h3 className={styles.matchHeadline}>Top Matches for You:</h3>
                <div className={styles.matchedCoursesGrid}>
                  {checkedMatches.map((course, idx) => (
                    <CourseCard key={idx} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", margin: "24px 0" }}>
                <p>No immediate programs matched your exact criteria. Our team will review your file to verify custom discount exceptions.</p>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "24px" }}>
              <h4 style={{ color: "#ffffff", marginBottom: "8px" }}>Next Steps:</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                Your request has been forwarded to the <strong>AZ Consultant</strong> admissions desk. 
                We will email you confirmation details and guide you in preparing transcript scans for official university application entries.
              </p>
              <button onClick={() => setHasChecked(false)} className="btn btn-secondary">
                ← Return to Calculator
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function Checker() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h3>Loading Eligibility Assessment...</h3>
      </div>
    }>
      <CheckerContent />
    </Suspense>
  );
}
