"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch inquiries from server endpoint
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/inquiry")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInquiries(data);
        }
      })
      .catch((err) => console.error("Error loading B2B inquiries", err))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
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
        <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
          🔄 Refresh List
        </button>
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
