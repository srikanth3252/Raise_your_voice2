
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/signup.css";

function Signup() {
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");
    const [confirmpassword, setconfirmpassword] = useState("");
    const [emailid, setemailid] = useState("");
    const [otp, setotp] = useState("");
    const [errors, seterrors] = useState({});
    const [pop,setpop]=useState(false);

    async function sendotp() 
    {
        try 
        {
            const res = await fetch("https://raise-your-voice2.onrender.com/sendotp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: emailid })
            });

            const data = await res.json();
            console.log(data.message);
        } 
        catch (err) 
        {
            console.log(err.message);
        }
    }

    async function createaccount() 
    {
        const newerrors = {};

        if (!username.trim()) 
        {
            newerrors.username = "Username is required";
        }

        if (!emailid.trim())
        {
            newerrors.emailid = "Email is required";
        } 
        else if (!/^[^\s@]+@srmap\.edu\.in$/i.test(emailid.trim())) 
        {
            newerrors.emailid = "Enter a valid SRM AP email";
        }

        if (!password) 
        {
            newerrors.password = "Password is required";
        }

        if (!confirmpassword) 
        {
            newerrors.confirmpassword = "Confirm your password";
        } 
        else if (password !== confirmpassword) 
        {
            newerrors.confirmpassword = "Passwords do not match";
        }

        if (!otp.trim()) 
        {
            newerrors.otp = "OTP is required";
        } 
        else if (!/^\d{6}$/.test(otp)) 
        {
            newerrors.otp = "Enter a valid 6-digit OTP";
        }

        seterrors(newerrors);

        // Stop if any validation error exists.
        if (Object.keys(newerrors).length > 0) 
        {
            return;
        }

        // Keep your registration API call here.
        try 
        {
            const res = await fetch(
                "https://raise-your-voice2.onrender.com/verify_otp_insert_data",
                {
                    method: "POST",
                    headers: 
                    {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailid,
                        password,
                        username,
                        otp
                    })
                }
            );

            const data = await res.json();
            if(data.message==="data inserted in database successfully")
                pop=true;
            console.log(data.message)
            console.log(data.otpmessage);
        } 
        catch (err) 
        {
            console.log(err.message);
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

                <form className="signup-form">
                    <div className="signup-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setusername(e.target.value)}
                            placeholder="Choose a username"
                        />
                        {errors.username && (
                            <p className="error-text">{errors.username}</p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="emailid">University email</label>
                        <input
                            id="emailid"
                            type="email"
                            value={emailid}
                            onChange={(e) => setemailid(e.target.value)}
                            placeholder="you@srmap.edu.in"
                        />
                        {errors.emailid && (
                            <p className="error-text">{errors.emailid}</p>
                        )}
                    </div>

                    <div className="signup-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setpassword(e.target.value)}
                            placeholder="Create a password"
                        />
                        {errors.password && (
                            <p className="error-text">{errors.password}</p>
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
                        <label htmlFor="otp">Email verification OTP</label>
                        <div className="signup-otp-row">
                            <input
                                id="otp"
                                type="number"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setotp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                            />
                            <button
                                className="signup-send-otp"
                                type="button"
                                onClick={sendotp}
                            >
                                Send OTP
                            </button>
                        </div>
                        {errors.otp && (
                            <p className="error-text">{errors.otp}</p>
                        )}
                    </div>

                    <button
                        className="signup-submit"
                        type="button"
                        onClick={createaccount}
                    >
                        Create Account <span>→</span>
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
                        onClick={()=>{setpop=false}}
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
