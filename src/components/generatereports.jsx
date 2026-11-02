
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    FileChartColumn,
    ArrowLeft,
    LoaderCircle,
    AlertCircle,
    FileText
} from "lucide-react";

import "../styles/generatereports.css";

const FILTERS = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thismonth" },
    { label: "Last Month", value: "lastmonth" },
    { label: "Custom Range", value: "custom" }
];

// Format a date using local time, avoiding UTC date shifts.
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateRange(filter) {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);

    switch (filter) {
        case "today":
            break;

        case "last7days":
            start.setDate(start.getDate() - 6);
            break;

        case "last30days":
            start.setDate(start.getDate() - 29);
            break;

        case "thismonth":
            start.setDate(1);
            break;

        case "lastmonth":
            start.setDate(1);
            start.setMonth(start.getMonth() - 1);
            end.setDate(0);
            break;

        default:
            return null;
    }

    return {
        startDate: formatDate(start),
        endDate: formatDate(end)
    };
}

function GenerateReport() {
    const navigate = useNavigate();

    const [selectedFilter, setSelectedFilter] = useState("last7days");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleGenerateReport() {
        setError("");

        let dateRange;

        if (selectedFilter === "custom") {
            if (!startDate || !endDate) {
                setError("Please select both start date and end date.");
                return;
            }

            if (startDate > endDate) {
                setError("Start date cannot be after end date.");
                return;
            }

            if (endDate > formatDate(new Date())) {
                setError("End date cannot be in the future.");
                return;
            }

            dateRange = { startDate, endDate };
        } else {
            dateRange = getDateRange(selectedFilter);
        }

        if (!dateRange) {
            setError("Please select a valid date range.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:2000/generatereport",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dateRange)
                }
            );

            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to generate report."
                );
            }

            navigate("/reportresults", {
                state: {
                    report: data.result,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }
            });

        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="gr-page">

            {/* HEADER */}
            <header className="gr-header">
                <div>
                    <span className="gr-eyebrow">
                        RAISE YOUR VOICE / ANALYTICS
                    </span>

                    <h1>Generate Reports</h1>

                    <p>
                        Generate detailed grievance reports for your university.
                    </p>
                </div>

                <button
                    className="gr-back-button"
                    onClick={() => navigate("/statisticsdashboard")}
                >
                    <ArrowLeft size={17} />
                    Back to Dashboard
                </button>
            </header>

            {/* REPORT TYPE */}
            <section className="gr-panel gr-report-type">
                <div className="gr-section-icon">
                    <FileChartColumn size={24} />
                </div>

                <div>
                    <span className="gr-label">REPORT TYPE</span>
                    <h2>Complaint Statistics Report</h2>
                    <p>
                        Complaint submissions, status distribution,
                        categories and student support.
                    </p>
                </div>
            </section>

            {/* DATE FILTERS */}
            <section className="gr-panel">
                <div className="gr-panel-heading">
                    <div className="gr-heading-icon">
                        <CalendarDays size={20} />
                    </div>

                    <div>
                        <h2>Select Report Period</h2>
                        <p>Choose the period for your report.</p>
                    </div>
                </div>

                <div className="gr-filter-grid">
                    {FILTERS.map((filter) => (
                        <button
                            type="button"
                            key={filter.value}
                            className={`gr-filter-button ${
                                selectedFilter === filter.value
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => {
                                setSelectedFilter(filter.value);
                                setError("");
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* CUSTOM DATE RANGE */}
                {selectedFilter === "custom" && (
                    <div className="gr-custom-dates">

                        <div className="gr-date-field">
                            <label htmlFor="start-date">
                                Start Date
                            </label>

                            <input
                                id="start-date"
                                type="date"
                                value={startDate}
                                max={formatDate(new Date())}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="gr-date-field">
                            <label htmlFor="end-date">
                                End Date
                            </label>

                            <input
                                id="end-date"
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                max={formatDate(new Date())}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                    </div>
                )}
            </section>

            {/* REPORT CONTENT */}
            <section className="gr-panel">
                <div className="gr-panel-heading">
                    <div className="gr-heading-icon">
                        <FileText size={20} />
                    </div>

                    <div>
                        <h2>Report Contents</h2>
                        <p>The generated report will include:</p>
                    </div>
                </div>

                <div className="gr-content-grid">
                    {[
                        "Total complaints submitted",
                        "Pending complaints",
                        "In-progress complaints",
                        "Resolved complaints",
                        "Category-wise breakdown",
                        "Total student supports",
                        "Complaint details",
                        "Complaint submission dates"
                    ].map((item) => (
                        <div className="gr-content-item" key={item}>
                            <span className="gr-check">✓</span>
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            {/* ERROR */}
            {error && (
                <div className="gr-error" role="alert">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* GENERATE BUTTON */}
            <section className="gr-generate-section">
                <div>
                    <h3>Ready to generate your report?</h3>
                    <p>
                        Your selected date range will be used to
                        retrieve complaint records.
                    </p>
                </div>

                <button
                    type="button"
                    className="gr-generate-button"
                    onClick={handleGenerateReport}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <LoaderCircle className="gr-spin" size={18} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileChartColumn size={18} />
                            Generate Report
                        </>
                    )}
                </button>
            </section>

            <footer className="gr-footer">
                Raise Your Voice · Report Generation
            </footer>

        </main>
    );
}

export default GenerateReport;
