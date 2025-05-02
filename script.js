// Task options for each domain
const domainTasks = {
    'O&PR': [
        'Plan a big event',
        'Create a joint event proposal'
    ],
    'MEDIA': [
        'Create a 30-second reel',
        'Develop a reel based on your own idea'
    ],
    'DESIGN': [
        'Create a carousel post for Texus',
        'Design a set of posters'
    ],
    'MARKETING': [
        'Learn about body language',
        'Develop a 3-month roadmap'
    ],
    'CONTENT': [
        'Create a 1-minute Instagram reel',
        'Write a script for a reel'
    ],
    'R&D': [
        'Identify and learn 1 to 3 new technologies',
        'Share your ideas for a hackathon'
    ]
};

// Get DOM elements
const taskBasedOnDomain = document.getElementById('taskBasedOnDomain');
const taskChosen = document.getElementById('taskChosen');
const form = document.getElementById('registrationForm');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

// Update task options when domain is selected
taskBasedOnDomain.addEventListener('change', function() {
    const selectedDomain = this.value;
    const tasks = domainTasks[selectedDomain] || [];
    
    // Clear existing options
    taskChosen.innerHTML = '<option value="">Select Task</option>';
    
    // Add new options
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task;
        option.textContent = task;
        taskChosen.appendChild(option);
    });
});

// Drag and drop functionality
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        uploadStatus.textContent = 'Uploading...';
        uploadFile(file);
    }
}

// File upload function
async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileType', file.type);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            uploadStatus.textContent = 'File uploaded successfully!';
            uploadStatus.classList.add('success');
            // Store the file ID for form submission
            document.getElementById('fileId').value = result.fileId;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        uploadStatus.textContent = 'Upload failed. Please try again.';
        uploadStatus.classList.add('error');
        console.error('Upload error:', error);
    }
}

// Form validation
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    return isValid;
}

// Handle form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Collect form data
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Form submitted successfully!');
            form.reset();
            uploadStatus.textContent = '';
            uploadStatus.classList.remove('success', 'error');
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred. Please try again.');
    }
}); 