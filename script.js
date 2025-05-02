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

// Google Drive API configuration
const GOOGLE_DRIVE_FOLDER_ID = '1fArZFyyV3YluE7B2sQOSm_UBMYzCwUY-';
const CLIENT_ID = '85016507836-ga96s2pstsfrjugr31fgsjdeii7aemd4.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCdQDwoCUAhq-AmXjihZGMioupYfVVzJvA';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Update the redirect URI to use the Vercel deployment URL
const REDIRECT_URI = 'https://sketch-responses.vercel.app';

// Get DOM elements
const taskBasedOnDomain = document.getElementById('taskBasedOnDomain');
const taskChosen = document.getElementById('taskChosen');
const form = document.getElementById('registrationForm');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

// Initialize the Google API client
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: [DISCOVERY_DOC],
        scope: SCOPES,
        redirect_uri: REDIRECT_URI
    }).then(function () {
        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle the initial sign-in state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

// Load the Google API client
function loadGoogleApi() {
    gapi.load('client:auth2', initClient);
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        // Enable upload functionality
        document.getElementById('dropZone').classList.remove('disabled');
    } else {
        // Disable upload functionality
        document.getElementById('dropZone').classList.add('disabled');
    }
}

// Handle sign-in
function handleSignIn() {
    gapi.auth2.getAuthInstance().signIn();
}

// Handle sign-out
function handleSignOut() {
    gapi.auth2.getAuthInstance().signOut();
}

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
        uploadToGoogleDrive(file);
    }
}

// Modified upload function to use OAuth 2.0
async function uploadToGoogleDrive(file) {
    try {
        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [GOOGLE_DRIVE_FOLDER_ID]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            },
            body: form
        });

        if (response.ok) {
            uploadStatus.textContent = 'File uploaded successfully!';
            uploadStatus.classList.add('success');
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
    const data = Object.fromEntries(formData.entries());
    
    try {
        // You can handle the form data here
        console.log('Form submitted:', data);
        
        // Show success message
        alert('Form submitted successfully!');
        form.reset();
        uploadStatus.textContent = '';
        uploadStatus.classList.remove('success', 'error');
    } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred. Please try again.');
    }
}); 