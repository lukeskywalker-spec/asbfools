const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const UAParser = require('ua-parser-js');
const moment = require('moment');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { MailerSend, EmailParams } = require('mailersend');
const express = require('express');
const xlsx = require('xlsx');

const app = express();
const db = new Database('students.db');

app.use(bodyParser.json());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    teacher TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    device_info TEXT NOT NULL,
    submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id),
    UNIQUE(ip_address)
  );
`);

// MailerSend API configuration
const mailerSend = new MailerSend({
  apiKey: 'mlsn.095fe858a32fc97ff28948fb3fd0b7350738790c98c34cece97e128605f2fe7e', // Replace with your actual MailerSend API key
});

// Function to export database to Excel
function exportToExcel(userAgentString) {
  try {
    const stmt = db.prepare('SELECT * FROM submissions ORDER BY submission_time DESC');
    const rows = stmt.all();

    if (rows.length === 0) {
      console.log('No data to export');
      return false;
    }

    // Process the data for better readability
    const processedData = rows.map(row => {
      let deviceInfo;
      try {
        const parser = new UAParser(userAgentString);
        deviceInfo = parser.getResult();
      } catch (e) {
        deviceInfo = { browser: {}, os: {}, device: {} };
      }

      return {
        'Student ID': row.student_id,
        'Teacher': row.teacher,
        'Submission Time': moment(row.submission_time).format('YYYY-MM-DD HH:mm:ss'),
        'IP Address': row.ip_address,
        'Browser': `${deviceInfo.browser.name || 'Unknown'} ${deviceInfo.browser.version || ''}`.trim(),
        'Operating System': `${deviceInfo.os.name || 'Unknown'} ${deviceInfo.os.version || ''}`.trim(),
        'Device Type': deviceInfo.device.type || 'Desktop'
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(processedData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },  // Student ID
      { wch: 25 },  // Teacher
      { wch: 20 },  // Submission Time
      { wch: 15 },  // IP Address
      { wch: 25 },  // Browser
      { wch: 25 },  // Operating System
      { wch: 15 }   // Device Type
    ];

    // Write to file
    XLSX.writeFile(wb, 'student_submissions.xlsx');
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

app.use(bodyParser.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Serve the form page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  const { studentId, teacher, bypassIP, bypassStudentID } = req.body;
  const ip = req.ip;
  const parser = new UAParser(req.headers['user-agent']);
  const deviceInfo = JSON.stringify(parser.getResult());

  // Check for bypass credentials
  if ((studentId === 'EVERGREENASBDEV' || studentId === 'EVERGREENASBTEST') && teacher === 'V. Blackburn') {
    // Skip saving to database and sending email
    res.json({ 
      success: true,
      bypass: true,
      message: 'Bypass successful, no data saved.' 
    });
    return; // Exit the handler early
  }

  try {
    const stmt = db.prepare('INSERT INTO submissions (student_id, teacher, ip_address, device_info) VALUES (?, ?, ?, ?)');

    // Generate unique identifier for bypassed entries
    const bypassedIp = bypassIP ? `${ip}-${Date.now()}` : ip;
    const bypassedStudentId = bypassStudentID ? `${studentId}-${Date.now()}` : studentId;

    stmt.run(bypassedStudentId, teacher, bypassedIp, deviceInfo);

    // Export to Excel after successful submission
    const exportSuccess = exportToExcel(req.headers['user-agent']);

    // Send email notification using MailerSend
    mailerSend.email.send({
      from: {
        email: 'MS_Qk7H0y@trial-yzkq3405292gd796.mlsender.net' // Replace with your actual email address
      },
      to: [
        { email: 'evergreenfools@proton.me' } // Replace with recipient's email
      ],
      subject: 'New Submission Received',
      html: `
        <p>A new submission has been received.</p>
        <p><strong>Student ID:</strong> ${bypassedStudentId}</p>
        <p><strong>Teacher:</strong> ${teacher}</p>
        <p><strong>Submission Time:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
        <p><strong>IP Address:</strong> ${bypassedIp}</p>
        <p><strong>Operating System:</strong> ${parser.getResult().os?.name || 'Unknown'} ${parser.getResult().os?.version || ''}</p>
        <p><strong>Browser:</strong> ${parser.getResult().browser?.name || 'Unknown'} ${parser.getResult().browser?.version || ''}</p>
        <p><strong>Device Type:</strong> ${parser.getResult().device?.type || 'Desktop'}</p>
      `,
    }).then((response) => {
      console.log("Email sent successfully:", response);
    }).catch((error) => {
      console.error("Error sending email:", error);
    });

    res.json({ 
      success: true,
      excelExported: exportSuccess
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ 
        success: false, 
        error: 'Student ID or IP address already submitted' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Server error' 
      });
    }
  }
});

// Get all submissions
app.get('/get-submissions', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        student_id,
        teacher,
        submission_time,
        ip_address,
        device_info
      FROM submissions 
      ORDER BY submission_time DESC
    `);
    const rows = stmt.all();

    const submissions = rows.map(row => {
      let deviceInfo;
      try {
        deviceInfo = JSON.parse(row.device_info);
      } catch (e) {
        deviceInfo = { browser: {}, os: {}, device: {} };
      }

      return {
        ...row,
        browser: `${deviceInfo.browser.name || 'Unknown'} ${deviceInfo.browser.version || ''}`.trim(),
        os: `${deviceInfo.os.name || 'Unknown'} ${deviceInfo.os.version || ''}`.trim(),
        device: deviceInfo.device.type || 'Desktop'
      };
    });

    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Check if student ID exists
app.get('/check-student/:id', (req, res) => {
  const stmt = db.prepare('SELECT student_id FROM submissions WHERE student_id = ?');
  const result = stmt.get(req.params.id);
  res.json({ exists: !!result });
});

// Check if IP exists
app.get('/check-ip', (req, res) => {
  const stmt = db.prepare('SELECT ip_address FROM submissions WHERE ip_address = ?');
  const result = stmt.get(req.ip);
  res.json({ exists: !!result });
});

// Clear all submissions
app.post('/clear-data', (req, res) => {
  try {
    db.prepare('DELETE FROM submissions').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clear data' });
  }
});

// Endpoint to manually trigger Excel export
app.get('/export-excel', (req, res) => {
  const success = exportToExcel(req.headers['user-agent']);
  if (success) {
    res.json({ success: true, message: 'Excel file exported successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to export Excel file' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
