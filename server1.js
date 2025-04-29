const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Signup Route
app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(query, [name, email, hashedPassword], function (err) {
        if (err) {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.json({ message: "Signup successful!" });
    });
});

// Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "User not found" });
        }

        const isValid = bcrypt.compareSync(password, user.password);
        if (isValid) {
            res.json({ message: "Login successful", user: user.name });
        } else {
            res.status(400).json({ error: "Invalid credentials" });
        }
    });
});

// Start Server
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
