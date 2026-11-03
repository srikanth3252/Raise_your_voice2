

import { useEffect, useState, useRef } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { createPortal } from "react-dom";

import {

    MessageCircle,

    MessagesSquare,

    ArrowLeft,

    FileText,

    CalendarDays,

    ThumbsUp,

    Tag,

    X,

    Send,

    AlertCircle,

    CheckCircle,

    Clock

} from "lucide-react";



import "../styles/complaintdetailspage.css";

import "../styles/comments.css";



const API = "https://raise-your-voice2.onrender.com";



function ComplaintDetails() {

    const role = localStorage.getItem("role");

    const email = localStorage.getItem("email");
    const [showAccessDenied, setShowAccessDenied] = useState(false);


    const location = useLocation();

    const navigate = useNavigate();



    const receivedComplaint = location.state?.complaintdetails;



    const complaint =

        receivedComplaint?.result ||

        receivedComplaint?.complaint ||

        receivedComplaint;



    const complaintId = complaint?.complaint_id;



    // GENERAL STATES

    const [status, setStatus] = useState(complaint?.status || "Pending");

    const [error, setError] = useState("");



    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");

    // ADMIN DECISION STATES

    const [decision, setDecision] = useState("");

    const [decisionReason, setDecisionReason] = useState("");

    const [decisionProof, setDecisionProof] = useState(null);

    const [updating, setUpdating] = useState(false);



    // STUDENT DECISION HISTORY

    const [history, setHistory] = useState(null);

    const [loadingHistory, setLoadingHistory] = useState(false);



    // SUPPORT STATES

    const [likes, setLikes] = useState(

        Number(

            complaint?.total_likes ??

            complaint?.totalLikes ??

            complaint?.totallikes ??

            0

        )

    );



    const [liked, setLiked] = useState(false);

    const [liking, setLiking] = useState(false);

    const [loadingLikeStatus, setLoadingLikeStatus] = useState(true);



    // COMMENTS STATES

    const [showComments, setShowComments] = useState(false);

    const [comments, setComments] = useState([]);

    const [commentText, setCommentText] = useState("");

    const [loadingComments, setLoadingComments] = useState(false);

    const [postingComment, setPostingComment] = useState(false);

    const [commentError, setCommentError] = useState("");



    // CONVERSATION STATES

    const [showConversation, setShowConversation] = useState(

        Boolean(location.state?.openConversation)

    );



    const [messages, setMessages] = useState([]);

    const [newMessage, setNewMessage] = useState("");

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [sendingMessage, setSendingMessage] = useState(false);

    const [conversationError, setConversationError] = useState("");



    const messagesEndRef = useRef(null);



    // FETCH LIKE STATUS

    useEffect(() => {

        let cancelled = false;



        async function fetchLikeStatus() {

            if (role !== "student" || !email || !complaintId) {

                setLoadingLikeStatus(false);

                return;

            }



            try {

                const params = new URLSearchParams({

                    email,

                    complaint_id: String(complaintId)

                });



                const response = await fetch(

                    `${API}/likes/status?${params.toString()}`

                );



                const data = await response.json();



                if (!response.ok) {

                    throw new Error(data.message || "Unable to fetch support status.");

                }



                if (!cancelled) {

                    setLiked(Boolean(data.liked));

                    setLikes(Number(data.totalLikes ?? 0));

                }

            } catch (err) {

                if (!cancelled) setError(err.message);

            } finally {

                if (!cancelled) setLoadingLikeStatus(false);

            }

        }



        fetchLikeStatus();



        return () => {

            cancelled = true;

        };

    }, [email, role, complaintId]);



    // FETCH DECISION HISTORY

    async function fetchDecisionHistory() {

        if (!complaintId) return;



        setLoadingHistory(true);



        try {

            const response = await fetch(

                `${API}/complaint-status-history/${complaintId}`

            );



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to load decision history.");

            }



            setHistory(data.history || null);

        } catch (err) {

            console.error("Decision history error:", err);

        } finally {

            setLoadingHistory(false);

        }

    }



    useEffect(() => {

        if (role === "student" && complaintId) {

            fetchDecisionHistory();

        }

    }, [role, complaintId]);



    // TOGGLE SUPPORT

    async function handleLikes() {

        if (

            role !== "student" ||

            liking ||

            loadingLikeStatus

        ) return;



        if (!email) {

            setError("Please log in to support this complaint.");

            return;

        }



        setLiking(true);

        setError("");



        try {

            const response = await fetch(`${API}/likes`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,

                    complaint_id: complaintId

                })

            });



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to update support.");

            }



            setLiked(Boolean(data.liked));

            setLikes(Number(data.totalLikes));

        } catch (err) {

            setError(err.message || "Unable to update support.");

        } finally {

            setLiking(false);

        }

    }



    // FETCH COMMENTS

    async function fetchComments() {

        setLoadingComments(true);

        setCommentError("");



        try {

            const response = await fetch(

                `${API}/comments/${complaintId}`

            );



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to fetch comments.");

            }



            setComments(data.comments || data.result || []);

        } catch (err) {

            setCommentError(err.message || "Unable to load comments.");

        } finally {

            setLoadingComments(false);

        }

    }



    function openComments() {
    setCommentText("");
    setCommentError("");
    setShowComments(true);
    fetchComments();
}



    // PREVENT BACKGROUND SCROLL

    useEffect(() => {

        document.body.classList.toggle("comments-open", showComments);



        return () => {

            document.body.classList.remove("comments-open");

        };

    }, [showComments]);



    // POST COMMENT

    async function handlePostComment(e) {

        e.preventDefault();



        const trimmedComment = commentText.trim();



        if (role !== "student") {

            setCommentError("Only students can post comments.");

            return;

        }



        if (!trimmedComment) {

            setCommentError("Please enter a comment.");

            return;

        }



        if (trimmedComment.length > 1000) {

            setCommentError("Comment cannot exceed 1000 characters.");

            return;

        }



        if (!email) {

            setCommentError("Please log in to post a comment.");

            return;

        }



        setPostingComment(true);

        setCommentError("");



        try {

            const response = await fetch(`${API}/comments`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,

                    complaint_id: complaintId,

                    comment: trimmedComment

                })

            });



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to post comment.");

            }



            setCommentText("");

            await fetchComments();

        } catch (err) {

            setCommentError(err.message || "Unable to post comment.");

        } finally {

            setPostingComment(false);

        }

    }



    // ADMIN UPDATE STATUS

    async function updateStatus(e) {

        e.preventDefault();



        if (role !== "admin" || updating) return;



        if (!["Resolved", "Rejected"].includes(decision)) {

            setError("Please select Resolved or Rejected.");

            return;

        }



        if (!decisionReason.trim()) {

            setError("Please provide a reason for your decision.");

            return;

        }



        if (status !== "Pending") {

            setError("This complaint already has a final decision.");

            return;

        }



        setUpdating(true);

        setError("");



        try {

            const formData = new FormData();



            formData.append("complaint_id", complaintId);

            formData.append("email", email);

            formData.append("status", decision);

            formData.append("reason", decisionReason.trim());



            if (decisionProof) {

                formData.append("proof", decisionProof);

            }



            const response = await fetch(

                `${API}/updatecomplaintstatus`,

                {

                    method: "POST",

                    body: formData

                }

            );



            const responseText = await response.text();

console.log("Backend response:", responseText);



let data = {};



try {

    data = JSON.parse(responseText);

} catch {

    data = { message: responseText };

}



            if (!response.ok) {

                throw new Error(data.message || "Unable to update complaint.");

            }



            setStatus(decision);

            setHistory(data.history || {

                new_status: decision,

                reason: decisionReason.trim(),

                proof: data.proof || null,

                admin_name: data.admin_name || "University Administration",

                created_at: new Date().toISOString()

            });



            setDecision("");

            setDecisionReason("");

            setDecisionProof(null);



            setSuccessMessage(

                data.message || `Complaint ${decision.toLowerCase()} successfully!`

            );

            setShowSuccessPopup(true);



            await fetchDecisionHistory();

        } catch (err) {

            setError(err.message || "Something went wrong.");

        } finally {

            setUpdating(false);

        }

    }



    // FETCH CONVERSATION MESSAGES

    async function fetchMessages() {

        if (!complaintId || !email || !role) return;



        try {

            const params = new URLSearchParams({

                email,

                role

            });



            const response = await fetch(

                `${API}/conversation/${complaintId}?${params.toString()}`

            );



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to load conversation.");

            }



            setMessages(data.messages || []);

            setConversationError("");

        } catch (err) {

            setConversationError(err.message || "Unable to load messages.");

        } finally {

            setLoadingMessages(false);

        }

    }



    async function toggleConversation() {
    if (showConversation) {
        setShowConversation(false);
        return;
    }

    if (!email || !role || !complaintId) {
        setShowAccessDenied(false);
        alert("Please log in to access the conversation.");
        return;
    }

    try {
        const params = new URLSearchParams({ email, role });

        const response = await fetch(
            `${API}/conversation/${complaintId}?${params.toString()}`
        );

        const data = await response.json();

        if (response.status === 403) {
            setShowAccessDenied(true);
            return;
        }

        if (!response.ok) {
            alert(data.message || "Unable to open conversation.");
            return;
        }

        setMessages(data.messages || []);
        setConversationError("");
        setShowConversation(true);
    } catch (error) {
        console.error("Conversation error:", error);
        alert("Unable to connect to the server.");
    }
}



    // FETCH MESSAGES WHEN CHAT IS OPEN

    useEffect(() => {

        if (!showConversation || !complaintId) return;



        setLoadingMessages(true);

        fetchMessages();



        const interval = setInterval(() => {

            fetchMessages();

        }, 5000);



        return () => clearInterval(interval);

    }, [showConversation, complaintId, email, role]);



    // SCROLL TO LATEST MESSAGE

    useEffect(() => {

        if (showConversation) {

            messagesEndRef.current?.scrollIntoView({

                behavior: "smooth"

            });

        }

    }, [messages, showConversation]);



    // SEND CONVERSATION MESSAGE

    async function handleSendMessage(e) {

        e.preventDefault();



        const trimmedMessage = newMessage.trim();



        if (!trimmedMessage || sendingMessage) return;



        if (!email || !role) {

            setConversationError("Please log in again to send messages.");

            return;

        }



        setSendingMessage(true);

        setConversationError("");



        try {

            const response = await fetch(`${API}/conversation`, {

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

            });



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message || "Unable to send message.");

            }



            setNewMessage("");

            await fetchMessages();

        } catch (err) {

            setConversationError(err.message || "Unable to send message.");

        } finally {

            setSendingMessage(false);

        }

    }



    // CHECK COMPLAINT

    if (!complaint || !complaintId) {

        return (

            <div className="container">

                <h2>No Complaint Found</h2>

                <button onClick={() => navigate(-1)}>

                    Go Back

                </button>

            </div>

        );

    }



    // COMPLAINT PROOF URL

    const proofUrl = complaint.proof

        ? `${API}/${complaint.proof.replace(/\\/g, "/")}`

        : "";



    const extension = complaint.proof

        ? complaint.proof.split(".").pop().toLowerCase()

        : "";



    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    const videoExtensions = ["mp4", "webm", "mov", "avi"];



    // DECISION PROOF URL

    const decisionProofUrl = history?.proof

        ? `${API}/${history.proof.replace(/\\/g, "/")}`

        : "";



    const decisionProofExtension = history?.proof

        ? history.proof.split(".").pop().toLowerCase()

        : "";



    return (

        <div

            className={`complaint-conversation-layout ${

                showConversation ? "chat-open" : ""

            }`}

        >

            {/* LEFT SIDE: COMPLAINT DETAILS */}

            <section className="complaint-details-panel">

                <div className="container">



                    <button

                        className="back-button"

                        onClick={() => navigate(-1)}

                    >

                        <ArrowLeft size={17} />

                        Back

                    </button>



                    <h1 className="page-title">

                        Complaint Details

                    </h1>



                    <p className="subtitle">

                        Complete information regarding the selected complaint

                    </p>



                    {/* COMPLAINT HEADER */}

                    <div className="complaint-header">

                        <div className="complaint-heading-row">

                            <div>

                                <h2 className="complaint-title">

                                    {complaint.title}

                                </h2>



                                <p className="category">

                                    <Tag size={15} />

                                    {complaint.category}

                                </p>

                            </div>



                            <span

                                className={`status status-${status

                                    .toLowerCase()

                                    .replace(/\s+/g, "-")}`}

                            >

                                {status}

                            </span>

                        </div>



                        <p className="complaint-id">

                            Complaint ID: #{complaintId}

                        </p>

                    </div>



                    {/* INFORMATION CARDS */}

                    <div className="info-row">

                        <div className="info-card">

                            <h3>Status</h3>

                            <p>{status}</p>

                        </div>



                        <div className="info-card">

                            <h3>

                                <CalendarDays size={15} />

                                Created Date

                            </h3>



                            <p>

                                {complaint.created_at

                                    ? new Date(complaint.created_at).toLocaleString()

                                    : "Not available"}

                            </p>

                        </div>



                        <div className="info-card">

                            <h3>

                                <ThumbsUp size={15} />

                                Supports

                            </h3>

                            <p>{likes}</p>

                        </div>

                    </div>



                    {/* DESCRIPTION */}

                    <div className="section">

                        <h2>Description</h2>



                        <div className="description-box">

                            {complaint.description || "No description provided."}

                        </div>

                    </div>



                    {/* ATTACHED PROOF */}

                    <div className="section">

                        <h2>

                            <FileText size={19} />

                            Attached Proof

                        </h2>



                        <div id="proofContainer">

                            {!proofUrl && (

                                <p>No proof attached to this complaint.</p>

                            )}



                            {imageExtensions.includes(extension) && (

                                <img

                                    src={proofUrl}

                                    alt="Complaint proof"

                                    className="proof-image"

                                />

                            )}



                            {videoExtensions.includes(extension) && (

                                <video

                                    src={proofUrl}

                                    controls

                                    className="proof-video"

                                />

                            )}



                            {extension === "pdf" && (

                                <iframe

                                    src={proofUrl}

                                    width="100%"

                                    height="400"

                                    title="Complaint proof PDF"

                                />

                            )}



                            {proofUrl &&

                                !imageExtensions.includes(extension) &&

                                !videoExtensions.includes(extension) &&

                                extension !== "pdf" && (

                                    <a

                                        href={proofUrl}

                                        target="\_blank"

                                        rel="noreferrer"

                                    >

                                        View / Download Attached Proof

                                    </a>

                                )}

                        </div>

                    </div>



                    {/* STUDENT AND ADMIN ACTIONS */}

                    <div className="section complaint-actions-section">

                        <h2>Complaint Actions</h2>



                        <div className="complaint-page-actions">



                            {role === "student" && (

                                <button

                                    type="button"

                                    className={`detail-support-btn ${

                                        liked ? "liked" : ""

                                    }`}

                                    onClick={handleLikes}

                                    disabled={liking || loadingLikeStatus}

                                >

                                    <ThumbsUp

                                        size={17}

                                        fill={liked ? "currentColor" : "none"}

                                    />



                                    {loadingLikeStatus

                                        ? "Loading..."

                                        : liking

                                            ? "Updating..."

                                            : liked

                                                ? "Supported"

                                                : "Support"}

                                </button>

                            )}



                            <div className="detail-support-count">

                                <ThumbsUp size={17} />

                                {likes} Supports

                            </div>



                            <button

                                type="button"

                                className="comments-page-btn"

                                onClick={openComments}

                            >

                                <MessageCircle size={17} />

                                View Comments

                            </button>



                            <button

                                type="button"

                                className="conversation-btn"

                                onClick={toggleConversation}

                            >

                                <MessagesSquare size={17} />



                                {showConversation

                                    ? "Close Conversation"

                                    : "Conversation Room"}

                            </button>

                        </div>

                    </div>



                    {/* ADMIN DECISION FORM */}

                    {role === "admin" && (

                        <div id="adminControls" className="section">

                            <h2>Admin Decision</h2>



                            {status === "Pending" ? (

                                <form onSubmit={updateStatus}>

                                    <div className="admin-buttons">

                                        <button

                                            type="button"

                                            className={`resolved-btn ${

                                                decision === "Resolved" ? "selected" : ""

                                            }`}

                                            onClick={() => setDecision("Resolved")}

                                        >

                                            <CheckCircle size={16} />

                                            Mark Resolved

                                        </button>



                                        <button

                                            type="button"

                                            className={`reject-btn ${

                                                decision === "Rejected" ? "selected" : ""

                                            }`}

                                            onClick={() => setDecision("Rejected")}

                                        >

                                            <X size={16} />

                                            Reject Complaint

                                        </button>

                                    </div>





{decision && (

    <div

        className="decision-modal-overlay"

        onClick={() => {

            setDecision("");

            setDecisionReason("");

            setDecisionProof(null);

        }}

    >

        <div

            className="decision-modal"

            onClick={(e) => e.stopPropagation()}

        >

            <button

                type="button"

                className="decision-modal-close"

                onClick={() => {

                    setDecision("");

                    setDecisionReason("");

                    setDecisionProof(null);

                }}

            >

                <X size={20} />

            </button>



            <div className={`decision-modal-icon ${decision.toLowerCase()}`}>

                {decision === "Resolved"

                    ? <CheckCircle size={30} />

                    : <X size={30} />}

            </div>



            <h2>

                {decision === "Resolved"

                    ? "Resolve Complaint"

                    : "Reject Complaint"}

            </h2>



            <p className="decision-modal-subtitle">

                {decision === "Resolved"

                    ? "Confirm that this complaint has been resolved."

                    : "Please explain why this complaint is being rejected."}

            </p>



            <label htmlFor="decisionReason">

                Reason / Explanation \*

            </label>



            <textarea

                id="decisionReason"

                value={decisionReason}

                onChange={(e) => setDecisionReason(e.target.value)}

                placeholder="Enter your explanation..."

                rows={4}

                maxLength={2000}

                required

            />



            <label htmlFor="decisionProof">

                Attach Decision Proof (Optional)

            </label>



            <input

                id="decisionProof"

                type="file"

                accept="image/\*,video/\*,.pdf,.doc,.docx"

                onChange={(e) =>

                    setDecisionProof(e.target.files?.[0] || null)

                }

            />



            {decisionProof && (

                <p className="selected-proof">

                    Selected: {decisionProof.name}

                </p>

            )}



            <div className="decision-modal-actions">

                <button

                    type="button"

                    className="decision-cancel-btn"

                    onClick={() => {

                        setDecision("");

                        setDecisionReason("");

                        setDecisionProof(null);

                    }}

                    disabled={updating}

                >

                    Cancel

                </button>



                <button

                    type="submit"

                    className={

                        decision === "Resolved"

                            ? "decision-confirm-resolve"

                            : "decision-confirm-reject"

                    }

                    disabled={updating || !decisionReason.trim()}

                >

                    {updating

                        ? "Submitting..."

                        : `Confirm ${decision}`}

                </button>

            </div>

        </div>

    </div>

)}



                                </form>

                            ) : (

                                <p>

                                    This complaint already has a final decision:

                                    <strong> {status}</strong>

                                </p>

                            )}

                        </div>

                    )}



                    {/* STUDENT DECISION HISTORY */}

                    {role === "student" && (

                        <div className="section decision-history">

                            <h2>

                                <FileText size={19} />

                                University Decision

                            </h2>



                            {loadingHistory ? (

                                <p>Loading decision details...</p>

                            ) : history ? (

                                <div className="decision-history-card">

                                    <h3>

                                        Decision: {history.new_status}

                                    </h3>



                                    <p>

                                        <strong>Administrator:</strong>{" "}

                                        {history.admin_name || "University Administration"}

                                    </p>



                                    <p>

                                        <strong>Reason:</strong>

                                    </p>



                                    <div className="description-box">

                                        {history.reason || "No reason provided."}

                                    </div>



                                    <p>

                                        <Clock size={15} />

                                        {" "}

                                        {history.created_at

                                            ? new Date(history.created_at).toLocaleString()

                                            : ""}

                                    </p>



                                    {decisionProofUrl && (

                                        <div className="decision-proof">

                                            <h4>Decision Proof</h4>



                                            {imageExtensions.includes(

                                                decisionProofExtension

                                            ) && (

                                                <img

                                                    src={decisionProofUrl}

                                                    alt="Decision proof"

                                                    className="proof-image"

                                                />

                                            )}



                                            {videoExtensions.includes(

                                                decisionProofExtension

                                            ) && (

                                                <video

                                                    src={decisionProofUrl}

                                                    controls

                                                    className="proof-video"

                                                />

                                            )}



                                            {decisionProofExtension === "pdf" && (

                                                <iframe

                                                    src={decisionProofUrl}

                                                    width="100%"

                                                    height="400"

                                                    title="Decision proof PDF"

                                                />

                                            )}



                                            {!imageExtensions.includes(

                                                decisionProofExtension

                                            ) &&

                                                !videoExtensions.includes(

                                                    decisionProofExtension

                                                ) &&

                                                decisionProofExtension !== "pdf" && (

                                                    <a

                                                        href={decisionProofUrl}

                                                        target="\_blank"

                                                        rel="noreferrer"

                                                    >

                                                        View / Download Decision Proof

                                                    </a>

                                                )}

                                        </div>

                                    )}

                                </div>

                            ) : (

                                <p>

                                    <Clock size={16} />

                                    {" "}

                                    Your complaint is awaiting a university decision.

                                </p>

                            )}

                        </div>

                    )}



                    {/* GENERAL ERROR */}

                    {error && (

                        <p className="cc-error" role="alert">

                            <AlertCircle size={14} />

                            {error}

                        </p>

                    )}

                </div>

            </section>



            {/* RIGHT SIDE: CONVERSATION ROOM */}

            {showConversation && (

                <aside className="conversation-side-panel">



                    <div className="side-chat-header">

                        <div>

                            <h2>Conversation Room</h2>

                            <p>Complaint #{complaintId}</p>

                        </div>



                        <button

                            type="button"

                            onClick={() => setShowConversation(false)}

                            aria-label="Close conversation"

                        >

                            <X size={20} />

                        </button>

                    </div>



                    <div className="side-chat-info">

                        <strong>About this Conversation</strong>



                        <p>

                            This room is created specifically for this complaint.

                            Students and university administrators can communicate

                            here to clarify doubts, share additional information

                            and discuss complaint progress.

                        </p>



                        <p>

                            {role === "admin"

                                ? "You can communicate with the student, request clarification and provide updates."

                                : "You can ask questions, provide additional information and communicate with university administrators."}

                        </p>

                    </div>



                    {/* MESSAGE HISTORY */}

                    <div className="side-chat-messages">

                        {loadingMessages ? (

                            <p className="side-chat-empty">

                                Loading messages...

                            </p>

                        ) : messages.length === 0 ? (

                            <div className="side-chat-empty">

                                <MessagesSquare size={35} />

                                <h3>No messages yet</h3>

                                <p>

                                    Start the conversation by sending your first message.

                                </p>

                            </div>

                        ) : (

                            messages.map(msg => {

                                const isMine =

                                    role === "admin"

                                        ? msg.sender_role === "admin" &&

                                          String(msg.admin_id) === String(msg.sender_id)

                                        : msg.sender_role === "student";



                                return (

                                    <div

                                        key={msg.message_id}

                                        className={`side-message ${

                                            isMine

                                                ? "side-message-mine"

                                                : "side-message-other"

                                        }`}

                                    >

                                        <span className="side-message-author">

                                            <div className="message-sender">

                                                {msg.sender_role === "admin"

                                                    ? `${msg.sender_name || "University Administration"} · University Admin`

                                                    : "Anonymous Student"}

                                            </div>

                                        </span>



                                        <div className="side-message-bubble">

                                            {msg.message}

                                        </div>



                                        <span className="side-message-time">

                                            {msg.created_at

                                                ? new Date(msg.created_at).toLocaleString()

                                                : ""}

                                        </span>

                                    </div>

                                );

                            })

                        )}



                        <div ref={messagesEndRef} />

                    </div>



                    {conversationError && (

                        <p className="side-chat-error" role="alert">

                            <AlertCircle size={14} />

                            {conversationError}

                        </p>

                    )}



                    {/* MESSAGE INPUT */}

                    <form

                        className="side-chat-form"

                        onSubmit={handleSendMessage}

                    >

                        <textarea

                            value={newMessage}

                            onChange={e => setNewMessage(e.target.value)}

                            placeholder="Write your message..."

                            maxLength={2000}

                            rows={2}

                        />



                        <div className="side-chat-form-bottom">

                            <span>{newMessage.length}/2000</span>



                            <button

                                type="submit"

                                disabled={!newMessage.trim() || sendingMessage}

                            >

                                <Send size={17} />

                                {sendingMessage ? "Sending..." : "Send"}

                            </button>

                        </div>

                    </form>

                </aside>

            )}



            {/* COMMENTS POPUP */}

            {showComments &&
    createPortal(
        <div
            className="comments-overlay"
            onClick={() => setShowComments(false)}
        >
            <section
                className="comments-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="comments-header">
                    <div>
                        <h2>Comments</h2>
                        <p>Complaint #{complaintId}</p>
                    </div>

                    <button
                        type="button"
                        className="comments-close"
                        onClick={() => setShowComments(false)}
                    >
                        <X size={21} />
                    </button>
                </div>

                <div className="comments-list">
                    {loadingComments ? (
                        <p className="comments-message">
                            Loading comments...
                        </p>
                    ) : comments.length === 0 ? (
                        <p className="comments-message">
                            No comments yet. Be the first to comment!
                        </p>
                    ) : (
                        comments.map((item) => (
                            <div
                                className="single-comment"
                                key={item.comment_id}
                            >
                                <div className="comment-avatar">
                                    {(item.username || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="comment-content">
                                    <div className="comment-author-row">
                                        <strong>
                                            {item.username || "Student"}
                                        </strong>

                                        <span>
                                            {item.created_at
                                                ? new Date(item.created_at)
                                                    .toLocaleString()
                                                : ""}
                                        </span>
                                    </div>

                                    <p>{item.comment}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form
                    className="comments-form"
                    onSubmit={handlePostComment}
                >
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write your comment..."
                        maxLength={1000}
                        rows={3}
                    />

                    {commentError && (
                        <p className="comments-error">{commentError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={postingComment || !commentText.trim()}
                    >
                        {postingComment ? "Posting..." : "Post Comment"}
                    </button>
                </form>
            </section>
        </div>,
        document.body
    )}


            {/* SUCCESS POPUP AFTER ADMIN DECISION */}
            {showSuccessPopup && (
                <div
                    className="success-popup-overlay"
                    onClick={() => setShowSuccessPopup(false)}
                >
                    <div
                        className="success-popup"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="success-popup-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="success-popup-icon">
                            <CheckCircle size={38} />
                        </div>
                        <h2 id="success-popup-title">Decision Updated!</h2>
                        <p>{successMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowSuccessPopup(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showAccessDenied && createPortal(
    <div
        className="access-denied-overlay"
        onClick={() => setShowAccessDenied(false)}
    >
        <div
            className="access-denied-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="access-denied-icon">
                <AlertCircle size={32} />
            </div>

            <h2>Access Denied</h2>

            <p>
                You cannot view this conversation.
                Only the complaint owner can access it.
            </p>

            <button
                type="button"
                onClick={() => setShowAccessDenied(false)}
            >
                OK
            </button>
        </div>
    </div>,
    document.body
)}

        </div>

    );

}



export default ComplaintDetails;
