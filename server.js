const express = require('express');
const path = require('path');
const { initDatabase, saveSubmission, getAllSubmissions } = require('./db');
const XLSX = require('xlsx');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database with error handling
initDatabase()
    .then(() => {
        console.log('Database connection established successfully');
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1); // Exit if database connection fails
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

app.post('/api/admin/login', adminAuth, (req, res) => {
    res.json({ success: true });
});

app.post('/api/submit', async (req, res) => {
    try {
        const submission = await saveSubmission(req.body);
        res.json({ success: true, submission });
    } catch (error) {
        console.error('Error submitting task:', error);
        if (error.message.includes('already exists')) {
            res.status(409).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: 'Error submitting task' });
        }
    }
});

app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await getAllSubmissions();
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

app.get('/api/export-xlsx', async (req, res) => {
    try {
        const submissions = await getAllSubmissions();
        
        // Convert submissions to worksheet format
        const worksheet = XLSX.utils.json_to_sheet(submissions.map(sub => ({
            Name: sub.name,
            'Register Number': sub.register_number,
            'Date of Birth': new Date(sub.dob).toLocaleDateString(),
            Year: sub.year,
            Department: sub.department,
            Section: sub.section,
            'Current Domain': sub.current_domain,
            'Task Based on Domain': sub.task_based_on_domain,
            'Task Chosen': sub.task_chosen,
            'Drive Link': sub.drive_link,
            'Submission Time': new Date(sub.submission_time).toLocaleString()
        })));

        // Create workbook and add worksheet
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
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ error: 'Error exporting to Excel' });
    }
});

// Catch-all route for static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app; 