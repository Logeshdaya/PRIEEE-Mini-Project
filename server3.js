const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./training.db');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'logeshdaya22@gmail.com',
        pass: 'qxpl rvos uexd yqzx'
    }
});

// API to schedule training
app.post('/schedule-training', (req, res) => {
    const { email, scheduled_date, scheduled_time } = req.body;

    if (!email || !scheduled_date || !scheduled_time) {
        return res.status(400).json({ success: false, message: 'Missing fields.' });
    }

    // Find employee ID by email
    db.get('SELECT id, name FROM employees WHERE email = ?', [email], (err, employee) => {
        if (err) {
            console.error('Error finding employee:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        // Insert into training_assignments
        const insertQuery = `
            INSERT INTO training_assignments (employee_id, course_id, assigned_date, scheduled_date, scheduled_time, status)
            VALUES (?, NULL, date('now'), ?, ?, 'Assigned')
        `;

        db.run(insertQuery, [employee.id, scheduled_date, scheduled_time], function(err) {
            if (err) {
                console.error('Error inserting assignment:', err);
                return res.status(500).json({ success: false, message: 'Database insertion failed.' });
            }

            // Send notification email
            const mailOptions = {
                from: '"LLM Solutions" <logeshdaya22@gmail.com>',
                to: email,  // employee's email
                subject: `📅 Your Training is Scheduled - LLM Group`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9;">
                    <h2 style="color: #0066cc; text-align: center;">LLM Group - Training Schedule Notification</h2>
                    <p>Dear <strong>${employee.name}</strong>,</p>
                    <p>We are pleased to inform you that your training session has been <strong style="color: green;">successfully scheduled</strong>.</p>
            
                    <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">📅 Date:</td>
                            <td style="padding: 8px;">${scheduled_date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">⏰ Time:</td>
                            <td style="padding: 8px;">${scheduled_time}</td>
                        </tr>
                    </table>
            
                    <p style="margin-top: 20px;">Please be on time and ensure you're prepared. We’re excited to help you enhance your skills and reach new heights!</p>
            
                    <p>Best regards,<br>
                    <strong>LLM Solutions - Corporate Training Team</strong></p>
                </div>
                `
            };
            

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Email failed:', err);
                    return res.status(500).json({ success: false, message: 'Email sending failed.' });
                } else {
                    console.log('Email sent:', info.response);
                    return res.json({ success: true, message: 'Training scheduled and email sent.' });
                }
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
