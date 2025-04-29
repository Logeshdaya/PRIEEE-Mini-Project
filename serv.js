const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database (or create if not exists)
const db = new sqlite3.Database("attendance.db", (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Connected to SQLite database.");

        // Create attendance table (only if it doesn't exist)
        db.run(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_email TEXT NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL
            )
        `, (createErr) => {
            if (createErr) {
                console.error("Error creating attendance table:", createErr.message);
            } else {
                console.log("Attendance table is ready.");
            }
        });
    }
});

// API route to handle attendance submission
app.post("/submit-attendance", (req, res) => {
    const { employee_email, date, status } = req.body;

    if (!employee_email || !date || !status) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const sql = `INSERT INTO attendance (employee_email, date, status) VALUES (?, ?, ?)`;
    db.run(sql, [employee_email, date, status], function (err) {
        if (err) {
            console.error("Error inserting attendance:", err.message);
            return res.status(500).json({ message: "Failed to record attendance." });
        }
        res.json({ message: "Attendance recorded successfully!", id: this.lastID });
    });
});

// API route to fetch attendance records
app.get("/get-attendance", (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) {
            console.error("Error fetching attendance:", err.message);
            return res.status(500).json({ message: "Failed to fetch attendance data." });
        }
        res.json(rows);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
