
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import { useNavigate, useLocation } from "react-router-dom";

import {
    Bell,
    CheckCheck,
    ChevronDown,
    ClipboardList,
    FileText,
    MessageCircle,
    RefreshCw,
    UserRound
} from "lucide-react";

import "../styles/dashboard.css";

const API = "http://localhost:2000";

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    // USER DETAILS
    const adminpage = location.state?.adminpage === true;
    const admin = location.state?.admindetails;

    const email =
        location.state?.email ||
        admin?.email ||
        localStorage.getItem("email");

    // COMPLAINT STATES
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    // NOTIFICATION STATES
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState("");

    // PROFILE STATES
    const [showProfile, setShowProfile] = useState(false);
    const [profileDetails, setProfileDetails] = useState(null);

    // REFERENCES
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    // SIDEBAR MENU
    const menuItems = [
        { name: "Dashboard", icon: "⌂", path: "/dashboard" },
        { name: "View Complaints", icon: "▤", path: "/viewcomplaint" },
        { name: "Statistics", icon: "▥", path: "/StatisticsDashboard" },

        ...(!adminpage
            ? [{ name: "Raise Complaint", icon: "+", path: "/raisecomplaint" }]
            : [])
    ];

    // NAVIGATION STATE
    const dashboardState = adminpage
        ? { admindetails: admin, adminpage: true, email }
        : { email, adminpage: false };

    // =========================================
    // FETCH COMPLAINTS AND PROFILE DETAILS
    // =========================================

    const fetchComplaints = useCallback(async () => {
        setLoadingComplaints(true);
        setDashboardError("");

        try {
            let studentId = null;

            if (!adminpage) {
                if (!email) {
                    throw new Error(
                        "Student email not found. Please log in again."
                    );
                }

                const userResponse = await fetch(
                    `${API}/get_user_details`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email })
                    }
                );

                const userData = await userResponse.json();

                if (!userResponse.ok || !userData.result?.user_id) {
                    throw new Error(
                        userData.message ||
                        "Unable to identify your student account."
                    );
                }

                // SAVE STUDENT PROFILE DETAILS
                setProfileDetails(userData.result);

                studentId = String(userData.result.user_id);
            }

            const response = await fetch(`${API}/getcomplaints`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to fetch complaints."
                );
            }

            let rows = Array.isArray(data.result)
                ? data.result
                : [];

            // STUDENTS SEE ONLY THEIR OWN COMPLAINTS
            if (!adminpage) {
                rows = rows.filter(
                    item => String(item.user_id) === studentId
                );
            }

            setComplaints(rows);

        } catch (err) {
            setDashboardError(
                err.message || "Unable to load dashboard data."
            );

            setComplaints([]);

        } finally {
            setLoadingComplaints(false);
        }
    }, [adminpage, email]);

    // =========================================
    // FETCH NOTIFICATIONS
    // =========================================

    const fetchNotifications = useCallback(async () => {
        if (adminpage || !email) return;

        setLoadingNotifications(true);
        setNotificationError("");

        try {
            const [listResponse, countResponse] = await Promise.all([
                fetch(
                    `${API}/notifications/${encodeURIComponent(email)}`
                ),

                fetch(
                    `${API}/notifications/unread-count/${encodeURIComponent(email)}`
                )
            ]);

            const listData = await listResponse.json();
            const countData = await countResponse.json();

            if (!listResponse.ok) {
                throw new Error(
                    listData.message || "Unable to load notifications."
                );
            }

            const list = Array.isArray(listData.notifications)
                ? listData.notifications
                : Array.isArray(listData.result)
                    ? listData.result
                    : [];

            setNotifications(list);

            setUnreadCount(
                Number(
                    countData.unreadCount ??
                    countData.count ??
                    countData.result?.unreadCount ??
                    0
                )
            );

        } catch (err) {
            setNotificationError(
                err.message || "Unable to load notifications."
            );

        } finally {
            setLoadingNotifications(false);
        }
    }, [adminpage, email]);

    // =========================================
    // INITIAL DATA FETCH
    // =========================================

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    useEffect(() => {
        fetchNotifications();

        if (adminpage || !email) return;

        const timer = setInterval(fetchNotifications, 15000);

        return () => clearInterval(timer);
    }, [fetchNotifications, adminpage, email]);

    // =========================================
    // CLOSE DROPDOWNS ON OUTSIDE CLICK
    // =========================================

    useEffect(() => {
        function closeOnOutsideClick(event) {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setShowProfile(false);
            }
        }

        document.addEventListener(
            "mousedown",
            closeOnOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                closeOnOutsideClick
            );
        };
    }, []);

    // =========================================
    // DASHBOARD STATISTICS
    // =========================================

    const stats = useMemo(() => {
        const total = complaints.length;

        const pending = complaints.filter(
            item =>
                String(item.status).toLowerCase() === "pending"
        ).length;

        const resolved = complaints.filter(
            item =>
                String(item.status).toLowerCase() === "resolved"
        ).length;

        const rejected = complaints.filter(
            item =>
                String(item.status).toLowerCase() === "rejected"
        ).length;

        return {
            total,
            pending,
            resolved,
            rejected
        };
    }, [complaints]);

    const recentComplaints = complaints.slice(0, 4);

    // =========================================
    // OPEN COMPLAINT DETAILS
    // =========================================

    function openComplaint(complaint, openConversation = false) {
        navigate("/complaintdetails", {
            state: {
                complaintdetails: complaint,
                email,
                adminpage,
                admindetails: admin,
                openConversation
            }
        });
    }

    // =========================================
    // MARK NOTIFICATION AS READ
    // =========================================

    async function markNotificationRead(notification) {
        const unread =
            Number(notification.is_read) === 0 ||
            notification.is_read === false;

        if (unread) {
            try {
                const response = await fetch(
                    `${API}/notifications/read/${notification.notification_id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email })
                    }
                );

                if (!response.ok) {
                    const data = await response.json();

                    throw new Error(
                        data.message ||
                        "Unable to mark notification as read."
                    );
                }

                setNotifications(previous =>
                    previous.map(item =>
                        item.notification_id === notification.notification_id
                            ? { ...item, is_read: 1 }
                            : item
                    )
                );

                setUnreadCount(previous =>
                    Math.max(0, previous - 1)
                );

            } catch (err) {
                setNotificationError(err.message);
                return;
            }
        }

        setShowNotifications(false);

        try {
            const response = await fetch(
                `${API}/complaint/${notification.complaint_id}`
            );

            const data = await response.json();

            if (!response.ok || !data.result) {
                throw new Error(
                    data.message || "Unable to open this complaint."
                );
            }

            const openConversation =
                notification.notification_type === "admin_message";

            openComplaint(data.result, openConversation);

        } catch (err) {
            setNotificationError(
                err.message || "Unable to open complaint."
            );
        }
    }

    // =========================================
    // MARK ALL NOTIFICATIONS AS READ
    // =========================================

    async function markAllNotificationsRead() {
        try {
            const response = await fetch(
                `${API}/notifications/read-all/${encodeURIComponent(email)}`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to mark all as read."
                );
            }

            setNotifications(previous =>
                previous.map(item => ({
                    ...item,
                    is_read: 1
                }))
            );

            setUnreadCount(0);

        } catch (err) {
            setNotificationError(
                err.message || "Unable to update notifications."
            );
        }
    }

    // =========================================
    // DATE FORMAT
    // =========================================

    function formatDate(value) {
        if (!value) return "Not available";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "Not available"
            : date.toLocaleDateString();
    }

    // =========================================
    // PROFILE DETAILS
    // =========================================

    const profileName = adminpage
        ? admin?.admin_name || "Admin"
        : profileDetails?.username || "Student";

    const profileEmail =
        email || admin?.email || "Email unavailable";

    // =========================================
    // LOGOUT
    // =========================================

    function handleLogout() {
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        navigate("/", { replace: true });
    }

    // =========================================
    // RENDER DASHBOARD
    // =========================================

    return (
        <main className="dashboard-page">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="dashboard-sidebar">

                <div className="dashboard-brand">
                    <span className="dashboard-logo">V</span>

                    <div>
                        <h2>Raise Your Voice</h2>

                        <p>
                            {adminpage
                                ? "Admin Portal"
                                : "Student Portal"}
                        </p>
                    </div>
                </div>

                <p className="sidebar-label">
                    MAIN MENU
                </p>

                <nav className="sidebar-menu">
                    {menuItems.map(item => (
                        <button
                            key={item.name}
                            type="button"
                            className={`sidebar-item ${
                                location.pathname === item.path
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(item.path, {
                                    state: dashboardState
                                })
                            }
                        >
                            <span className="sidebar-icon">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-help-icon">
                        ?
                    </div>

                    <div>
                        <h4>Need Help?</h4>
                        <p>We're here to listen.</p>
                    </div>
                </div>

            </aside>

            {/* =================================
                MAIN DASHBOARD
            ================================= */}

            <section className="dashboard-main">

                {/* =================================
                    HEADER
                ================================= */}

                <header className="dashboard-header">

                    <div>
                        <p className="dashboard-breadcrumb">
                            {adminpage
                                ? "Admin Portal"
                                : "Student Portal"} / Dashboard
                        </p>

                        <h2>Dashboard</h2>
                    </div>

                    <div className="dashboard-header-actions">

                        {/* NOTIFICATION BELL - STUDENT ONLY */}

                        {!adminpage && (
                            <div
                                className="notification-wrapper"
                                ref={notificationRef}
                            >

                                <button
                                    type="button"
                                    className="notification-bell"
                                    aria-label="Notifications"
                                    aria-expanded={showNotifications}
                                    onClick={() => {
                                        setShowProfile(false);

                                        setShowNotifications(value => !value);

                                        if (!showNotifications) {
                                            fetchNotifications();
                                        }
                                    }}
                                >
                                    <Bell size={21} />

                                    {unreadCount > 0 && (
                                        <span className="notification-count">
                                            {unreadCount > 99
                                                ? "99+"
                                                : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* NOTIFICATION DROPDOWN */}

                                {showNotifications && (
                                    <div className="notification-dropdown">

                                        <div className="notification-dropdown-header">
                                            <div>
                                                <h3>Notifications</h3>
                                                <p>{unreadCount} unread</p>
                                            </div>

                                            <button
                                                type="button"
                                                className="notification-icon-button"
                                                onClick={fetchNotifications}
                                                title="Refresh"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>

                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                className="mark-all-read"
                                                onClick={markAllNotificationsRead}
                                            >
                                                <CheckCheck size={15} />
                                                Mark all as read
                                            </button>
                                        )}

                                        {notificationError && (
                                            <p className="notification-error">
                                                {notificationError}
                                            </p>
                                        )}

                                        <div className="notification-list">

                                            {loadingNotifications ? (
                                                <p className="notification-empty">
                                                    Loading notifications...
                                                </p>

                                            ) : notifications.length === 0 ? (
                                                <p className="notification-empty">
                                                    You're all caught up. No notifications.
                                                </p>

                                            ) : (
                                                notifications.map(item => {
                                                    const isUnread =
                                                        Number(item.is_read) === 0 ||
                                                        item.is_read === false;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={item.notification_id}
                                                            className={`notification-item ${
                                                                isUnread
                                                                    ? "unread"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                markNotificationRead(item)
                                                            }
                                                        >
                                                            <span className="notification-item-icon">
                                                                {item.notification_type === "admin_message"
                                                                    ? <MessageCircle size={17} />
                                                                    : <FileText size={17} />}
                                                            </span>

                                                            <span className="notification-item-content">
                                                                <strong>
                                                                    {item.title}
                                                                </strong>

                                                                <span>
                                                                    {item.message}
                                                                </span>

                                                                <small>
                                                                    {new Date(
                                                                        item.created_at
                                                                    ).toLocaleString()}
                                                                </small>
                                                            </span>

                                                            {isUnread && (
                                                                <span className="notification-unread-dot" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* =================================
                            PROFILE DROPDOWN
                        ================================= */}

                        <div
                            className="profile-wrapper"
                            ref={profileRef}
                        >

                            <button
                                type="button"
                                className={`profile-button ${
                                    showProfile ? "profile-active" : ""
                                }`}
                                aria-label="Open profile menu"
                                aria-expanded={showProfile}
                                onClick={() => {
                                    setShowNotifications(false);

                                    setShowProfile(value => !value);
                                }}
                            >
                                <span className="profile-avatar">
                                    <UserRound
                                        size={22}
                                        strokeWidth={2.2}
                                    />
                                </span>

                                <span className="profile-details">
                                    <strong>
                                        {profileName}
                                    </strong>

                                    <small>
                                        {adminpage
                                            ? "Admin Account"
                                            : "Student Account"}
                                    </small>
                                </span>

                                <span
                                    className={`profile-arrow ${
                                        showProfile ? "rotate" : ""
                                    }`}
                                >
                                    <ChevronDown size={16} />
                                </span>
                            </button>

                            {/* PROFILE INFORMATION PANEL */}

                            {showProfile && (
                                <div className="profile-dropdown">

                                    <div className="profile-dropdown-header">

                                        <div className="profile-dropdown-avatar">
                                            <UserRound size={29} />
                                        </div>

                                        <div className="profile-dropdown-user">
                                            <h3>{profileName}</h3>

                                            <span>
                                                {adminpage
                                                    ? "Administrator"
                                                    : "Student"}
                                            </span>
                                        </div>

                                    </div>

                                    <div className="profile-dropdown-divider" />

                                    <div className="profile-dropdown-info">

                                        <p className="profile-info-heading">
                                            ACCOUNT INFORMATION
                                        </p>

                                        <div className="profile-info-row">
                                            <span>Email</span>
                                            <strong>
                                                {profileEmail}
                                            </strong>
                                        </div>

                                        <div className="profile-info-row">
                                            <span>Account Type</span>
                                            <strong>
                                                {adminpage
                                                    ? "Admin"
                                                    : "Student"}
                                            </strong>
                                        </div>

                                        {!adminpage && profileDetails?.user_id && (
                                            <div className="profile-info-row">
                                                <span>Student ID</span>

                                                <strong>
                                                    {profileDetails.user_id}
                                                </strong>
                                            </div>
                                        )}

                                    </div>

                                    <div className="profile-dropdown-divider" />

                                    <div className="profile-dropdown-footer">

                                        <p>
                                            Manage your account through
                                            Raise Your Voice.
                                        </p>

                                        <button
                                            type="button"
                                            className="profile-logout-button"
                                            onClick={handleLogout}
                                        >
                                            <span>↪</span>
                                            Log Out
                                        </button>

                                    </div>

                                </div>
                            )}

                        </div>

                    </div>
                </header>

                {/* =================================
                    WELCOME BANNER
                ================================= */}

                <section className="welcome-banner">

                    <div className="welcome-content">

                        <p className="welcome-label">
                            {adminpage
                                ? "ADMINISTRATION PORTAL"
                                : "YOUR VOICE MATTERS"}
                        </p>

                        <h1>
                            {adminpage
                                ? `Welcome, ${admin?.admin_name || "Admin"}!`
                                : "Welcome, Student!"}
                        </h1>

                        <p className="welcome-description">
                            {adminpage
                                ? "Manage student complaints, review concerns, and monitor their progress."
                                : "Your concerns matter to us. Track your complaints and stay updated on their progress."}
                        </p>

                        {!adminpage && (
                            <button
                                type="button"
                                className="raise-button"
                                onClick={() =>
                                    navigate("/raisecomplaint", {
                                        state: { email }
                                    })
                                }
                            >
                                <span>+</span> Raise a Complaint
                            </button>
                        )}

                    </div>

                    <div className="welcome-decoration">
                        <div className="welcome-circle">
                            <span>V</span>
                        </div>
                    </div>

                </section>

                {/* =================================
                    DASHBOARD STATISTICS
                ================================= */}

                <section className="dashboard-stats">

                    {/* TOTAL COMPLAINTS */}

                    <div className="stat-card">
                        <div className="stat-top">
                            <span>Total Complaints</span>

                            <span className="stat-icon blue">
                                <ClipboardList size={19} />
                            </span>
                        </div>

                        <h2>
                            {loadingComplaints
                                ? "—"
                                : String(stats.total).padStart(2, "0")}
                        </h2>

                        <p>
                            {adminpage
                                ? "Complaints received"
                                : "Complaints submitted"}
                        </p>
                    </div>

                    {/* PENDING */}

                    <div className="stat-card">
                        <div className="stat-top">
                            <span>Pending</span>
                            <span className="stat-icon orange">◷</span>
                        </div>

                        <h2>
                            {loadingComplaints
                                ? "—"
                                : String(stats.pending).padStart(2, "0")}
                        </h2>

                        <p>Awaiting review</p>
                    </div>

                    {/* RESOLVED */}

                    <div className="stat-card">
                        <div className="stat-top">
                            <span>Resolved</span>
                            <span className="stat-icon green">✓</span>
                        </div>

                        <h2>
                            {loadingComplaints
                                ? "—"
                                : String(stats.resolved).padStart(2, "0")}
                        </h2>

                        <p>Successfully resolved</p>
                    </div>

                    {/* REJECTED */}

                    <div className="stat-card">
                        <div className="stat-top">
                            <span>Rejected</span>
                            <span className="stat-icon purple">×</span>
                        </div>

                        <h2>
                            {loadingComplaints
                                ? "—"
                                : String(stats.rejected).padStart(2, "0")}
                        </h2>

                        <p>Not approved</p>
                    </div>

                </section>

                {/* =================================
                    RECENT COMPLAINTS
                ================================= */}

                <section className="recent-complaints">

                    <div className="section-heading">

                        <div>
                            <h2>
                                {adminpage
                                    ? "Recent Student Complaints"
                                    : "Recent Complaints"}
                            </h2>

                            <p>
                                {adminpage
                                    ? "Review the latest complaints submitted by students."
                                    : "Keep track of your latest submissions."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="view-all-button"
                            onClick={() =>
                                navigate("/viewcomplaint", {
                                    state: dashboardState
                                })
                            }
                        >
                            View All →
                        </button>

                    </div>

                    {dashboardError && (
                        <p className="dashboard-data-error">
                            {dashboardError}
                        </p>
                    )}

                    <div className="complaints-table-wrapper">

                        <table className="complaints-table">

                            <thead>
                                <tr>
                                    <th>Complaint</th>
                                    <th>Complaint ID</th>
                                    <th>Date Submitted</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loadingComplaints ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="dashboard-table-message"
                                        >
                                            Loading complaints...
                                        </td>
                                    </tr>

                                ) : recentComplaints.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="dashboard-table-message"
                                        >
                                            No complaints found.
                                        </td>
                                    </tr>

                                ) : (
                                    recentComplaints.map(complaint => {
                                        const complaintStatus =
                                            complaint.status || "Pending";

                                        return (
                                            <tr
                                                key={complaint.complaint_id}
                                                className="dashboard-complaint-row"
                                                onClick={() =>
                                                    openComplaint(complaint)
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {complaint.title}
                                                    </strong>
                                                </td>

                                                <td>
                                                    #{complaint.complaint_id}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        complaint.created_at
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status-badge ${complaintStatus
                                                            .toLowerCase()
                                                            .replace(/\s+/g, "-")}`}
                                                    >
                                                        {complaintStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

                {/* =================================
                    FOOTER
                ================================= */}

                <footer className="dashboard-footer">
                    <p>Raise Your Voice © 2026</p>
                    <p>Your voice matters. We are here to listen.</p>
                </footer>

            </section>

        </main>
    );
}

export default Dashboard;
