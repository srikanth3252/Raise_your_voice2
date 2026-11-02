
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FileText,
    CalendarDays,
    Download,
    ArrowLeft,
    Clock,
    RefreshCw,
    CheckCircle,
    ThumbsUp,
    ClipboardList,
    Eye,
    Loader
} from "lucide-react";

import "../styles/reportresults.css";

function ReportResults() {

    const navigate = useNavigate();
    const location = useLocation();

    const report = location.state?.report;
    const startDate = location.state?.startDate;
    const endDate = location.state?.endDate;

    const [viewingComplaint, setViewingComplaint] = useState(null);
    const [error, setError] = useState("");

    if (!report || !report.overview) {
        return (
            <div className="report-empty">
                <FileText size={55} />
                <h2>No Report Available</h2>
                <p>Please generate a report first.</p>

                <button onClick={() => navigate("/statistics")}>
                    <ArrowLeft size={17} />
                    Back to Generate Reports
                </button>
            </div>
        );
    }

    const overview = report.overview;
    const categories = report.categories || [];
    const complaints = report.complaints || [];

    const total = Number(overview.totalComplaints || 0);
    const resolved = Number(overview.resolved || 0);
    const pending = Number(overview.pending || 0);
    const inProgress = Number(overview.inProgress || 0);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value === "resolved") return "resolved";
        if (value === "pending") return "pending";

        if (value === "in progress" || value === "in-progress") {
            return "in-progress";
        }

        return "other";
    };

    const chartColors = [
        "#3185ff",
        "#2464d8",
        "#559dff",
        "#1748a5",
        "#65b4ff",
        "#3974c9",
        "#8bc5ff"
    ];

    const categoryTotal = categories.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0
    );

    let currentPercentage = 0;

    const categoryGradient = categories.length
        ? categories.map((item, index) => {

            const percentage = categoryTotal
                ? (Number(item.count || 0) / categoryTotal) * 100
                : 0;

            const start = currentPercentage;
            currentPercentage += percentage;

            return `${chartColors[index % chartColors.length]} ${start}% ${currentPercentage}%`;

        }).join(", ")
        : "#19345c 0% 100%";

    // Download or print the report as PDF
    const handleDownloadPDF = () => {
        window.print();
    };

    // Fetch complete complaint details before opening the details page
   
const handleViewComplaint = async (complaint) => {
    try {
        setError("");
        setViewingComplaint(complaint.complaint_id);

        const response = await fetch(
            `https://raise-your-voice2.onrender.com/complaint/${complaint.complaint_id}`
        );

        const data = await response.json();

        if (!response.ok || !data.result) {
            throw new Error(
                data.message || "Unable to fetch complaint details."
            );
        }

        navigate("/complaintdetails", {
            state: {
                complaintdetails: data.result,
                adminpage: true
            }
        });

    } catch (err) {
        console.error("VIEW COMPLAINT ERROR:", err);
        setError(err.message || "Unable to open complaint.");
    } finally {
        setViewingComplaint(null);
    }
};


    return (

        <div className="report-results-page">

            {/* Top navigation */}
            <div className="report-topbar">

                <div className="report-breadcrumb">
                    <span onClick={() => navigate("/statistics")}>
                        Statistics
                    </span>

                    <span>›</span>

                    <strong>Report Results</strong>
                </div>

                <div className="report-admin-label">
                    Admin Panel
                </div>

            </div>

            {/* Page heading */}
            <div className="report-heading">

                <div className="report-heading-left">

                    <div className="report-heading-icon">
                        <FileText size={35} />
                    </div>

                    <div>
                        <h1>Report Results</h1>

                        <p>
                            Grievance report generated for the selected date range.
                        </p>
                    </div>

                </div>

                <div className="report-heading-actions">

                    <button
                        className="download-report-btn"
                        onClick={handleDownloadPDF}
                    >
                        <Download size={18} />
                        Download PDF
                    </button>

                    <button
                        className="back-statistics-btn"
                        onClick={() => navigate("/StatisticsDashboard")}
                    >
                        <ArrowLeft size={18} />
                        Back to Statistics
                    </button>

                </div>

            </div>

            {/* Report period */}
            <div className="report-period">

                <CalendarDays size={25} />

                <strong>Report Period:</strong>

                <span>
                    {formatDate(startDate || report.startDate)}
                    {" – "}
                    {formatDate(endDate || report.endDate)}
                </span>

            </div>

            {/* Summary cards */}
            <div className="report-summary-grid">

                <div className="report-summary-card blue-card">
                    <FileText size={27} />
                    <h2>{total}</h2>
                    <p>Total Complaints</p>
                </div>

                <div className="report-summary-card yellow-card">
                    <Clock size={27} />
                    <h2>{pending}</h2>
                    <p>Pending</p>
                </div>

                <div className="report-summary-card purple-card">
                    <RefreshCw size={27} />
                    <h2>{inProgress}</h2>
                    <p>In Progress</p>
                </div>

                <div className="report-summary-card green-card">
                    <CheckCircle size={27} />
                    <h2>{resolved}</h2>
                    <p>Resolved</p>
                </div>

                <div className="report-summary-card pink-card">
                    <ThumbsUp size={27} />
                    <h2>{Number(overview.totalSupports || 0)}</h2>
                    <p>Total Supports</p>
                </div>

            </div>

            {/* Charts */}
            <div className="report-charts-grid">

                {/* Category breakdown */}
                <div className="report-panel category-panel">

                    <h2>Complaints by Category</h2>

                    {categories.length > 0 ? (

                        <div className="category-chart-content">

                            <div
                                className="category-donut"
                                style={{
                                    background: `conic-gradient(${categoryGradient})`
                                }}
                            >
                                <div className="donut-center">
                                    <strong>{categoryTotal}</strong>
                                    <span>Complaints</span>
                                </div>
                            </div>

                            <div className="category-legend">

                                {categories.map((item, index) => {

                                    const count = Number(item.count || 0);

                                    const percentage = categoryTotal
                                        ? ((count / categoryTotal) * 100).toFixed(1)
                                        : 0;

                                    return (

                                        <div
                                            className="category-legend-item"
                                            key={item.category || index}
                                        >

                                            <span
                                                className="legend-color"
                                                style={{
                                                    backgroundColor:
                                                        chartColors[index % chartColors.length]
                                                }}
                                            />

                                            <span className="legend-name">
                                                {item.category}
                                            </span>

                                            <strong>
                                                {count} ({percentage}%)
                                            </strong>

                                        </div>

                                    );
                                })}

                            </div>

                        </div>

                    ) : (
                        <p className="report-no-data">
                            No category data available.
                        </p>
                    )}

                </div>

                {/* Resolution overview */}
                <div className="report-panel resolution-panel">

                    <div className="resolution-heading">

                        <h2>Resolution Overview</h2>

                        <span>
                            Resolution Rate:{" "}
                            {Number(overview.resolutionRate || 0).toFixed(1)}%
                        </span>

                    </div>

                    {[
                        {
                            label: "Resolved",
                            count: resolved,
                            color: "#3185ff"
                        },
                        {
                            label: "In Progress",
                            count: inProgress,
                            color: "#559dff"
                        },
                        {
                            label: "Pending",
                            count: pending,
                            color: "#1748a5"
                        }
                    ].map((item) => {

                        const percentage = total > 0
                            ? (item.count / total) * 100
                            : 0;

                        return (

                            <div
                                className="resolution-row"
                                key={item.label}
                            >

                                <span className="resolution-label">
                                    {item.label}
                                </span>

                                <div className="resolution-progress">

                                    <div
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: item.color
                                        }}
                                    />

                                </div>

                                <strong>
                                    {item.count} ({percentage.toFixed(1)}%)
                                </strong>

                            </div>

                        );
                    })}

                </div>

            </div>

            {/* Complaints table */}
            <div className="report-panel report-table-panel">

                <div className="report-table-heading">

                    <ClipboardList size={24} />

                    <h2>
                        Complaints in this Report ({complaints.length})
                    </h2>

                </div>

                {error && (
                    <div className="report-error">
                        {error}
                    </div>
                )}

                {complaints.length > 0 ? (

                    <div className="report-table-wrapper">

                        <table className="report-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Supports</th>
                                    <th>Date Received</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {complaints.map((complaint, index) => (

                                    <tr key={complaint.complaint_id}>

                                        <td>{index + 1}</td>

                                        <td className="report-complaint-title">
                                            {complaint.title}
                                        </td>

                                        <td>
                                            {complaint.category || "Uncategorized"}
                                        </td>

                                        <td>
                                            <span
                                                className={`report-status ${getStatusClass(
                                                    complaint.status
                                                )}`}
                                            >
                                                {complaint.status}
                                            </span>
                                        </td>

                                        <td className="report-support-count">
                                            <ThumbsUp size={16} />
                                            {Number(complaint.total_likes || 0)}
                                        </td>

                                        <td>
                                            {formatDateTime(complaint.created_at)}
                                        </td>

                                        <td>

                                            <button
                                                className="report-view-btn"
                                                onClick={() => handleViewComplaint(complaint)}
                                                disabled={viewingComplaint !== null}
                                            >
                                                {viewingComplaint === complaint.complaint_id ? (
                                                    <>
                                                        <Loader size={15} className="report-loader" />
                                                        Loading
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye size={15} />
                                                        View Complaint
                                                    </>
                                                )}
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <div className="report-no-data">
                        No complaints found for this date range.
                    </div>

                )}

            </div>

            <div className="report-footer">
                Generated by Raise Your Voice – University Grievance Portal
            </div>

        </div>

    );
}

export default ReportResults;
