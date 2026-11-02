
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/admin.css";

function Admin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admindetails, setadmindetails] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showpopup, setshowpopup] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email or username and password.");
      return;
    }

    try {
      const res = await fetch("https://raise-your-voice2.onrender.com/verify_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await res.json();

      if (data.ok) {
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        localStorage.setItem("email", data.admin.email);
        localStorage.setItem("role", "admin");

        setshowpopup(true);
        setadmindetails(data.admin);

        console.log(data.message);
      } else {
        setError(
          "You are not an admin. Please check your credentials or go to the Student Login page."
        );
      }
    } catch (err) {
      console.log(err.message);
      setError("Unable to connect to server. Please try again.");
    }
  }

  return (
    <main className="admin-login-page">

      {/* ADMIN LOGIN CARD */}
      <section className="admin-login-card">

        <div className="admin-brand">
          <Link to="/" className="admin-brand-link">
            <div className="admin-brand-icon">V</div>
            <h2>
              Raise Your <span>Voice</span>
            </h2>
          </Link>
        </div>

        <h1>Admin Login</h1>

        <p className="admin-subtitle">
          Sign in to manage student grievances.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="admin-form-group">
            <label htmlFor="admin-email">
              University email or username
            </label>

            <input
              id="admin-email"
              type="text"
              placeholder="Enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="admin-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="admin-login-button">
            Admin Log In <span>→</span>
          </button>

        </form>

        <div className="admin-back-link">
          Not an administrator?{" "}
          <button
            type="button"
            onClick={() => navigate("/loginpage")}
          >
            Student Login
          </button>
        </div>

        <div className="admin-security-note">
          <span>✓</span>
          Authorized administrators only
        </div>

      </section>

      {/* ADMIN SUCCESS POPUP */}
      {showpopup && (
        <div className="admin-success-overlay">
          <div className="admin-success-box">
            <div className="admin-success-icon">✓</div>

            <h2>Login Successful!</h2>

            <p>
              Welcome back, Admin. You have successfully logged in.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard", {
                  replace: true,
                  state: {
                    admindetails: admindetails,
                    adminpage: true
                  }
                })
              }
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* ADMIN FOOTER */}
      <footer className="admin-footer">

        <div className="admin-footer-main">

          <div className="admin-footer-brand">
            <Link to="/" className="admin-brand-link">
              <div className="admin-brand-icon">V</div>
              <h2>
                Raise Your <span>Voice</span>
              </h2>
            </Link>

            <p>
              A platform where every student voice matters.
              Together, we can build a better campus.
            </p>
          </div>

          <div className="admin-footer-links">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/loginpage">Student Login</Link>
            <Link to="/signup">Create Account</Link>
          </div>

          <div className="admin-footer-links">
            <h4>Explore</h4>
            <Link to="/#about">About Us</Link>
            <Link to="/#how-it-works">How It Works</Link>
          </div>

        </div>

        <div className="admin-footer-bottom">
          <span>© 2026 Raise Your Voice. All rights reserved.</span>
          <span>
            Made for SRM AP students
            <span className="admin-footer-heart"> ♥</span>
          </span>
        </div>

      </footer>

    </main>
  );
}

export default Admin;
