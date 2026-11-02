
import { Link } from "react-router-dom";
import "../styles/homepage.css";

function Home() {
    return (
        <main className="home-page">

            {/* Navbar */}
            <nav className="home-navbar">
                <Link to="/" className="home-brand">
                    <span className="brand-icon">V</span>
                    <span>
                        Raise Your <strong>Voice</strong>
                    </span>
                </Link>

                <div className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#how-it-works">How It Works</a>
                </div>

                <div className="nav-actions">
                    <Link to="/loginpage" className="login-link">
                        Login
                    </Link>
                    <Link to="/signup" className="nav-cta">
                        Get Started <span>→</span>
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero-section" id="home">
                <div className="hero-content">
                    <div className="hero-tag">
                        <span className="live-dot"></span>
                        A BETTER CAMPUS STARTS WITH BEING HEARD
                    </div>

                    <h1>
                        Your voice can
                        <br />
                        make campus
                        <br />
                        <span>better.</span>
                    </h1>

                    <p className="hero-description">
                        A dedicated space for SRM AP students to raise
                        concerns, share feedback, and follow the progress
                        of their complaints. Because every voice deserves
                        to be heard.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/signup" className="primary-btn">
                            Create Account <span>↗</span>
                        </Link>

                        <a href="#how-it-works" className="secondary-btn">
                            Explore How It Works <span>↓</span>
                        </a>
                    </div>

                    <div className="trust-points">
                        <div>
                            <span className="trust-check">✓</span>
                            University email verification
                        </div>
                        <div>
                            <span className="trust-check">✓</span>
                            Transparent status tracking
                        </div>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="hero-visual">
                    <div className="visual-orb"></div>

                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div>
                                <span className="preview-eyebrow">
                                    STUDENT OVERVIEW
                                </span>
                                <h3>Your complaints</h3>
                            </div>
                            <span className="preview-avatar">S</span>
                        </div>

                        <div className="preview-stats">
                            <div className="preview-stat">
                                <span className="stat-label">Submitted</span>
                                <strong>04</strong>
                                <span className="stat-dot blue-dot"></span>
                            </div>

                            <div className="preview-stat">
                                <span className="stat-label">In progress</span>
                                <strong>02</strong>
                                <span className="stat-dot orange-dot"></span>
                            </div>

                            <div className="preview-stat">
                                <span className="stat-label">Resolved</span>
                                <strong>12</strong>
                                <span className="stat-dot green-dot"></span>
                            </div>
                        </div>

                        <div className="preview-activity">
                            <div className="activity-heading">
                                <h4>Recent activity</h4>
                                <span>Latest update</span>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon">W</div>
                                <div className="activity-copy">
                                    <strong>Campus Wi-Fi issue</strong>
                                    <span>Academic Block C</span>
                                </div>
                                <span className="status-progress">
                                    In progress
                                </span>
                            </div>

                            <div className="activity-timeline">
                                <span className="timeline-done"></span>
                                <span className="timeline-done"></span>
                                <span className="timeline-current"></span>
                            </div>

                            <div className="timeline-labels">
                                <span>Submitted</span>
                                <span>Under review</span>
                                <span>Resolution</span>
                            </div>
                        </div>
                    </div>

                    <div className="floating-note">
                        <span className="floating-check">✓</span>
                        <div>
                            <strong>Stay informed</strong>
                            <p>Follow every status update</p>
                        </div>
                    </div>

                    <div className="visual-caption">
                        <span className="caption-dot"></span>
                        Your concerns. Your campus. Your voice.
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section" id="how-it-works">
                <div className="section-heading" id="about">
                    <span className="section-kicker">BUILT FOR STUDENTS</span>
                    <h2>Speak up. Stay informed. Make a difference.</h2>
                    <p>
                        Everything you need to raise concerns and follow
                        what happens next.
                    </p>
                </div>

                <div className="feature-grid">
                    <article className="feature-card">
                        <div className="feature-icon icon-blue">↗</div>
                        <h3>Raise a concern</h3>
                        <p>
                            Submit campus-related complaints with clear
                            details and supporting evidence.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon icon-purple">◎</div>
                        <h3>Track progress</h3>
                        <p>
                            Check complaint status and follow updates
                            from submission through resolution.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon icon-green">▥</div>
                        <h3>See the bigger picture</h3>
                        <p>
                            Explore complaint statistics and understand
                            the issues affecting campus life.
                        </p>
                    </article>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-main">
                    <div className="footer-brand">
                        <Link to="/" className="home-brand">
                            <span className="brand-icon">V</span>
                            <span>
                                Raise Your <strong>Voice</strong>
                            </span>
                        </Link>

                        <p>
                            A platform where every student voice matters.
                            Together, we can build a better campus.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/loginpage">Login</Link>
                        <Link to="/signup">Create Account</Link>
                        <a href="#about">About Us</a>
                    </div>

                    <div className="footer-links">
                        <h4>Explore</h4>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#home">Our Mission</a>
            </div>
                </div>

                <div className="footer-bottom">
                    <span>© 2026 Raise Your Voice. All rights reserved.</span>
                    <span>
                        Raise Your Voice supported by
                        <strong> 18_29_08 </strong>
                    </span>
                    <span>Made for SRM AP students <span className="footer-heart">♥</span></span>
                </div>
            </footer>

        </main>
    );
}

export default Home;
