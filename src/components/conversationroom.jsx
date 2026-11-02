
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessagesSquare, Send, ArrowLeft, AlertCircle } from "lucide-react";
import "../styles/conversationroom.css";

function ConversationRoom() {
    const location = useLocation();
    const navigate = useNavigate();

    const complaint = location.state?.complaintdetails;
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

    const complaintId = complaint?.complaint_id;

    // STATES
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const messagesEndRef = useRef(null);

    // FETCH MESSAGES
    const fetchMessages = useCallback(async () => {
        if (!complaintId || !email || !role) {
            setLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({
                email,
                role
            });

            const response = await fetch(
                `https://raise-your-voice2.onrender.com/conversation/${complaintId}?${params.toString()}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load messages."
                );
            }

            setMessages(data.messages || []);
            setError("");

        } catch (err) {
            setError(
                err.message || "Unable to load conversation."
            );
        } finally {
            setLoading(false);
        }
    }, [complaintId, email, role]);

    // INITIAL FETCH + AUTO REFRESH
    useEffect(() => {
        if (!complaintId || !email || !role) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchMessages();

        const interval = setInterval(() => {
            fetchMessages();
        }, 5000);

        return () => clearInterval(interval);

    }, [fetchMessages, complaintId, email, role]);

    // SCROLL TO LATEST MESSAGE
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    // SEND MESSAGE
    async function handleSendMessage(e) {
        e.preventDefault();

        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage || sending) return;

        if (!email || !role) {
            setError("Please log in again to send messages.");
            return;
        }

        if (trimmedMessage.length > 2000) {
            setError("Message cannot exceed 2000 characters.");
            return;
        }

        try {
            setSending(true);
            setError("");

            const response = await fetch(
                "https://raise-your-voice2.onrender.com/conversation",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        complaint_id: complaintId,
                        email,
                        role,
                        message: trimmedMessage
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to send message."
                );
            }

            setNewMessage("");
            await fetchMessages();

        } catch (err) {
            setError(
                err.message || "Something went wrong."
            );
        } finally {
            setSending(false);
        }
    }

    // CHECK COMPLAINT
    if (!complaint || !complaintId) {
        return (
            <div className="conversation-error-page">
                <h2>Conversation not available</h2>

                <p>
                    Please open the Conversation Room from a complaint.
                </p>

                <button onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    Go Back
                </button>
            </div>
        );
    }

    // MAIN JSX
    return (
        <div className="conversation-page">

            <div className="conversation-container">

                {/* HEADER */}
                <header className="conversation-header">

                    <button
                        className="conversation-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <h1>Conversation Room</h1>

                    <p className="conversation-subtitle">
                        Complaint #{complaintId}
                    </p>

                </header>

                {/* INTRODUCTION */}
                <section className="conversation-info">

                    <h3>Private Conversation Room</h3>

                    <p>
                        This conversation is private and is available
                        only to the student who submitted this complaint
                        and authorized university administrators.
                    </p>

                    <p className="conversation-role-info">
                        {role === "admin"
                            ? "You are communicating as University Administration. You can respond to the student and provide official updates."
                            : "You are communicating anonymously with University Administration. Your name is not displayed in this conversation."
                        }
                    </p>

                </section>

                {/* COMPLAINT DETAILS */}
                <section className="conversation-complaint">

                    <span>Complaint Details</span>

                    <h3>{complaint.title}</h3>

                    <p>
                        Category: {complaint.category}
                    </p>

                    <p>
                        Status: {complaint.status}
                    </p>

                </section>

                {/* CHAT */}
                <section className="conversation-chat">

                    <div className="conversation-messages">

                        {loading ? (
                            <p className="conversation-empty">
                                Loading messages...
                            </p>
                        ) : messages.length === 0 ? (
                            <div className="conversation-empty">
                                <MessagesSquare size={35} />

                                <h3>No messages yet</h3>

                                <p>
                                    Start a private conversation with
                                    University Administration.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => {

                                const isMine =
                                    msg.sender_role === role;

                                return (
                                    <div
                                        key={msg.message_id}
                                        className={`conversation-message ${
                                            isMine
                                                ? "my-message"
                                                : "other-message"
                                        }`}
                                    >

                                        {/* SENDER NAME HIDDEN */}
                                        <div className="message-sender">
                                            {msg.sender_role === "admin"
                                                ? "University Administration"
                                                : "Anonymous Student"
                                            }
                                        </div>

                                        <div className="message-bubble">
                                            {msg.message}
                                        </div>

                                        <div className="message-time">
                                            {msg.created_at
                                                ? new Date(
                                                    msg.created_at
                                                ).toLocaleString()
                                                : ""
                                            }
                                        </div>

                                    </div>
                                );
                            })
                        )}

                        <div ref={messagesEndRef} />

                    </div>

                    {/* ERROR */}
                    {error && (
                        <p className="conversation-error">
                            <AlertCircle size={15} />
                            {error}
                        </p>
                    )}

                    {/* MESSAGE INPUT */}
                    <form
                        className="conversation-input-area"
                        onSubmit={handleSendMessage}
                    >

                        <input
                            type="text"
                            placeholder="Write a private message..."
                            value={newMessage}
                            onChange={(e) =>
                                setNewMessage(e.target.value)
                            }
                            maxLength={2000}
                        />

                        <button
                            type="submit"
                            disabled={
                                !newMessage.trim() || sending || loading
                            }
                        >
                            <Send size={16} />

                            {sending ? "Sending..." : "Send"}
                        </button>

                    </form>

                </section>

            </div>

        </div>
    );
}

export default ConversationRoom;
