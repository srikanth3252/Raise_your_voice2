
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ThumbsUp,
    MessageCircle,
    ArrowUpRight,
    Tag,
    AlertCircle,
    X,
    Send
} from "lucide-react";

import "../styles/complaintcard.css";
import "../styles/comments.css";

function ComplaintCard({ complaint }) {
    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

    const [likes, setLikes] = useState(
        Number(complaint.total_likes ?? complaint.totalLikes ?? 0)
    );

    const [liked, setLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const [loadingLikeStatus, setLoadingLikeStatus] = useState(true);
    const [error, setError] = useState("");

    // COMMENTS POPUP STATES
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [commentError, setCommentError] = useState("");

    const status = complaint.status || "Pending";
    const description =
        complaint.description || "No description provided.";

    const statusClass = status.toLowerCase().replace(/\s+/g, "-");

    // FETCH LIKE STATUS
    useEffect(() => {
        let cancelled = false;

        async function fetchLikeStatus() {
            if (role !== "student" || !email || !complaint.complaint_id) {
                setLoadingLikeStatus(false);
                return;
            }

            try {
                const params = new URLSearchParams({
                    email,
                    complaint_id: String(complaint.complaint_id)
                });

                const response = await fetch(
                    `https://raise-your-voice2.onrender.com/likes/status?${params.toString()}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to fetch like status.");
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
    }, [email, role, complaint.complaint_id]);


    // TOGGLE LIKE
    async function handleLikes() {
        if (liking || loadingLikeStatus || role !== "student") return;

        if (!email) {
            setError("Please log in to support a complaint.");
            return;
        }

        setLiking(true);
        setError("");

        try {
            const response = await fetch("https://raise-your-voice2.onrender.com/likes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    complaint_id: complaint.complaint_id
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


    // VIEW COMPLAINT
   
async function handleViewComplaint() {
    setError("");

    try {
        const response = await fetch(
            `https://raise-your-voice2.onrender.com/complaint/${complaint.complaint_id}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to fetch complaint."
            );
        }

        navigate("/complaintdetailspage", {
            state: {
                complaintdetails: data.result,
                adminpage: role === "admin"
            }
        });

    } catch (err) {
        console.error("VIEW COMPLAINT ERROR:", err);
        setError(err.message || "Something went wrong.");
    }
}



    // FETCH COMMENTS FOR THIS COMPLAINT
    async function fetchComments() {
        setLoadingComments(true);
        setCommentError("");

        try {
            const response = await fetch(
                `https://raise-your-voice2.onrender.com/comments/${complaint.complaint_id}`
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


    // OPEN COMMENTS POPUP
    function handleComments() {
        setShowComments(true);
        setCommentText("");
        fetchComments();
    }


    // POST NEW COMMENT
    async function handlePostComment(e) {
        e.preventDefault();

        const trimmedComment = commentText.trim();

        if (!trimmedComment) {
            setCommentError("Please enter a comment.");
            return;
        }

        if (!email) {
            setCommentError("Please log in to post a comment.");
            return;
        }

        setPostingComment(true);
        setCommentError("");

        try {
            const response = await fetch("https://raise-your-voice2.onrender.com/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    complaint_id: complaint.complaint_id,
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


    return (
        <article className="complaint-card">

            <div className="cc-topline">
                <span className="cc-id">
                    ID / #{complaint.complaint_id}
                </span>

                <span className={`cc-status ${statusClass}`}>
                    <span className="cc-status-dot" />
                    {status}
                </span>
            </div>

            <div className="cc-title-row">
                <div className="cc-category-icon">
                    <Tag size={19} strokeWidth={1.8} />
                </div>

                <div className="cc-title-content">
                    <h2>{complaint.title || "Untitled complaint"}</h2>

                    <span className="cc-category">
                        {complaint.category || "General"}
                    </span>
                </div>
            </div>

            <p className="cc-description">
                {description.length > 145
                    ? `${description.slice(0, 145).trim()}...`
                    : description}
            </p>

            <div className="cc-divider" />

            <div className="cc-bottom">

                <div className="cc-support-count">
                    <span className="cc-support-icon">
                        <ThumbsUp size={17} strokeWidth={2} />
                    </span>

                    <div>
                        <strong>{likes}</strong>
                        <small>Supports</small>
                    </div>
                </div>

                <div className="cc-actions">

                    {role === "student" && (
                        <button
                            type="button"
                            className={`cc-button cc-support-button ${
                                liked ? "liked" : ""
                            }`}
                            onClick={handleLikes}
                            disabled={liking || loadingLikeStatus}
                        >
                            <ThumbsUp
                                size={15}
                                fill={liked ? "currentColor" : "none"}
                            />

                            <span>
                                {loadingLikeStatus
                                    ? "Loading..."
                                    : liking
                                        ? "Updating..."
                                        : liked
                                            ? "Supported"
                                            : "Support"}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="cc-button cc-comment-button"
                        onClick={handleComments}
                    >
                        <MessageCircle size={15} />
                        <span>Comments</span>
                    </button>

                    <button
                        type="button"
                        className="cc-button cc-view-button"
                        onClick={handleViewComplaint}
                    >
                        <span>
                            {role === "admin"
                                ? "View & Solve"
                                : "View Details"}
                        </span>

                        <ArrowUpRight size={15} />
                    </button>

                </div>
            </div>

            {error && (
                <p className="cc-error" role="alert">
                    <AlertCircle size={14} />
                    {error}
                </p>
            )}


            {/* COMMENTS POPUP */}
            {showComments && (
                <div
                    className="comments-overlay"
                    onClick={() => setShowComments(false)}
                >
                    <section
                        className="comments-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="comments-heading"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="comments-header">
                            <div>
                                <h2 id="comments-heading">Comments</h2>
                                <p>
                                    Complaint #{complaint.complaint_id}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="comments-close"
                                onClick={() => setShowComments(false)}
                                aria-label="Close comments"
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
                                                        ? new Date(
                                                            item.created_at
                                                        ).toLocaleString()
                                                        : ""}
                                                </span>
                                            </div>

                                            <p>{item.comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                        </div>


                        {commentError && (
                            <p className="comments-error" role="alert">
                                <AlertCircle size={14} />
                                {commentError}
                            </p>
                        )}


                        {role === "student" && (
                            <form
                                className="comments-form"
                                onSubmit={handlePostComment}
                            >
                                <textarea
                                    value={commentText}
                                    onChange={(e) =>
                                        setCommentText(e.target.value)
                                    }
                                    placeholder="Write your comment..."
                                    rows={3}
                                    maxLength={1000}
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        postingComment ||
                                        !commentText.trim()
                                    }
                                >
                                    <Send size={15} />

                                    {postingComment
                                        ? "Posting..."
                                        : "Post Comment"}
                                </button>
                            </form>
                        )}

                    </section>
                </div>
            )}

        </article>
    );
}

export default ComplaintCard;
