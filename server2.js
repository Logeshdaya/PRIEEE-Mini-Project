const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());


// Connect to SQLite
const db = new sqlite3.Database("./training.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error("Database connection error:", err);
  else console.log("✅ Connected to SQLite");
});

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA busy_timeout = 5000;");

// Nodemailer Gmail Transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "logeshdaya22@gmail.com",
    pass: "qxpl rvos uexd yqzx"
  }
});

// Email function with more info
function sendScheduleEmail(toEmail, name, course, date, time) {
  const mailOptions = {
    from: '"LLM Group" <logeshdaya22@gmail.com>',
    to: toEmail,
    subject: `📅 Your ${course} Training is Scheduled - LLM Group`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9;">
        <h2 style="color: #0066cc; text-align: center;">LLM Group - Training Schedule Notification</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are pleased to inform you that your training session has been <strong style="color: green;">successfully scheduled</strong>.</p>

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">📘 Course:</td>
            <td style="padding: 8px;">${course}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">📅 Date:</td>
            <td style="padding: 8px;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">⏰ Time:</td>
            <td style="padding: 8px;">${time}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">Please be on time and ensure you're prepared. We’re excited to help you enhance your skills and reach new heights!</p>

        <p>Best regards,<br>
        <strong>LLM Group - Corporate Training Team</strong></p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("❌ Email Error:", err);
    else console.log("📨 Email sent:", info.response);
  });
}

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS training_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT,
    email TEXT,
    department TEXT,
    job_title TEXT,
    training_course TEXT,
    training_level TEXT,
    training_format TEXT,
    preferred_date TEXT,
    preferred_time TEXT,
    scheduled_date TEXT,
    scheduled_time TEXT
  )
`);

// Submit training request
app.post("/submit-training", (req, res) => {
  const {
    employee_name, email, department, job_title,
    training_course, training_level, training_format,
    preferred_date, preferred_time
  } = req.body;

  if (!employee_name || !email || !department || !job_title) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  const stmt = db.prepare(`
    INSERT INTO training_requests (
      employee_name, email, department, job_title,
      training_course, training_level, training_format,
      preferred_date, preferred_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    employee_name, email, department, job_title,
    training_course, training_level, training_format,
    preferred_date, preferred_time,
    function (err) {
      if (err) return res.status(500).json({ message: "Insert failed." });
      res.json({ message: "Training request submitted!", id: this.lastID });
    }
  );

  stmt.finalize();
});

// Get all training requests
app.get("/get-training-requests", (req, res) => {
  db.all("SELECT * FROM training_requests", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching data." });
    res.json(rows);
  });
});

// Get only scheduled trainings
app.get("/get-scheduled-training", (req, res) => {
  db.all(
    `SELECT id, employee_name, email, training_course, scheduled_date, scheduled_time 
     FROM training_requests 
     WHERE scheduled_date IS NOT NULL AND scheduled_time IS NOT NULL`,
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching scheduled trainings:", err);
        return res.status(500).json({ message: "Error fetching scheduled trainings." });
      }
      res.json(rows);
    }
  );
});

// Schedule training and send email
app.post("/schedule-training", (req, res) => {
  const { id, date, time } = req.body;

  if (!id || !date || !time) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  db.get(
    "SELECT email, employee_name, training_course FROM training_requests WHERE id = ?",
    [id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: "Request not found." });
      }

      const { email, employee_name, training_course } = row;

      const stmt = db.prepare(`
        UPDATE training_requests
        SET scheduled_date = ?, scheduled_time = ?
        WHERE id = ?
      `);

      stmt.run(date, time, id, function (err) {
        if (err) return res.status(500).json({ message: "Failed to schedule." });

        // Send email
        sendScheduleEmail(email, employee_name, training_course, date, time);

        res.json({ message: "Training scheduled and email sent ✅", success: true });
      });

      stmt.finalize();
    }
  );
});

// Delete training request
app.post("/delete-training", (req, res) => {
  const { id } = req.body;

  const stmt = db.prepare("DELETE FROM training_requests WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) return res.status(500).json({ message: "Delete failed." });
    res.json({ message: "Training deleted.", success: true });
  });

  stmt.finalize();
});

// Optional: Debug all entries
app.get("/debug-all", (req, res) => {
  db.all("SELECT * FROM training_requests", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Debug fetch failed." });
    res.json(rows);
  });
});



/////
db.run(`CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  description TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS training_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_email TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  assigned_date TEXT NOT NULL,
  status TEXT DEFAULT 'Assigned',
  FOREIGN KEY (course_id) REFERENCES courses(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS progress_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  progress_note TEXT,
  report_date TEXT,
  FOREIGN KEY (assignment_id) REFERENCES training_assignments(id)
)`);

// Create course
app.post('/create-course', (req, res) => {
  const { course_name, required_skills, description } = req.body;
  db.run(`INSERT INTO courses (course_name, required_skills, description) VALUES (?, ?, ?)`,
    [course_name, required_skills, description],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create course' });
      res.json({ message: 'Course created!', courseId: this.lastID });
    }
  );
});

app.get('/get-courses', (req, res) => {
  db.all('SELECT id, course_name FROM courses', [], (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ error: "Failed to fetch courses" });
      } else {
          res.json(rows);
      }
  });
});


// Suggest eligible employees based on course skills
app.get('/suggest-employees/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  db.get(`SELECT required_skills FROM courses WHERE id = ?`, [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ error: 'Course not found' });
    db.all(`SELECT * FROM employees WHERE skills LIKE '%' || ? || '%'`,
      [course.required_skills],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching employees' });
        res.json(rows);
      }
    );
  });
});

app.post('/schedule-training', (req, res) => {
  const { email, scheduled_date, scheduled_time } = req.body;

  if (!email || !scheduled_date || !scheduled_time) {
    return res.status(400).json({ success: false, error: 'Missing input fields' });
  }

  // Find employee_id from email
  db.get(`SELECT id FROM employees WHERE email = ?`, [email], (err, employee) => {
    if (err || !employee) {
      return res.status(400).json({ success: false, error: 'Employee not found' });
    }

    const employee_id = employee.id;

    // Check if employee already has active training
    db.get(`SELECT * FROM training_assignments WHERE employee_id = ? AND status = 'Assigned'`, [employee_id], (err, existing) => {
      if (existing) {
        return res.status(400).json({ success: false, error: 'Employee already has an active training.' });
      }
    });
    

      // Insert into training_assignments
      db.run(
        `INSERT INTO training_assignments (employee_id, scheduled_date, scheduled_time, status) VALUES (?, ?, ?, ?)`,
        [employee_id, scheduled_date, scheduled_time, 'Assigned'],
        function (err) {
          if (err) {
            console.error('DB Insert Error:', err);
            return res.status(500).json({ success: false, error: 'Assignment failed' });
          }
        }
      );
      
      
          // Send email notification
          sendScheduleEmail(email, scheduled_date, scheduled_time)
  .then(() => {
    res.json({ success: true, message: 'Training Scheduled and Email Reminder Sent!' });
  })
  .catch(error => {
    console.error('Error sending schedule email:', error);
    res.status(500).json({ success: false, error: 'Error sending email' });
  });

        }
      );
    });
 
// Send email function
function sendScheduleEmail(email, date, time) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: 'logeshdaya22@gmail.com', // replace with your email
      to: email,
      subject: 'Your Training has been Scheduled',
      text: `Hello,

Your training session has been scheduled.

Date: ${date}
Time: ${time}

Please be prepared!

Best regards,
Your Company`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        console.log('Schedule email sent:', info.response);
        resolve(info);
      }
    });
  });
}



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
