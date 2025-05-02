const { sql } = require('@vercel/postgres');

// Initialize database table
async function initDatabase() {
    try {
        // Create submissions table with Neon-optimized settings
        await sql`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                register_number VARCHAR(50) NOT NULL,
                dob DATE NOT NULL,
                year VARCHAR(10) NOT NULL,
                department VARCHAR(100) NOT NULL,
                section VARCHAR(50) NOT NULL,
                current_domain VARCHAR(50) NOT NULL,
                task_based_on_domain VARCHAR(50) NOT NULL,
                task_chosen TEXT NOT NULL,
                drive_link TEXT NOT NULL,
                submission_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_register_number UNIQUE (register_number)
            );
        `;
        console.log('Database initialized successfully with Neon configuration');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Save submission to database with Neon-optimized query
async function saveSubmission(submission) {
    try {
        const result = await sql`
            INSERT INTO submissions (
                name, register_number, dob, year, department, section,
                current_domain, task_based_on_domain, task_chosen, drive_link
            ) VALUES (
                ${submission.name},
                ${submission.registerNumber},
                ${submission.dob}::date,
                ${submission.year},
                ${submission.department},
                ${submission.section},
                ${submission.currentDomain},
                ${submission.taskBasedOnDomain},
                ${submission.taskChosen},
                ${submission.driveLink}
            )
            RETURNING *;
        `;
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('A submission with this register number already exists');
        }
        console.error('Error saving submission:', error);
        throw error;
    }
}

// Get all submissions with Neon-optimized query
async function getAllSubmissions() {
    try {
        const result = await sql`
            SELECT 
                id,
                name,
                register_number,
                dob,
                year,
                department,
                section,
                current_domain,
                task_based_on_domain,
                task_chosen,
                drive_link,
                submission_time AT TIME ZONE 'UTC' as submission_time
            FROM submissions
            ORDER BY submission_time DESC;
        `;
        return result.rows;
    } catch (error) {
        console.error('Error fetching submissions:', error);
        throw error;
    }
}

module.exports = {
    initDatabase,
    saveSubmission,
    getAllSubmissions
}; 