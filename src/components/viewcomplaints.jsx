import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ComplaintCard from "./complaintcard";
import "../styles/viewcomplaints.css";

function Viewcomplaints() {
    const navigate = useNavigate();
    const location = useLocation();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState("All");

    const role = localStorage.getItem("role");
    const isAdmin = role === "admin";

    // FETCH COMPLAINTS USING BACKEND SEARCH APIs
    useEffect(() => {
        let cancelled = false;

        async function getComplaints() {
            setLoading(true);
            setError("");

            try {
                const term = search.trim();

                let url = "http://localhost:2000/getcomplaints";

                if (term) {
                    if (/^\d+$/.test(term)) {
                        url = `http://localhost:2000/search-complaint/${encodeURIComponent(term)}`;
                    } else {
                        url = `http://localhost:2000/search-complaints?q=${encodeURIComponent(term)}`;
                    }
                }

                const res = await fetch(url);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.message || "Failed to fetch complaints."
                    );
                }

                if (!cancelled) {
                    setComplaints(
                        Array.isArray(data.result) ? data.result : []
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Unable to connect to the server."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        getComplaints();

        return () => {
            cancelled = true;
        };
    }, [search]);

    // COMPLAINT STATISTICS
    const counts = useMemo(() => ({
        All: complaints.length,

        Pending: complaints.filter(
            (c) => (c.status || "Pending").toLowerCase() === "pending"
        ).length,

        "In Progress": complaints.filter(
            (c) => (c.status || "").toLowerCase() === "in progress"
        ).length,

        Resolved: complaints.filter(
            (c) => (c.status || "").toLowerCase() === "resolved"
        ).length,
    }), [complaints]);

    // FILTER COMPLAINTS BY STATUS
    const filteredComplaints = useMemo(() => {
        return complaints.filter((complaint) => {
            const status = complaint.status || "Pending";

            const matchesStatus =
                activeStatus === "All" ||
                status.toLowerCase() === activeStatus.toLowerCase();

            return matchesStatus;
        });
    }, [complaints, activeStatus]);

    // DASHBOARD NAVIGATION
    function goToDashboard() {
        navigate("/dashboard", {
            state: isAdmin
                ? {
                    admindetails: location.state?.admindetails,
                    adminpage: true,
                }
                : {
                    email: localStorage.getItem("email"),
                    adminpage: false,
                },
        });
    }

    // CLEAR SEARCH AND FILTERS
    function clearFilters() {
        setSearch("");
        setActiveStatus("All");
    }

    return (
        <main className="vc-page">

            {/* NAVBAR */}
            <header className="vc-navbar">
                <button
                    type="button"
                    className="vc-brand"
                    onClick={goToDashboard}
                >
                    <span className="vc-brand-mark">V</span>

                    <span>
                        <strong>Raise Your Voice</strong>
                        <small>
                            {isAdmin ? "Admin Portal" : "Student Portal"}
                        </small>
                    </span>
                </button>

                <button
                    type="button"
                    className="vc-dashboard-button"
                    onClick={goToDashboard}
                >
                    ← Dashboard
                </button>
            </header>

            {/* MAIN CONTENT */}
            <section className="vc-main">

                {/* HERO SECTION */}
                <div className="vc-hero">
                    <div>
                        <span className="vc-eyebrow">
                            {isAdmin
                                ? "COMPLAINT MANAGEMENT"
                                : "YOUR VOICE MATTERS"}
                        </span>

                        <h1>
                            {isAdmin
                                ? "All Complaints"
                                : "Explore Complaints"}
                        </h1>

                        <p>
                            {isAdmin
                                ? "Review concerns raised by students and track their resolution."
                                : "Explore student concerns, support important issues, and follow their progress."}
                        </p>
                    </div>

                    {!isAdmin && (
                        <button
                            type="button"
                            className="vc-create-button"
                            onClick={() =>
                                navigate("/raisecomplaint", {
                                    state: {
                                        email: localStorage.getItem("email"),
                                    },
                                })
                            }
                        >
                            <span>+</span> Raise a Complaint
                        </button>
                    )}
                </div>

                {/* STATISTICS */}
                <section className="vc-stats">
                    {[
                        {
                            label: "All Complaints",
                            value: counts.All,
                            icon: "▤",
                        },
                        {
                            label: "Pending",
                            value: counts.Pending,
                            icon: "◷",
                        },
                        {
                            label: "In Progress",
                            value: counts["In Progress"],
                            icon: "↻",
                        },
                        {
                            label: "Resolved",
                            value: counts.Resolved,
                            icon: "✓",
                        },
                    ].map((item, index) => (
                        <button
                            type="button"
                            key={item.label}
                            className={`vc-stat-card ${
                                activeStatus ===
                                ["All", "Pending", "In Progress", "Resolved"][index]
                                    ? "selected"
                                    : ""
                            }`}
                            onClick={() =>
                                setActiveStatus(
                                    ["All", "Pending", "In Progress", "Resolved"][index]
                                )
                            }
                        >
                            <span className={`vc-stat-icon vc-stat-icon-${index}`}>
                                {item.icon}
                            </span>

                            <span className="vc-stat-label">
                                {item.label}
                            </span>

                            <strong>{item.value}</strong>
                        </button>
                    ))}
                </section>

                {/* COMPLAINT LIST */}
                <section className="vc-list-section">

                    <div className="vc-list-heading">
                        <div>
                            <h2>
                                {activeStatus === "All"
                                    ? "Complaint Feed"
                                    : `${activeStatus} Complaints`}
                            </h2>

                            <p>
                                {loading
                                    ? "Fetching the latest complaints..."
                                    : `${filteredComplaints.length} complaint${
                                        filteredComplaints.length === 1 ? "" : "s"
                                    } found`}
                            </p>
                        </div>
                    </div>

                    {/* SEARCH AND STATUS FILTERS */}
                    <div className="vc-controls">

                        <div className="vc-search">
                            <span>⌕</span>

                            <input
                                type="search"
                                placeholder="Search title, category, description or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            className="vc-status-select"
                            value={activeStatus}
                            onChange={(e) => setActiveStatus(e.target.value)}
                            aria-label="Filter complaints by status"
                        >
                            <option value="All">All statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="vc-message">
                            <div className="vc-spinner" />

                            <h3>Loading complaints</h3>

                            <p>
                                Please wait while we fetch the latest records.
                            </p>
                        </div>

                    ) : error ? (

                        /* ERROR */
                        <div className="vc-message vc-error-box">
                            <h3>Couldn't load complaints</h3>

                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={() => setSearch(search)}
                            >
                                Try Again
                            </button>
                        </div>

                    ) : filteredComplaints.length === 0 ? (

                        /* EMPTY RESULTS */
                        <div className="vc-message">
                            <span className="vc-empty-icon">⌕</span>

                            <h3>No complaints found</h3>

                            <p>
                                Try a different search or select another status.
                            </p>

                            <button
                                type="button"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        </div>

                    ) : (

                        /* COMPLAINT CARDS */
                        <div className="vc-complaints-grid">
                            {filteredComplaints.map((complaint) => (
                                <ComplaintCard
                                    key={complaint.complaint_id}
                                    complaint={complaint}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* FOOTER */}
                <footer className="vc-footer">
                    <span>Raise Your Voice © 2026</span>

                    <span>
                        Every concern deserves to be heard.
                    </span>
                </footer>

            </section>
        </main>
    );
}

export default Viewcomplaints;