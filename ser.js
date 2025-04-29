const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Allow frontend to communicate with backend
const db = require('./db'); // Import database connection

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for frontend requests

// ✅ API: Get all employee progress data
app.get('/progress', (req, res) => {
  db.all('SELECT * FROM progress', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// ✅ API: Add new employee progress data
app.post('/progress', (req, res) => {
  const { name, skills, training, rating } = req.body;

  if (!name || !skills || !training || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `INSERT INTO progress (name, skills, training, rating) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, skills, training, rating], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Employee progress added successfully!' });
  });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
