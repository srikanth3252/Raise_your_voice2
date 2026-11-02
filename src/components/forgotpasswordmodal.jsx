
import { useState } from "react";
import "../styles/forgotpasswordmodal.css";

function ForgotPasswordModal({ onClose }) {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function callAPI(endpoint, body) {
        const response = await fetch(`https://raise-your-voice2.onrender.com/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        return data;
    }

    async function sendOTP() {
        if (!email.trim()) {
            setError("Please enter your registered email.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data = await callAPI("forgot-password", {
                email: email.trim()
            });

            setOtpSent(true);
            setMessage(data.message || "OTP sent to your email.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function verifyOTP() {
        if (!otp.trim()) {
            setError("Please enter the OTP.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data = await callAPI("verify-reset-otp", {
                email: email.trim(),
                otp: otp.trim()
            });

            setVerified(true);
            setMessage(data.message || "OTP verified successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function resetPassword() {
        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data = await callAPI("reset-password", {
                email: email.trim(),
                newPassword
            });

            setMessage(data.message || "Password reset successfully!");

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="forgot-overlay" onClick={onClose}>
            <div
                className="forgot-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="forgot-close"
                    type="button"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2>Forgot Password?</h2>
                <p className="forgot-description">
                    Reset your Raise Your Voice account password.
                </p>

                {!otpSent && (
                    <>
                        <label>Registered Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your registered email"
                        />

                        <button
                            type="button"
                            onClick={sendOTP}
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </>
                )}

                {otpSent && !verified && (
                    <>
                        <label>Enter OTP</label>
                        <input
                            type="text"
                            value={otp}
                            maxLength={6}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                        />

                        <button
                            type="button"
                            onClick={verifyOTP}
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                            type="button"
                            className="forgot-secondary"
                            onClick={sendOTP}
                            disabled={loading}
                        >
                            Resend OTP
                        </button>
                    </>
                )}

                {verified && (
                    <>
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />

                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />

                        <button
                            type="button"
                            onClick={resetPassword}
                            disabled={loading}
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </>
                )}

                {message && (
                    <p className="forgot-success">{message}</p>
                )}

                {error && (
                    <p className="forgot-error">{error}</p>
                )}
            </div>
        </div>
    );
}

export default ForgotPasswordModal;
