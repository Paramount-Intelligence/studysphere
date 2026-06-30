"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Check sessionStorage on mount to keep authenticated session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("admin_auth") === "true";
      const storedPass = sessionStorage.getItem("admin_password");
      if (isAuth && storedPass) {
        setIsAuthenticated(true);
        setPassword(storedPass);
      }
    }
  }, []);

  // Fetch inquiries from server endpoint (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const activePassword = sessionStorage.getItem("admin_password") || password;

    setIsLoading(true);
    fetch("/api/inquiry", {
      headers: {
        "Authorization": activePassword
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or server error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setInquiries(data);
        }
      })
      .catch((err) => console.error("Error loading B2B inquiries", err))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger, isAuthenticated]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        setAuthError("");
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_password", password);
      } else {
        setAuthError(data.error || "Incorrect password. Access denied.");
      }
    } catch (err) {
      setAuthError("Authentication service connection failed.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_password");
    setPassword("");
  };

  // Filter B2B applications by search criteria
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) || // Director name
        item.email.toLowerCase().includes(term) || // Email
        item.phone.includes(term) || // Phone
        item.program.toLowerCase().includes(term) || // Agency Name
        item.message.toLowerCase().includes(term) // Message
      );
    });
  }, [inquiries, searchTerm]);

  // Statistics computations
  const stats = useMemo(() => {
    const total = inquiries.length;

    // Count created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = inquiries.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startOfToday;
    }).length;

    // Volume groupings from parsing B2B message
    const highVolume = inquiries.filter((item) => item.message.includes("Volume: 100+") || item.message.includes("Volume: 51-100")).length;
    const lowVolume = inquiries.filter((item) => item.message.includes("Volume: 1-10") || item.message.includes("Volume: 11-50")).length;

    return { total, today, highVolume, lowVolume };
  }, [inquiries]);

  // Format timestamp
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container animate-fade">
        <div className={styles.loginOverlay}>
          <div className={`${styles.loginCard} glass`}>
            <div className={styles.loginHeader}>
              <span className={styles.loginIcon}>🔒</span>
              <h1 className={styles.loginTitle}>AZ Consultant Access</h1>
              <p className={styles.loginSubtitle}>Please enter password to view submissions.</p>
            </div>

            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.loginInputGroup}>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={styles.loginInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {authError && (
                <div className={styles.loginError}>
                  ⚠️ {authError}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Authenticate ✦
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade">
      <div className={styles.adminWrapper}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Partner Management Console</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Review agency applications and sub-agent partnership requests.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
              🔄 Refresh List
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Stats Cards Row */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} glass`}>
            <span className={styles.statVal}>{stats.total}</span>
            <span className={styles.statLabel}>Partner Applications</span>
          </div>
          <div className={`${styles.statCard} glass`}>
            <span className={styles.statVal} style={{ color: "var(--color-secondary-light)" }}>
              {stats.today}
            </span>
            <span className={styles.statLabel}>New Submissions Today</span>
          </div>
          <div className={`${styles.statCard} glass`}>
            <span className={styles.statVal}>{stats.highVolume}</span>
            <span className={styles.statLabel}>High Volume Agencies (50+)</span>
          </div>
          <div className={`${styles.statCard} glass`}>
            <span className={styles.statVal}>{stats.lowVolume}</span>
            <span className={styles.statLabel}>Standard Agencies (1-50)</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={styles.controlsRow}>
          <div className={`${styles.searchBox} glass`}>
            <span style={{ color: "var(--text-muted)", marginRight: "8px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search B2B applications by agency name, location, contact..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Showing <span>{filteredInquiries.length}</span> of {inquiries.length} requests
          </div>
        </div>

        {/* Inquiries Table */}
        <div className={`${styles.tableContainer} glass`}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <h3>Loading submissions...</h3>
            </div>
          ) : filteredInquiries.length > 0 ? (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Agency & Contact</th>
                  <th>Director / Rep</th>
                  <th>Registration Details</th>
                  <th>Submitted Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.studentName}>{item.program}</div> {/* Agency Name */}
                      <div className={styles.studentEmail} style={{ color: "var(--color-secondary-light)" }}>
                        ✉ {item.email}
                      </div>
                      <div className={styles.studentEmail}>
                        📞 {item.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: "#ffffff", fontWeight: "600" }}>{item.name}</div>
                      <span className="badge badge-teal" style={{ marginTop: "4px" }}>Director</span>
                    </td>
                    <td>
                      <div className={styles.detailsCol}>{item.message}</div>
                    </td>
                    <td>
                      <div className={styles.dateText}>{formatDate(item.date)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <h3>No B2B partner applications found</h3>
              <p>Submissions from the 'Become a Partner' form will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
