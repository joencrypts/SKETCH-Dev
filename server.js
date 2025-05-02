const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    const isLoggedIn = req.cookies?.isLoggedIn === 'true';
    if (isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Data storage (in-memory array)
let submissions = [];

// Load existing data from JSON file if it exists
const dataFile = 'submissions.json';
try {
    if (fs.existsSync(dataFile)) {
        const data = fs.readFileSync(dataFile, 'utf8');
        submissions = JSON.parse(data);
    }
} catch (error) {
    console.error('Error loading submissions:', error);
}

// Save submissions to JSON file
function saveSubmissions() {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(submissions, null, 2));
    } catch (error) {
        console.error('Error saving submissions:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Protected route - Admin Dashboard
app.get('/admin-dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// API endpoints
app.post('/submit-form', upload.single('file'), (req, res) => {
    try {
        const submission = {
            name: req.body.name,
            regNo: req.body.registerNumber,
            dob: req.body.dob,
            year: req.body.year,
            department: req.body.department,
            section: req.body.section,
            currentDomain: req.body.currentDomain,
            taskDomain: req.body.taskBasedOnDomain,
            task: req.body.taskChosen,
            uploadedFile: req.file ? req.file.filename : null,
            timestamp: new Date().toISOString()
        };

        submissions.push(submission);
        saveSubmissions();

        res.json({ 
            success: true, 
            message: 'Form submitted successfully',
            submission 
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting form' 
        });
    }
});

// Protected API endpoints
app.get('/entries', isAuthenticated, (req, res) => {
    res.json(submissions);
});

app.get('/download/:filename', isAuthenticated, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ 
            success: false, 
            message: 'File not found' 
        });
    }
});

app.get('/export-xlsx', isAuthenticated, (req, res) => {
    try {
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(submissions.map(sub => ({
            Name: sub.name,
            'Register Number': sub.regNo,
            'Date of Birth': sub.dob,
            Year: sub.year,
            Department: sub.department,
            Section: sub.section,
            'Current Domain': sub.currentDomain,
            'Task Domain': sub.taskDomain,
            Task: sub.task,
            'Uploaded File': sub.uploadedFile,
            'Submitted At': new Date(sub.timestamp).toLocaleString()
        })));

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');

        // Send file
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating Excel file' 
        });
    }
});

// Logout endpoint
app.get('/logout', (req, res) => {
    res.clearCookie('isLoggedIn');
    res.redirect('/login');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 