
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/loginpage.css";
import ForgotPasswordModal from "./forgotpasswordmodal";

function Loginpage() {
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [errors, seterrors] = useState({});
    const [pop, setpop] = useState(false);
    const [message, setmessage] = useState("");
    const [loginSuccess, setloginSuccess] = useState(false);
    const [loading, setloading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const navigate = useNavigate();

    async function handlelogin(e) {
        e.preventDefault();

        const newerrors = {};

        if (!email.trim()) {
            newerrors.email = "Student ID or email is required";
        }

        if (!password) {
            newerrors.password = "Password is required";
        }

        seterrors(newerrors);

        if (Object.keys(newerrors).length > 0) return;

        try {
            setloading(true);

            const res = await fetch("http://localhost:2000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password
                })
            });

            const data = await res.json();

            if (res.ok) {
                const registeredEmail = data.email;

                if (!registeredEmail) {
                    setloginSuccess(false);
                    setmessage(
                        "Login response did not contain registered email."
                    );
                    setpop(true);
                    return;
                }

                localStorage.removeItem("email");
                localStorage.removeItem("role");

                localStorage.setItem("email", registeredEmail);
                localStorage.setItem("role", data.role || "student");

                setloginSuccess(true);
                setmessage(data.message || "Login successful!");
            } else {
                setloginSuccess(false);
                setmessage(
                    data.message || "Invalid Student ID/email or password"
                );
            }

            setpop(true);

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            setloginSuccess(false);
            setmessage("Unable to connect to server. Please try again.");
            setpop(true);

        } finally {
            setloading(false);
        }
    }

    function closePopup() {
        setpop(false);
    }

    function continueToDashboard() {
        setpop(false);

        navigate("/dashboard", {
            replace: true,
            state: {
                email: localStorage.getItem("email"),
            }
        });
    }

    return (
        <main className="login-page">

            {/* LOGIN SECTION */}
            <section className="login-card">

                {/* Brand */}
                <section className="login-brand">
                    <Link to="/" className="login-brand-link">
                        <span className="login-logo">V</span>
                        <span>
                            Raise Your <strong>Voice</strong>
                        </span>
                    </Link>
                </section>

                {/* Heading */}
                <div className="login-heading">
                    <h1>Welcome back</h1>

                    <p>
                        Log in to raise concerns and track your complaints.
                    </p>

                    <div className="admin-login-link">
                        <span>Are you an administrator?</span>

                        <button
                            type="button"
                            onClick={() => navigate("/Admin")}
                        >
                            Admin Login →
                        </button>
                    </div>
                </div>

                {/* Login Form */}
                <form className="login-form" onSubmit={handlelogin}>

                    <div className="login-field">
                        <label htmlFor="email">
                            Student ID or University Email
                        </label>

                        <input
                            id="email"
                            type="text"
                            autoComplete="username"
                            value={email}
                            className={errors.email ? "input-error" : ""}
                            onChange={(e) => {
                                setemail(e.target.value);
                                seterrors((prev) => ({
                                    ...prev,
                                    email: ""
                                }));
                            }}
                            placeholder="Enter Student ID or email"
                        />

                        {errors.email && (
                            <p className="error-text">{errors.email}</p>
                        )}
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            className={errors.password ? "input-error" : ""}
                            onChange={(e) => {
                                setpassword(e.target.value);
                                seterrors((prev) => ({
                                    ...prev,
                                    password: ""
                                }));
                            }}
                            placeholder="Enter your password"
                        />

                        {errors.password && (
                            <p className="error-text">{errors.password}</p>
                        )}
                    </div>

                    {/* Login Options */}
                    <div className="login-options">
                        <label className="remember-option">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>

                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => setShowForgotPassword(true)}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Log In"}
                        {!loading && <span> →</span>}
                    </button>

                </form>

                {/* Signup Link */}
                <p className="login-signup">
                    Don't have an account?{" "}
                    <Link to="/signup">Create account</Link>
                </p>

                {/* Trust Message */}
                <div className="login-security">
                    <span>✓</span>
                    Secure access for the SRM AP community
                </div>

            </section>

            {/* Login Result Popup */}
            {pop && (
                <div className="popup-overlay">
                    <div
                        className="popup-box"
                        role="alertdialog"
                        aria-modal="true"
                    >
                        <div className="popup-icon">
                            {loginSuccess ? "✓" : "!"}
                        </div>

                        <h2>
                            {loginSuccess
                                ? "Login Successful!"
                                : "Login Failed"}
                        </h2>

                        <p>{message}</p>

                        {loginSuccess ? (
                            <button
                                type="button"
                                className="popup-login-btn"
                                onClick={continueToDashboard}
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="popup-login-btn"
                                onClick={closePopup}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <ForgotPasswordModal
                    onClose={() => setShowForgotPassword(false)}
                />
            )}

            {/* LOGIN FOOTER */}
            <footer className="login-footer">

                <div className="login-footer-main">

                    <div className="login-footer-brand">
                        <Link to="/" className="login-brand-link">
                            <span className="login-logo">V</span>
                            <span>
                                Raise Your <strong>Voice</strong>
                            </span>
                        </Link>

                        <p>
                            A platform where every student voice matters.
                            Together, we can build a better campus.
                        </p>
                    </div>

                    <div className="login-footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/loginpage">Login</Link>
                        <Link to="/signup">Create Account</Link>
                    </div>

                    <div className="login-footer-links">
                        <h4>Explore</h4>
                        <Link to="/#about">About Us</Link>
                        <Link to="/#how-it-works">How It Works</Link>
                    </div>

                </div>

                <div className="login-footer-bottom">
                    <span>© 2026 Raise Your Voice. All rights reserved.</span>
                    <span>
                        Made for SRM AP students
                        <span className="login-footer-heart"> ♥</span>
                    </span>
                </div>

            </footer>

        </main>
    );
}

export default Loginpage;
