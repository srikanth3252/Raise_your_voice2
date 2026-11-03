
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const app = express();

const db = require("./db");
const notificationRoutes = require("./routes/notificationRoutes");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ================= BREVO EMAIL CONFIGURATION =================

async function sendBrevoEmail(to, subject, htmlContent) {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
        throw new Error("Brevo environment variables are missing");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL,
                name: "Raise Your Voice"
            },
            to: [{ email: to }],
            subject,
            htmlContent
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo API error (${response.status}): ${errorText}`);
    }

    return response.json();
}

// ================= UPLOAD CONFIGURATION =================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "uploads");

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const safeExtension = path.extname(file.originalname);
        cb(
            null,
            `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExtension}`
        );
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/notifications", notificationRoutes);

// ================= OTP STORAGE =================

// Note: In-memory OTP storage is suitable only for a
// single server process. Move this to Redis or a database
// before scaling to multiple backend instances.

const signupOTPs = new Map();
const resetOTPs = new Map();

function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

/* ================= SIGNUP OTP ================= */

app.post("/sendotp", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({
            message: "Enter valid email"
        });
    }

    if (!email.endsWith("@srmap.edu.in")) {
        return res.status(400).json({
            message: "Only SRM AP emails are allowed"
        });
    }

    const otp = generateOTP();

    try {
        await sendBrevoEmail(
            email,
            "OTP Verification - Raise Your Voice",
            `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                    <h2>Raise Your Voice</h2>
                    <p>Your verification OTP is:</p>
                    <h1 style="color:#4f46e5;letter-spacing:4px">${otp}</h1>
                    <p>This OTP expires in 5 minutes.</p>
                    <p>Do not share this OTP with anyone.</p>
                </div>
            `
        );

        signupOTPs.set(email, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        return res.json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("Signup OTP email error:", error.message);

        return res.status(500).json({
            message: "Failed to send OTP"
        });
    }
});

/* ================= SIGNUP VERIFY ================= */

app.post("/verify_otp_insert_data", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const { password, username } = req.body;

    if (!email || !otp || !password || !username) {
        return res.status(400).json({
            message: "Username, email, password and OTP required"
        });
    }

    const saved = signupOTPs.get(email);

    if (!saved || Date.now() > saved.expiresAt) {
        signupOTPs.delete(email);

        return res.status(400).json({
            message: "OTP expired or not requested"
        });
    }

    if (otp !== saved.otp) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    const query = `
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
    `;

    db.query(query, [username, email, password], (error, result) => {
        if (error) {
            console.error("Signup error:", error);

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username or email already exists"
                });
            }

            return res.status(500).json({
                message: "Database error"
            });
        }

        signupOTPs.delete(email);

        return res.status(201).json({
            message: "Account created successfully",
            otpmessage: "OTP verified"
        });
    });
});

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
    const loginInput = req.body.email?.trim();
    const password = req.body.password;

    if (!loginInput || !password) {
        return res.status(400).json({
            message: "Username/email and password required",
            ok: false
        });
    }

    const query = `
        SELECT user_id, username, email, password, role
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
    `;

    db.query(query, [loginInput, loginInput], (error, result) => {
        if (error) {
            console.error("LOGIN ERROR:", error);

            return res.status(500).json({
                message: "Internal server error",
                ok: false
            });
        }

        if (result.length === 0 || result[0].password !== password) {
            return res.status(401).json({
                message: "Invalid username/email or password",
                ok: false
            });
        }

        const user = result[0];

        return res.status(200).json({
            message: "Login successful!",
            ok: true,
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    });
});

/* ================= FORGOT PASSWORD OTP ================= */

app.post("/forgot-password", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({
            message: "Email required"
        });
    }

    db.query(
        "SELECT email FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                console.error("Forgot password database error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Email not registered"
                });
            }

            const otp = generateOTP();

            try {
                await sendBrevoEmail(
                    email,
                    "Raise Your Voice - Password Reset OTP",
                    `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                            <h2>Raise Your Voice - Password Reset</h2>
                            <p>Your password reset OTP is:</p>
                            <h1 style="color:#2563eb;letter-spacing:4px">${otp}</h1>
                            <p>This OTP expires in 5 minutes.</p>
                            <p>Do not share this OTP with anyone.</p>
                        </div>
                    `
                );

                resetOTPs.set(email, {
                    otp,
                    expiresAt: Date.now() + 5 * 60 * 1000,
                    verified: false
                });

                return res.json({
                    message: "OTP sent successfully"
                });

            } catch (error) {
                console.error("Reset OTP email error:", error.message);

                return res.status(500).json({
                    message: "Unable to send OTP"
                });
            }
        }
    );
});

/* ================= VERIFY RESET OTP ================= */

app.post("/verify-reset-otp", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP required"
        });
    }

    const data = resetOTPs.get(email);

    if (!data) {
        return res.status(400).json({
            message: "Please request OTP first"
        });
    }

    if (Date.now() > data.expiresAt) {
        resetOTPs.delete(email);

        return res.status(400).json({
            message: "OTP expired. Request a new OTP"
        });
    }

    if (data.otp !== otp) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    data.verified = true;

    return res.json({
        message: "OTP verified successfully"
    });
});

/* ================= RESET PASSWORD ================= */

app.post("/reset-password", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({
            message: "Email and new password required"
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            message: "Password must contain at least 8 characters"
        });
    }

    const data = resetOTPs.get(email);

    if (!data || !data.verified) {
        return res.status(400).json({
            message: "Please verify OTP first"
        });
    }

    if (Date.now() > data.expiresAt) {
        resetOTPs.delete(email);

        return res.status(400).json({
            message: "OTP expired. Request a new OTP"
        });
    }

    db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [newPassword, email],
        (err, result) => {
            if (err) {
                console.error("Password reset error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {
                resetOTPs.delete(email);

                return res.status(404).json({
                    message: "User not found"
                });
            }

            resetOTPs.delete(email);

            return res.json({
                message: "Password updated successfully"
            });
        }
    );
});

/* ================= GET USER DETAILS ================= */

app.post("/get_user_details", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email or username required"
        });
    }

    const query = `
        SELECT *
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
    `;

    db.query(query, [email, email], (error, result) => {
        if (error) {
            console.error("Get user details error:", error);

            return res.status(500).json({
                message: "Internal server error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({
            message: "data delivered",
            result: result[0]
        });
    });
});

/* ================= STORE COMPLAINT ================= */

app.post("/complaint", upload.single("proof"), (req, res) => {
    console.log("Complaint API called");

    const {
        title,
        complaintCategory,
        complaintDescription,
        email
    } = req.body;

    if (!title || !complaintCategory || !complaintDescription || !email) {
        return res.status(400).json({
            message: "Title, category, description and email are required."
        });
    }

    // Proof is optional.
    const filePath = req.file ? req.file.filename : null;

    const getUserQuery = `
        SELECT user_id
        FROM users
        WHERE email = ?
    `;

    db.query(
        getUserQuery,
        [email.trim().toLowerCase()],
        (err, result) => {
            if (err) {
                console.error("Error finding user:", err);

                return res.status(500).json({
                    message: "Failed to identify the student."
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            const user_id = result[0].user_id;

            const insertComplaint = `
                INSERT INTO complaints
                (user_id, title, category, description, proof)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertComplaint,
                [
                    user_id,
                    title.trim(),
                    complaintCategory.trim(),
                    complaintDescription.trim(),
                    filePath
                ],
                (error, result2) => {
                    if (error) {
                        console.error("Error inserting complaint:", error);

                        return res.status(500).json({
                            message: "Failed to save complaint."
                        });
                    }

                    return res.status(201).json({
                        message: "Complaint raised successfully!",
                        complaint_id: result2.insertId
                    });
                }
            );
        }
    );
});



// route to verify the admin

app.post("/verify_admin", (req, res) => {
    const { email, password } = req.body;

    const query = `
        SELECT *
        FROM admins
        WHERE (email = ? OR username = ?)
        AND password = ?
    `;

    db.query(query, [email, email, password], (error, result) => {
        if (error) 
        {
            console.error("Admin login error:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        if (result.length === 0) 
        {
            return res.status(401).json({
                ok:false,
                message: "Invalid admin credentials. Please check your details."
            });
        }

        res.status(200).json({
            message: "Admin login successful",
            ok:true,
            admin: {
                admin_id: result[0].admin_id,
                admin_name: result[0].admin_name,
                username: result[0].username,
                email: result[0].email
            }
        });
    });
});

// route to get the complaints from database;

app.get("/getcomplaints", (req, res) => 
{
    const query = `
        SELECT *
        FROM complaints
        ORDER BY complaint_id DESC
    `;

    db.query(query, (error, result) => {
        if (error) {
            return res.status(500).json({
                message: error.message
            });
        }

        return res.status(200).json({
            message: result.length === 0
                ? "No complaints found"
                : "Complaints fetched successfully",
            result: result,
            ok:true
        });
    });
});
;

app.get("/statisticsdashboard", (req, res) => {
  const queries = [
    // Overview
    `SELECT
      COUNT(*) AS totalComplaints,
      SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN LOWER(status) IN ('in progress', 'in-progress') THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN LOWER(status) = 'resolved' THEN 1 ELSE 0 END) AS resolved,
      COALESCE(SUM(total_likes), 0) AS totalSupports
     FROM complaints`,

    // Total users
    `SELECT COUNT(*) AS totalUsers FROM users`,

    // Category statistics
    `SELECT
      COALESCE(category, 'Uncategorized') AS category,
      COUNT(*) AS count
     FROM complaints
     GROUP BY category
     ORDER BY count DESC`,

    // Monthly statistics
    `SELECT
      DATE_FORMAT(created_at, '%b %Y') AS month,
      DATE_FORMAT(created_at, '%Y-%m') AS monthKey,
      COUNT(*) AS count
     FROM complaints
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
     GROUP BY monthKey, month
     ORDER BY monthKey`,

    // Most supported complaints
    `SELECT
      complaint_id,
      title,
      category,
      total_likes,
      status
     FROM complaints
     ORDER BY total_likes DESC
     LIMIT 5`
  ];

  const executeQuery = (sql) => {
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  Promise.all(queries.map(executeQuery))
    .then(([overview, users, categories, monthly, topComplaints]) => {
      const stats = overview[0];
      const total = Number(stats.totalComplaints || 0);
      const resolved = Number(stats.resolved || 0);

      res.status(200).json({
        message: "Statistics fetched successfully",
        result: {
          overview: {
            totalComplaints: total,
            pending: Number(stats.pending || 0),
            inProgress: Number(stats.inProgress || 0),
            resolved,
            totalSupports: Number(stats.totalSupports || 0),
            totalUsers: Number(users[0].totalUsers || 0),
            resolutionRate: total
              ? Number(((resolved / total) * 100).toFixed(1))
              : 0
          },
          categories,
          monthly,
          topComplaints
        }
      });
    })
    .catch((err) => {
      console.error("Statistics dashboard error:", err);

      res.status(500).json({
        message: "Unable to fetch dashboard statistics"
      });
    });
});

// route for complaint_likes table


app.post("/likes", (req, res) => {
    const { email, complaint_id } = req.body;

    if (!email || !complaint_id) {
        return res.status(400).json({
            message: "Email and complaint ID are required"
        });
    }

    const id = Number(complaint_id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID"
        });
    }

    // Find the student
    db.query(
        "SELECT user_id FROM users WHERE email = ?",
        [email],
        (userError, users) => {

            if (userError) {
                console.error("USER ERROR:", userError);
                return res.status(500).json({
                    message: "Unable to find user"
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            const user_id = users[0].user_id;

            // Check whether complaint exists
            db.query(
                "SELECT complaint_id FROM complaints WHERE complaint_id = ?",
                [id],
                (complaintError, complaints) => {

                    if (complaintError) {
                        console.error("COMPLAINT ERROR:", complaintError);
                        return res.status(500).json({
                            message: "Unable to check complaint"
                        });
                    }

                    if (complaints.length === 0) {
                        return res.status(404).json({
                            message: "Complaint not found"
                        });
                    }

                    // Check existing like
                    db.query(
                        `SELECT user_id FROM complaint_likes
                         WHERE complaint_id = ? AND user_id = ?`,
                        [id, user_id],
                        (likeError, existingLikes) => {

                            if (likeError) {
                                console.error("LIKE CHECK ERROR:", likeError);
                                return res.status(500).json({
                                    message: "Unable to check like"
                                });
                            }

                            const alreadyLiked = existingLikes.length > 0;

                            const query = alreadyLiked
                                ? `DELETE FROM complaint_likes
                                   WHERE complaint_id = ? AND user_id = ?`
                                : `INSERT INTO complaint_likes
                                   (complaint_id, user_id)
                                   VALUES (?, ?)`;

                            db.query(
                                query,
                                [id, user_id],
                                (updateError) => {

                                    if (updateError) {
                                        console.error("LIKE UPDATE ERROR:", updateError);
                                        return res.status(500).json({
                                            message: "Unable to update like"
                                        });
                                    }

                                    // Count current likes
                                    db.query(
                                        `SELECT COUNT(*) AS totalLikes
                                         FROM complaint_likes
                                         WHERE complaint_id = ?`,
                                        [id],
                                        (countError, countResult) => {

                                            if (countError) {
                                                console.error("COUNT ERROR:", countError);
                                                return res.status(500).json({
                                                    message: "Unable to count likes"
                                                });
                                            }

                                            const totalLikes = Number(
                                                countResult[0].totalLikes
                                            );

                                            // Update complaints table count
                                            db.query(
                                                `UPDATE complaints
                                                 SET total_likes = ?
                                                 WHERE complaint_id = ?`,
                                                [totalLikes, id],
                                                (updateCountError) => {

                                                    if (updateCountError) {
                                                        console.error("COUNT UPDATE ERROR:", updateCountError);
                                                        return res.status(500).json({
                                                            message: "Unable to update total likes"
                                                        });
                                                    }

                                                    return res.status(200).json({
                                                        message: alreadyLiked
                                                            ? "Like removed successfully"
                                                            : "Complaint liked successfully",
                                                        liked: !alreadyLiked,
                                                        totalLikes
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});



app.get("/likes/status", (req, res) => {
    const { email, complaint_id } = req.query;

    if (!email || !complaint_id) {
        return res.status(400).json({
            message: "Email and complaint ID are required"
        });
    }

    const id = Number(complaint_id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID"
        });
    }

    const query = `
        SELECT
            EXISTS (
                SELECT 1
                FROM complaint_likes cl
                INNER JOIN users u ON u.user_id = cl.user_id
                WHERE cl.complaint_id = ?
                AND u.email = ?
            ) AS liked,
            (
                SELECT COUNT(*)
                FROM complaint_likes
                WHERE complaint_id = ?
            ) AS totalLikes
        FROM complaints
        WHERE complaint_id = ?
    `;

    db.query(
        query,
        [id, email, id, id],
        (error, result) => {
            if (error) {
                return res.status(500).json({
                    message: "Unable to fetch like status"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Complaint not found"
                });
            }

            res.status(200).json({
                liked: Boolean(result[0].liked),
                totalLikes: Number(result[0].totalLikes)
            });
        }
    );
});
       
//generate the report route

app.post("/generatereport", (req, res) => {

    const { startDate, endDate } = req.body;

    // 1. Validate required dates
    if (!startDate || !endDate) {
        return res.status(400).json({
            message: "Start date and end date are required."
        });
    }

    // 2. Validate YYYY-MM-DD format and actual calendar dates
    function isValidDate(value) {

        if (
            typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
            return false;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({
            message: "Invalid date format. Use YYYY-MM-DD."
        });
    }

    // 3. Validate date range
    if (startDate > endDate) {
        return res.status(400).json({
            message: "Start date cannot be after end date."
        });
    }

    // Get today's date using server's local calendar date
    const now = new Date();

    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    if (endDate > today) {
        return res.status(400).json({
            message: "Future dates are not allowed."
        });
    }

    // 4. Common date condition
    const dateCondition = `
        created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    // 5. Define report queries
    const queries = [

        // Query 1: Overview statistics
        {
            sql: `
                SELECT
                    COUNT(*) AS totalComplaints,

                    SUM(
                        CASE
                            WHEN LOWER(status) = 'pending'
                            THEN 1 ELSE 0
                        END
                    ) AS pending,

                    SUM(
                        CASE
                            WHEN LOWER(status) IN ('in progress', 'in-progress')
                            THEN 1 ELSE 0
                        END
                    ) AS inProgress,

                    SUM(
                        CASE
                            WHEN LOWER(status) = 'resolved'
                            THEN 1 ELSE 0
                        END
                    ) AS resolved,

                    COALESCE(SUM(total_likes), 0) AS totalSupports

                FROM complaints

                WHERE ${dateCondition}
            `,
            values: [startDate, endDate]
        },

        // Query 2: Category-wise statistics
        {
            sql: `
                SELECT
                    COALESCE(category, 'Uncategorized') AS category,
                    COUNT(*) AS count

                FROM complaints

                WHERE ${dateCondition}

                GROUP BY category

                ORDER BY count DESC
            `,
            values: [startDate, endDate]
        },

        // Query 3: Complaint details
        {
            sql: `
                SELECT
                    complaint_id,
                    title,
                    category,
                    description,
                    status,
                    total_likes,
                    created_at

                FROM complaints

                WHERE ${dateCondition}

                ORDER BY created_at DESC
            `,
            values: [startDate, endDate]
        }

    ];

    // 6. Execute MySQL queries using promises
    function executeQuery(query) {

        return new Promise((resolve, reject) => {

            db.query(
                query.sql,
                query.values,
                (error, result) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );

        });
    }

    // 7. Execute all three queries
    Promise.all(queries.map(executeQuery))

        .then(([overviewRows, categories, complaints]) => {

            const stats = overviewRows[0];

            const total = Number(stats.totalComplaints || 0);
            const resolved = Number(stats.resolved || 0);

            // 8. Prepare report response
            res.status(200).json({

                message: "Report generated successfully",

                result: {

                    startDate,
                    endDate,

                    overview: {

                        totalComplaints: total,

                        pending: Number(stats.pending || 0),

                        inProgress: Number(stats.inProgress || 0),

                        resolved,

                        totalSupports: Number(stats.totalSupports || 0),

                        resolutionRate: total > 0
                            ? Number(
                                ((resolved / total) * 100).toFixed(1)
                            )
                            : 0
                    },

                    categories,

                    complaints

                }

            });

        })

        .catch((error) => {

            console.error("GENERATE REPORT ERROR:", error);

            res.status(500).json({
                message: "Unable to generate report."
            });

        });

});


// STORE A NEW COMMENTs

app.post("/comments", (req, res) => {

    const { email, complaint_id, comment } = req.body;

    // VALIDATE INPUT
    if (!email || !complaint_id || !comment || !comment.trim()) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (!Number.isInteger(Number(complaint_id)) || Number(complaint_id) <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID."
        });
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length > 1000) {
        return res.status(400).json({
            message: "Comment cannot exceed 1000 characters."
        });
    }

    // GET STUDENT ID USING EMAIL
    const userSql = `
        SELECT user_id
        FROM users
        WHERE email = ?
    `;

    db.query(userSql, [email], (userErr, userResult) => {

        if (userErr) {
            console.error("USER FETCH ERROR:", userErr);

            return res.status(500).json({
                message: "Unable to identify user."
            });
        }

        if (userResult.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const user_id = userResult[0].user_id;

        // CHECK WHETHER COMPLAINT EXISTS
        const complaintSql = `
            SELECT complaint_id
            FROM complaints
            WHERE complaint_id = ?
        `;

        db.query(complaintSql, [complaint_id], (complaintErr, complaintResult) => {

            if (complaintErr) {
                console.error("COMPLAINT FETCH ERROR:", complaintErr);

                return res.status(500).json({
                    message: "Unable to verify complaint."
                });
            }

            if (complaintResult.length === 0) {
                return res.status(404).json({
                    message: "Complaint not found."
                });
            }

            // INSERT COMMENT
            const insertSql = `
                INSERT INTO complaint_comments
                (complaint_id, user_id, comment)
                VALUES (?, ?, ?)
            `;

            db.query(
                insertSql,
                [complaint_id, user_id, trimmedComment],
                (insertErr, insertResult) => {

                    if (insertErr) {
                        console.error("COMMENT INSERT ERROR:", insertErr);

                        return res.status(500).json({
                            message: "Unable to store comment."
                        });
                    }

                    return res.status(201).json({
                        message: "Comment posted successfully.",
                        comment_id: insertResult.insertId
                    });

                }
            );

        });

    });

});


// get comments route
// FETCH COMMENTS FOR A PARTICULAR COMPLAINT

app.get("/comments/:complaint_id", (req, res) => {

    const { complaint_id } = req.params;

    if (!Number.isInteger(Number(complaint_id)) || Number(complaint_id) <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID."
        });
    }

    const sql = `
        SELECT
            cc.comment_id,
            cc.complaint_id,
            cc.user_id,
            cc.comment,
            cc.created_at,
            u.username
        FROM complaint_comments cc
        JOIN users u
            ON cc.user_id = u.user_id
        WHERE cc.complaint_id = ?
        ORDER BY cc.created_at ASC, cc.comment_id ASC
    `;

    db.query(sql, [complaint_id], (err, result) => {

        if (err) {
            console.error("FETCH COMMENTS ERROR:", err);

            return res.status(500).json({
                message: "Unable to fetch comments."
            });
        }

        return res.status(200).json({
            message: "Comments fetched successfully.",
            comments: result
        });

    });

});



// FETCH COMPLETE COMPLAINT DETAILS


app.get("/complaint/:complaint_id", (req, res) => {
    const { complaint_id } = req.params;

    if (!Number.isInteger(Number(complaint_id)) || Number(complaint_id) <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID."
        });
    }

    const sql = `
        SELECT
            c.complaint_id,
            c.user_id,
            c.title,
            c.category,
            c.description,
            c.proof,
            c.status,
            c.total_likes,
            c.created_at,
            c.updated_at,
            u.username,
            u.email
        FROM complaints c
        LEFT JOIN users u
            ON c.user_id = u.user_id
        WHERE c.complaint_id = ?
    `;

    db.query(sql, [complaint_id], (err, result) => {
        if (err) {
            console.error("FETCH COMPLAINT ERROR:", err);

            return res.status(500).json({
                message: "Unable to fetch complaint details."
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Complaint not found."
            });
        }

        return res.status(200).json({
            message: "Complaint details fetched successfully.",
            result: result[0]
        });
    });
});





// GET: Fetch conversation messages for a complaint
app.get("/conversation/:complaint_id", (req, res) => {
    const { complaint_id } = req.params;

    if (!Number.isInteger(Number(complaint_id)) || Number(complaint_id) <= 0) {
        return res.status(400).json({ message: "Invalid complaint ID." });
    }

    const sql = `
        SELECT
            cm.message_id,
            cm.complaint_id,
            cm.user_id,
            cm.admin_id,
            cm.message,
            cm.created_at,
            CASE
                WHEN cm.user_id IS NOT NULL THEN u.username
                WHEN cm.admin_id IS NOT NULL THEN a.admin_name
            END AS sender_name,
            CASE
                WHEN cm.user_id IS NOT NULL THEN 'student'
                WHEN cm.admin_id IS NOT NULL THEN 'admin'
            END AS sender_role
        FROM conversation_messages cm
        LEFT JOIN users u ON cm.user_id = u.user_id
        LEFT JOIN admins a ON cm.admin_id = a.admin_id
        WHERE cm.complaint_id = ?
        ORDER BY cm.created_at ASC, cm.message_id ASC
    `;

    db.query(sql, [complaint_id], (err, result) => {
        if (err) {
            console.error("FETCH CONVERSATION ERROR:", err);
            return res.status(500).json({
                message: "Unable to fetch conversation."
            });
        }

        return res.status(200).json({
            message: "Conversation fetched successfully.",
            messages: result
        });
    });
});



// POST: Send a conversation message and create notification
app.post("/conversation", (req, res) => {
    const { complaint_id, email, role, message } = req.body;

    if (!Number.isInteger(Number(complaint_id)) || Number(complaint_id) <= 0) {
        return res.status(400).json({ message: "Invalid complaint ID." });
    }

    if (!email || !role || !message || !message.trim()) {
        return res.status(400).json({
            message: "Email and message are required."
        });
    }

    if (!["student", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid sender role." });
    }

    const cleanMessage = message.trim();

    if (cleanMessage.length > 2000) {
        return res.status(400).json({
            message: "Message cannot exceed 2000 characters."
        });
    }

    // Check complaint and get its owner
    db.query(
        "SELECT complaint_id, user_id FROM complaints WHERE complaint_id = ?",
        [complaint_id],
        (err, complaintResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (complaintResult.length === 0) {
                return res.status(404).json({
                    message: "Complaint not found."
                });
            }

            const complaintOwnerId = complaintResult[0].user_id;

            // Find sender
            const senderQuery = role === "student"
                ? "SELECT user_id FROM users WHERE email = ?"
                : "SELECT admin_id, admin_name FROM admins WHERE email = ?";

            db.query(senderQuery, [email], (err, senderResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Unable to verify sender."
                    });
                }

                if (senderResult.length === 0) {
                    return res.status(404).json({
                        message: "Sender not found."
                    });
                }

                const user_id = role === "student"
                    ? senderResult[0].user_id
                    : null;

                const admin_id = role === "admin"
                    ? senderResult[0].admin_id
                    : null;

                const adminName = role === "admin"
                    ? senderResult[0].admin_name
                    : null;

                // Only the complaint owner can send as a student
                if (role === "student" && user_id !== complaintOwnerId) {
                    return res.status(403).json({
                        message: "You cannot access this conversation."
                    });
                }

                // Save conversation message
                const insertQuery = `
                    INSERT INTO conversation_messages
                    (complaint_id, user_id, admin_id, message)
                    VALUES (?, ?, ?, ?)
                `;

                db.query(
                    insertQuery,
                    [complaint_id, user_id, admin_id, cleanMessage],
                    (err, result) => {
                        if (err) {
                            console.error("SEND MESSAGE ERROR:", err);
                            return res.status(500).json({
                                message: "Unable to send message."
                            });
                        }

                        const messageId = result.insertId;

                        // Create notification only when admin sends a message
                        if (role === "admin") {
                            const notificationQuery = `
                                INSERT INTO notifications
                                (user_id, complaint_id, title, message, notification_type)
                                VALUES (?, ?, ?, ?, 'admin_message')
                            `;

                            const notificationTitle =
                                `New reply from ${adminName}`;

                            const notificationMessage =
                                `You have received a new message regarding complaint #${complaint_id}.`;

                            db.query(
                                notificationQuery,
                                [
                                    complaintOwnerId,
                                    complaint_id,
                                    notificationTitle,
                                    notificationMessage
                                ],
                                (notificationErr) => {
                                    if (notificationErr) {
                                        console.error(
                                            "NOTIFICATION ERROR:",
                                            notificationErr
                                        );
                                    }

                                    return res.status(201).json({
                                        message: "Message sent successfully.",
                                        message_id: messageId,
                                        notificationCreated: !notificationErr
                                    });
                                }
                            );
                        } else {
                            // Student messages do not notify themselves
                            return res.status(201).json({
                                message: "Message sent successfully.",
                                message_id: messageId
                            });
                        }
                    }
                );
            });
        }
    );
});



// ADMIN: Update complaint status with mandatory reason and optional proof
app.post("/updatecomplaintstatus", upload.single("proof"), (req, res) => {
    const { complaint_id, email, status, reason } = req.body || {};

    if (!complaint_id || !email || !status || !reason?.trim()) {
        return res.status(400).json({
            message: "Complaint ID, admin email, status and reason are required."
        });
    }

    if (!["Resolved", "Rejected"].includes(status)) {
        return res.status(400).json({
            message: "Invalid complaint status."
        });
    }

    const proofPath = req.file
        ? `uploads/${req.file.filename}`
        : null;

    db.query(
        "SELECT admin_id FROM admins WHERE email = ?",
        [email],
        (err, adminResult) => {
            if (err) {
                console.error("Admin lookup error:", err);
                return res.status(500).json({
                    message: "Database error while checking administrator."
                });
            }

            if (adminResult.length === 0) {
                return res.status(403).json({
                    message: "Administrator not found."
                });
            }

            const adminId = adminResult[0].admin_id;

            db.query(
                "SELECT complaint_id, user_id, status FROM complaints WHERE complaint_id = ?",
                [complaint_id],
                (err, complaintResult) => {
                    if (err) {
                        console.error("Complaint lookup error:", err);
                        return res.status(500).json({
                            message: "Unable to fetch complaint."
                        });
                    }

                    if (complaintResult.length === 0) {
                        return res.status(404).json({
                            message: "Complaint not found."
                        });
                    }

                    const complaint = complaintResult[0];

                    if (["Resolved", "Rejected"].includes(complaint.status)) {
                        return res.status(400).json({
                            message: "This complaint already has a final status."
                        });
                    }

                    const oldStatus = complaint.status;

                    db.query(
                        `UPDATE complaints
                         SET status = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE complaint_id = ?`,
                        [status, complaint_id],
                        (err) => {
                            if (err) {
                                console.error("Complaint update error:", err);
                                return res.status(500).json({
                                    message: "Unable to update complaint status."
                                });
                            }

                            const historyQuery = `
                                INSERT INTO complaint_status_history
                                (complaint_id, admin_id, old_status, new_status, reason, proof)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `;

                            db.query(
                                historyQuery,
                                [
                                    complaint_id,
                                    adminId,
                                    oldStatus,
                                    status,
                                    reason.trim(),
                                    proofPath
                                ],
                                (err) => {
                                    if (err) {
                                        console.error("History insert error:", err);
                                        return res.status(500).json({
                                            message: "Status updated, but decision history could not be saved."
                                        });
                                    }

                                    const title = `Complaint #${complaint_id} ${status}`;

                                    const notificationMessage =
                                        status === "Resolved"
                                            ? "Your complaint has been resolved. View the administrator's explanation."
                                            : "Your complaint has been rejected. View the rejection reason.";

                                    db.query(
                                        `INSERT INTO notifications
                                        (user_id, complaint_id, title, message, notification_type)
                                        VALUES (?, ?, ?, ?, 'status_update')`,
                                        [
                                            complaint.user_id,
                                            complaint_id,
                                            title,
                                            notificationMessage
                                        ],
                                        (notificationErr) => {
                                            if (notificationErr) {
                                                console.error("Notification insert error:", notificationErr);
                                            }

                                            return res.status(200).json({
                                                message: `Complaint ${status.toLowerCase()} successfully.`,
                                                notificationCreated: !notificationErr
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// FETCH LATEST COMPLAINT DECISION HISTORY
app.get("/complaint-status-history/:complaintId", (req, res) => {
    const complaintId = Number(req.params.complaintId);

    if (!Number.isInteger(complaintId) || complaintId <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID."
        });
    }

    const sql = `
        SELECT
            h.history_id,
            h.complaint_id,
            h.old_status,
            h.new_status,
            h.reason,
            h.proof,
            h.created_at,
            a.admin_name
        FROM complaint_status_history h
        JOIN admins a ON h.admin_id = a.admin_id
        WHERE h.complaint_id = ?
        ORDER BY h.created_at DESC
        LIMIT 1
    `;

    db.query(sql, [complaintId], (err, results) => {
        if (err) {
            console.error("Decision history fetch error:", err);

            return res.status(500).json({
                message: "Unable to fetch decision history."
            });
        }

        return res.status(200).json({
            history: results.length > 0 ? results[0] : null
        });
    });
});



/* SEARCH COMPLAINT BY ID */
app.get("/search-complaint/:id", (req, res) => {
    const complaintId = req.params.id;

    const sql = "SELECT * FROM complaints WHERE complaint_id = ?";

    db.query(sql, [complaintId], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message
            });
        }

        return res.json({
            success: true,
            result: result
        });
    });
});

/* SEARCH COMPLAINTS BY KEYWORD */
app.get("/search-complaints", (req, res) => {
    const keyword = req.query.q;

    if (!keyword || !keyword.trim()) {
        return res.status(400).json({
            success: false,
            message: "Search keyword is required"
        });
    }

    const searchTerm = `%${keyword.trim()}%`;

    const sql = `
        SELECT * FROM complaints
        WHERE title LIKE ?
        OR description LIKE ?
        OR category LIKE ?
        OR CAST(complaint_id AS CHAR) LIKE ?
        ORDER BY complaint_id DESC
    `;

    db.query(
        sql,
        [searchTerm, searchTerm, searchTerm, searchTerm],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message
                });
            }

            return res.json({
                success: true,
                result: result
            });
        }
    );
});



const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});