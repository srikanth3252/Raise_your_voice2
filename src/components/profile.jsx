import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/profile.css";

function Profile() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    const [userdetails, setuserdetails] = useState(null);
    const [error, setError] = useState("");

    // Get details from backend
    useEffect(() => {
        async function getUserDetails() {
            try {
                const res = await fetch(
                    "https://raise-your-voice2.onrender.com/get_user_details",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email: email })
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to fetch details");
                }

                if (data.message === "data delivered") {
                    setuserdetails(data.result);
                }
            } catch (err) {
                console.log(err.message);
                setError(err.message);
            }
        }

        if (email) {
            getUserDetails();
        } else {
            setError("Email not found. Please log in again.");
        }
    }, [email]);

    if (error) {
        return (
            <div className="profile-page">
                <h2>Unable to load profile</h2>
                <p>{error}</p>
                <button onClick={() => navigate("/loginpage")}>
                    Go to Login
                </button>
            </div>
        );
    }

    if (!userdetails) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="profile-page">
            <div className="user-profile-card">
                <h1>My Profile</h1>

                <div className="profile-avatar">
                    {userdetails.username.charAt(0).toUpperCase()}
                </div>

                <h2>{userdetails.username}</h2>
                <p>{userdetails.role}</p>

                <div className="profile-details">
                    <p>
                        <strong>User ID:</strong> {userdetails.user_id}
                    </p>

                    <p>
                        <strong>Username:</strong> {userdetails.username}
                    </p>

                    <p>
                        <strong>Email:</strong> {userdetails.email}
                    </p>

                    <p>
                        <strong>Account Created:</strong>{" "}
                        {new Date(userdetails.created_at).toLocaleDateString()}
                    </p>
                </div>

                <button onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}

export default Profile;