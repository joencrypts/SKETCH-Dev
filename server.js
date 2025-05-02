const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Data storage
const DATA_FILE = 'submissions.json';

// Initialize data storage
let submissions = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        submissions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Error reading submissions file:', error);
    }
}

// Save submissions to file
function saveSubmissions() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2));
    } catch (error) {
        console.error('Error saving submissions:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// API endpoints
app.post('/api/submit', (req, res) => {
    try {
        const submission = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString()
        };
        submissions.push(submission);
        saveSubmissions();
        res.json({ success: true, id: submission.id });
    } catch (error) {
        console.error('Error processing submission:', error);
        res.status(500).json({ error: 'Failed to process submission' });
    }
});

app.get('/api/submissions', (req, res) => {
    res.json(submissions);
});

app.get('/api/export-xlsx', (req, res) => {
    try {
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(submissions.map(sub => ({
            'Name': sub.name,
            'Register Number': sub.registerNumber,
            'Date of Birth': sub.dob,
            'Year': sub.year,
            'Department': sub.department,
            'Section': sub.section,
            'Current Domain': sub.currentDomain,
            'Task Based on Domain': sub.taskBasedOnDomain,
            'Task Chosen': sub.taskChosen,
            'Drive Link': sub.driveLink,
            'Submission Time': new Date(sub.timestamp).toLocaleString()
        })));

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');
        
        // Send file
        res.send(buffer);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({ error: 'Failed to generate Excel file' });
    }
});

// Admin authentication middleware
const adminAuth = (req, res, next) => {
    const { username, password } = req.body;
    if (username === 'kanimaa' && password === 'suryaa') {
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

app.post('/api/admin/login', adminAuth, (req, res) => {
    res.json({ success: true });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 