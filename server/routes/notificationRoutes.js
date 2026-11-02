
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET ALL NOTIFICATIONS
router.get("/:email", (req, res) => {
    const email = req.params.email;

    const sql = `
        SELECT
            n.notification_id,
            n.complaint_id,
            n.title,
            n.message,
            n.notification_type,
            n.is_read,
            n.created_at
        FROM notifications n
        JOIN users u ON n.user_id = u.user_id
        WHERE u.email = ?
        ORDER BY n.created_at DESC
    `;

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Unable to fetch notifications."
            });
        }

        res.json({
            notifications: result
        });
    });
});

// GET UNREAD NOTIFICATION COUNT
router.get("/unread-count/:email", (req, res) => {
    const email = req.params.email;

    const sql = `
        SELECT COUNT(*) AS unreadCount
        FROM notifications n
        JOIN users u ON n.user_id = u.user_id
        WHERE u.email = ? AND n.is_read = FALSE
    `;

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Unable to fetch unread count."
            });
        }

        res.json({
            unreadCount: result[0].unreadCount
        });
    });
});

// MARK ONE NOTIFICATION AS READ
router.put("/read/:notification_id", (req, res) => {
    const notificationId = req.params.notification_id;
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({
            message: "Student email is required."
        });
    }

    const sql = `
        UPDATE notifications n
        JOIN users u ON n.user_id = u.user_id
        SET n.is_read = TRUE
        WHERE n.notification_id = ? AND u.email = ?
    `;

    db.query(sql, [notificationId, email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Unable to update notification."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Notification not found."
            });
        }

        res.json({
            message: "Notification marked as read."
        });
    });
});

// MARK ALL NOTIFICATIONS AS READ
router.put("/read-all/:email", (req, res) => {
    const email = req.params.email;

    const sql = `
        UPDATE notifications n
        JOIN users u ON n.user_id = u.user_id
        SET n.is_read = TRUE
        WHERE u.email = ? AND n.is_read = FALSE
    `;

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Unable to update notifications."
            });
        }

        res.json({
            message: "All notifications marked as read."
        });
    });
});

module.exports = router;
