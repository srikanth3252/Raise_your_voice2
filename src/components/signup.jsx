
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/signup.css";

const API_URL = "https://raise-your-voice2.onrender.com";

function Signup() {
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");
    const [confirmpassword, setconfirmpassword] = useState("");
    const [emailid, setemailid] = useState("");
    const [otp, setotp] = useState("");
    const [errors, seterrors] = useState({});
    const [pop, setpop] = useState(false);
    const [message, setmessage] = useState("");
    const [loadingotp, setloadingotp] = useState(false);
    const [loadingaccount, setloadingaccount] = useState(false);

    async function sendotp() {
        setmessage("");

        if (!emailid.trim()) {
            seterrors({ emailid: "Email is required" });
            return;
        }

        if (!/^[^\s@]+@srmap\.edu\.in$/i.test(emailid.trim())) {
            seterrors({
                emailid: "Enter a valid SRM AP email",
            });
            return;
        }

        setloadingotp(true);

        try {
            const res = await fetch(`${API_URL}/sendotp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: emailid.trim(),
                }),
            });

            const data = await res.json();

            setmessage(data.message || "OTP request completed");

            if (!res.ok) {
                setmessage(data.message || "Failed to send OTP");
            }
        } catch (err) {
            setmessage("Unable to connect to server. Please try again.");
            console.error(err);
        } finally {
            setloadingotp(false);
        }
    }

    async function createaccount() {
        const newerrors = {};

        if (!username.trim()) {
            newerrors.username = "Username is required";
        }

        if (!emailid.trim()) {
            newerrors.emailid = "Email is required";
        } else if (
            !/^[^\s@]+@srmap\.edu\.in$/i.test(emailid.trim())
        ) {
            newerrors.emailid = "Enter a valid SRM AP email";
        }

        if (!password) {
            newerrors.password = "Password is required";
        }

        if (!confirmpassword) {
            newerrors.confirmpassword = "Confirm your password";
        } else if (password !== confirmpassword) {
            newerrors.confirmpassword = "Passwords do not match";
        }

        if (!otp.trim()) {
            newerrors.otp = "OTP is required";
        } else if (!/^\d{6}$/.test(otp)) {
            newerrors.otp = "Enter a valid 6-digit OTP";
        }

        seterrors(newerrors);
        setmessage("");

        if (Object.keys(newerrors).length > 0) {
            return;
        }

        setloadingaccount(true);

        try {
            const res = await fetch(
                `${API_URL}/verify_otp_insert_data`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: emailid.trim(),
                        password,
                        username: username.trim(),
                        otp,
                    }),
                }
            );

            const data = await res.json();

            if (
                res.ok &&
                data.message === "data inserted in database successfully"
            ) {
                setpop(true);
                setmessage("");
            } else {
                setmessage(
                    data.message || "Account creation failed"
                );
            }
        } catch (err) {
            setmessage("Unable to connect to server. Please try again.");
            console.error(err);
        } finally {
            setloadingaccount(false);
        }
    }

    return (
        <main className="signup-page">
            <section className="signup-card">

                <section className="signup-brand">
                    <span className="signup-logo">V</span>
                    <span>
                        Raise Your <strong>Voice</strong>
                    </span>
                </section>

                <div className="signup-heading">
                    <h1>Create your account</h1>
                    <p>
                        Make your voice heard. Create an account
                        to get started.
                    </p>
                </div>

                <form
                    className="signup-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="signup-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setusername(e.target.value)
                            }
                            placeholder="Choose a username"
                        />
                        {errors.username && (
                            <p className="error-text">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="emailid">
                            University email
                        </label>
                        <input
                            id="emailid"
                            type="email"
                            value={emailid}
                            onChange={(e) =>
                                setemailid(e.target.value)
                            }
                            placeholder="you@srmap.edu.in"
                        />
                        {errors.emailid && (
                            <p className="error-text">
                                {errors.emailid}
                            </p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setpassword(e.target.value)
                            }
                            placeholder="Create a password"
                        />
                        {errors.password && (
                            <p className="error-text">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="confirmpassword">
                            Confirm password
                        </label>
                        <input
                            id="confirmpassword"
                            type="password"
                            value={confirmpassword}
                            onChange={(e) =>
                                setconfirmpassword(e.target.value)
                            }
                            placeholder="Enter password again"
                        />
                        {errors.confirmpassword && (
                            <p className="error-text">
                                {errors.confirmpassword}
                            </p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="otp">
                            Email verification OTP
                        </label>

                        <div className="signup-otp-row">
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) =>
                                    setotp(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                placeholder="Enter 6-digit OTP"
                            />

                            <button
                                className="signup-send-otp"
                                type="button"
                                onClick={sendotp}
                                disabled={loadingotp}
                            >
                                {loadingotp
                                    ? "Sending..."
                                    : "Send OTP"}
                            </button>
                        </div>

                        {errors.otp && (
                            <p className="error-text">
                                {errors.otp}
                            </p>
                        )}
                    </div>

                    {message && (
                        <p className="error-text">
                            {message}
                        </p>
                    )}

                    <button
                        className="signup-submit"
                        type="button"
                        onClick={createaccount}
                        disabled={loadingaccount}
                    >
                        {loadingaccount
                            ? "Creating Account..."
                            : <>Create Account <span>→</span></>}
                    </button>
                </form>

                <p className="signup-login">
                    Already have an account?{" "}
                    <Link to="/loginpage">Log in</Link>
                </p>

                <div className="signup-security">
                    <span>✓</span>
                    University email verification
                </div>
            </section>

            {pop && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <div className="popup-icon">✓</div>

                        <h2>Account Created Successfully!</h2>

                        <p>
                            Your account has been created successfully.
                            You can now log in to your account.
                        </p>

                        <Link
                            to="/loginpage"
                            className="popup-login-btn"
                            onClick={() => setpop(false)}
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Signup;
