
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Video,
    Upload,
    X,
    ShieldCheck,
    FileCheck2
} from "lucide-react";
import "../styles/raisecomplaint.css";

function Raisecomplaint() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || localStorage.getItem("email");

    const [complaintsucesspopup, setcomplaintsucesspopup] = useState(false);
    const [showPopup, setShowPopup] = useState(true);
    const [accepted, setAccepted] = useState(false);

    const [title, setTitle] = useState("");
    const [complaintCategory, setComplaintCategory] = useState("About Hostel");
    const [complaintDescription, setComplaintDescription] = useState("");

    const [proof, setProof] = useState(null);
    const [fileName, setFileName] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [fileType, setFileType] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Release preview URLs when they are replaced or the component unmounts.
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleFileChange(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Please upload an image, video, or PDF file.");
            e.target.value = "";
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError("File size must be less than 20 MB.");
            e.target.value = "";
            return;
        }

        setError("");
        setProof(file);
        setFileName(file.name);
        setFileType(file.type);

        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl("");
        }
    }

    function removeProof() {
        setProof(null);
        setFileName("");
        setPreviewUrl("");
        setFileType("");

        const fileInput = document.getElementById("complaint-proof");
        if (fileInput) {
            fileInput.value = "";
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!title.trim() || !complaintDescription.trim()) {
            setError("Please enter a title and complaint description.");
            return;
        }

        if (!accepted) {
            setError("Please confirm that your complaint is genuine.");
            return;
        }

        const formData = new FormData();

        formData.append("title", title.trim());
        formData.append("complaintCategory", complaintCategory);
        formData.append("complaintDescription", complaintDescription.trim());

        if (proof) {
            formData.append("proof", proof);
        }

        const studentEmail = localStorage.getItem("email") || email;

        if (studentEmail) {
            formData.append("email", studentEmail);
        }

        try {
            setSubmitting(true);

            const response = await fetch("https://raise-your-voice2.onrender.com/complaint", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit complaint.");
            }

            setcomplaintsucesspopup(true);

            setTitle("");
            setComplaintCategory("About Hostel");
            setComplaintDescription("");
            removeProof();
            setAccepted(false);

        } catch (err) {
            console.error("Complaint submission error:", err);
            setError(err.message || "Unable to submit complaint. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="raisecomplaint-page">

            {/* GOOD-FAITH CONFIRMATION MODAL */}
            {showPopup && (
                <div className="complaint-modal-overlay">
                    <div
                        className="complaint-warning-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="warning-title"
                    >
                        <div className="warning-icon">
                            <AlertCircle size={29} />
                        </div>

                        <p className="complaint-eyebrow">
                            BEFORE YOU SUBMIT
                        </p>

                        <h2 id="warning-title">
                            Your voice matters
                        </h2>

                        <p className="warning-description">
                            Share your concern honestly and provide accurate
                            information to the best of your knowledge.
                        </p>

                        <div className="warning-note">
                            <strong>Please remember</strong>
                            <p>
                                Knowingly false or malicious complaints may
                                result in disciplinary action under university
                                rules. Evidence is helpful, but it is optional.
                            </p>
                        </div>

                        <label className="complaint-confirmation">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <span>
                                I confirm that I am submitting this complaint
                                in good faith.
                            </span>
                        </label>

                        <div className="complaint-modal-actions">
                            <button
                                type="button"
                                className="complaint-secondary-btn"
                                onClick={() =>
                                    navigate("/dashboard", {
                                        state: { email }
                                    })
                                }
                            >
                                Go Back
                            </button>

                            <button
                                type="button"
                                className="complaint-primary-btn"
                                disabled={!accepted}
                                onClick={() => setShowPopup(false)}
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN PAGE CONTENT */}
            <div
                className={`complaint-content ${
                    showPopup ? "complaint-content-blurred" : ""
                }`}
            >
                {/* PAGE HEADER */}
                <header className="complaint-page-header">
                    <div>
                        <p className="complaint-breadcrumb">
                            Student Portal / Raise Complaint
                        </p>

                        <h1>Raise a Complaint</h1>

                        <p className="complaint-page-subtitle">
                            Tell us what happened. Your concern deserves
                            attention.
                        </p>
                    </div>

                    <div className="complaint-header-icon">
                        <FileText size={28} />
                    </div>
                </header>

                {/* INFORMATION BANNER */}
                <div className="complaint-info-banner">
                    <span className="complaint-info-symbol">
                        <AlertCircle size={20} />
                    </span>

                    <div>
                        <strong>What happens next?</strong>
                        <p>
                            Once submitted, your complaint can be reviewed by
                            an authorized administrator. A private communication
                            room can be used if further clarification is needed.
                        </p>
                    </div>
                </div>

                {/* COMPLAINT FORM */}
                <form
                    className="complaint-form-card"
                    onSubmit={handleSubmit}
                >
                    <div className="complaint-section-heading">
                        <div>
                            <h2>Complaint Details</h2>
                            <p>
                                Provide enough information to help us
                                understand your concern.
                            </p>
                        </div>

                        <span className="complaint-required-label">
                            * Required
                        </span>
                    </div>

                    <div className="complaint-form-grid">

                        {/* TITLE */}
                        <div className="complaint-field complaint-field-full">
                            <label htmlFor="complaint-title">
                                Complaint Title <span>*</span>
                            </label>

                            <input
                                id="complaint-title"
                                type="text"
                                value={title}
                                placeholder="Briefly describe your concern"
                                maxLength={150}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />

                            <small>
                                {title.length}/150 characters
                            </small>
                        </div>

                        {/* CATEGORY */}
                        <div className="complaint-field">
                            <label htmlFor="complaint-category">
                                Category <span>*</span>
                            </label>

                            <select
                                id="complaint-category"
                                value={complaintCategory}
                                onChange={(e) =>
                                    setComplaintCategory(e.target.value)
                                }
                            >
                                <option>About Hostel</option>
                                <option>About Faculty</option>
                                <option>About Transport</option>
                                <option>About Management</option>
                                <option>About Infrastructure</option>
                                <option>Harassment or Misconduct</option>
                                <option>Campus Facilities</option>
                                <option>Other</option>
                            </select>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="complaint-field complaint-field-full">
                            <label htmlFor="complaint-description">
                                Complaint Description <span>*</span>
                            </label>

                            <textarea
                                id="complaint-description"
                                value={complaintDescription}
                                placeholder="Explain the issue, when it happened, and how it affected you..."
                                rows={7}
                                maxLength={5000}
                                onChange={(e) =>
                                    setComplaintDescription(e.target.value)
                                }
                                required
                            />

                            <small>
                                {complaintDescription.length}/5000 characters
                            </small>
                        </div>
                    </div>

                    <div className="complaint-section-divider" />

                    {/* EVIDENCE SECTION */}
                    <div className="complaint-section-heading">
                        <div>
                            <h2>Supporting Evidence</h2>
                            <p>
                                Attach a relevant file if you have one.
                                You can also submit without evidence.
                            </p>
                        </div>

                        <span className="complaint-optional-label">
                            Optional
                        </span>
                    </div>

                    <label
                        htmlFor="complaint-proof"
                        className="complaint-upload-area"
                    >
                        <span className="complaint-upload-icon">
                            <Upload size={25} />
                        </span>

                        <strong>Choose a file to upload</strong>

                        <span className="complaint-upload-description">
                            Images, videos, or PDF documents · Max 20 MB
                        </span>

                        <span className="complaint-browse-btn">
                            Browse Files
                        </span>
                    </label>

                    <input
                        id="complaint-proof"
                        className="complaint-hidden-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"
                        onChange={handleFileChange}
                    />

                    {/* SELECTED FILE */}
                    {fileName && (
                        <div className="complaint-file-card">
                            <div className="complaint-file-icon">
                                {fileType.startsWith("image/") ? (
                                    <ImageIcon size={21} />
                                ) : fileType.startsWith("video/") ? (
                                    <Video size={21} />
                                ) : (
                                    <FileText size={21} />
                                )}
                            </div>

                            <div className="complaint-file-info">
                                <strong>{fileName}</strong>
                                <span>
                                    {proof
                                        ? `${(proof.size / (1024 * 1024)).toFixed(2)} MB`
                                        : ""}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="complaint-remove-file"
                                onClick={removeProof}
                                aria-label="Remove selected file"
                            >
                                <X size={17} />
                                Remove
                            </button>
                        </div>
                    )}

                    {/* IMAGE PREVIEW */}
                    {previewUrl && fileType.startsWith("image/") && (
                        <img
                            className="complaint-file-preview"
                            src={previewUrl}
                            alt="Selected evidence preview"
                        />
                    )}

                    {/* VIDEO PREVIEW */}
                    {previewUrl && fileType.startsWith("video/") && (
                        <video
                            className="complaint-file-preview"
                            src={previewUrl}
                            controls
                        />
                    )}

                    {/* PRIVACY NOTE */}
                    <div className="complaint-privacy-note">
                        <ShieldCheck size={21} />

                        <p>
                            <strong>Privacy matters.</strong> Your complaint
                            and evidence should only be accessible to
                            authorized people. Actual confidentiality depends
                            on the server's access controls.
                        </p>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="complaint-error" role="alert">
                            <AlertCircle size={17} />
                            {error}
                        </div>
                    )}

                    {/* FORM FOOTER */}
                    <div className="complaint-form-footer">
                        <p>
                            <span>*</span> Required fields must be completed.
                        </p>

                        <button
                            type="submit"
                            className="complaint-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Complaint"}
                            {!submitting && <ArrowRight size={17} />}
                        </button>
                    </div>
                </form>

                {/* PAGE FOOTER */}
                <footer className="complaint-page-footer">
                    <div className="complaint-footer-brand">
                        <span className="complaint-footer-logo">V</span>
                        <div>
                            <strong>Raise Your Voice</strong>
                            <small>Student Grievance Portal</small>
                        </div>
                    </div>

                    <p>
                        Your concerns deserve to be heard.
                    </p>

                    <span className="complaint-footer-copyright">
                        © 2026 Raise Your Voice
                    </span>
                </footer>
            </div>

            {/* SUCCESS POPUP */}
            {complaintsucesspopup && (
                <div className="complaint-success-overlay">
                    <div className="complaint-success-box">
                        <div className="complaint-success-icon">
                            <CheckCircle2 size={35} />
                        </div>

                        <p className="complaint-success-eyebrow">
                            SUBMISSION COMPLETE
                        </p>

                        <h2>Complaint Raised Successfully!</h2>

                        <p>
                            Your complaint has been submitted successfully.
                            The administration can now review your concern.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setcomplaintsucesspopup(false);
                                navigate("/dashboard", {
                                    state: { email }
                                });
                            }}
                        >
                            Back to Dashboard <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Raisecomplaint;
