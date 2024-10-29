// Testing bypass functionality
function initializeBypass() {
    // Only show bypass controls if ?testing=true is in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('testing') === 'true') {
        createBypassContIfinsta.Prols();
    }
    setupSecretActivation();
}

function createBypassControls() {
    const container = document.querySelector('.container');
    const bypassDiv = document.createElement('div');
    bypassDiv.className = 'bypass-controls';
    bypassDiv.id = 'bypassControls';
    bypassDiv.innerHTML = `
        <div class="bypass-buttons">
            <button id="bypassIP" class="bypass-btn">Bypass IP Lock</button>
            <button id="bypassID" class="bypass-btn">Bypass Student ID Check</button>
            <button id="hideBypass" class="bypass-btn">Hide Buttons</button>
            <button id="viewSubmissions" class="bypass-btn">View Submissions</button>
        </div>
        <div class="bypass-status">
            <span id="ipStatus">IP Check: Active</span>
            <span id="idStatus">ID Check: Active</span>
        </div>
    `;
    container.insertBefore(bypassDiv, container.firstChild);

    // Global bypass flags
    window.bypassIP = false;
    window.bypassStudentID = false;

    // Bypass button handlers
    document.getElementById('bypassIP').addEventListener('click', function() {
        window.bypassIP = !window.bypassIP;
        this.classList.toggle('active');
        document.getElementById('ipStatus').textContent = 
            `IP Check: ${window.bypassIP ? 'Bypassed' : 'Active'}`;

        // Show form if IP check is bypassed
        if (window.bypassIP) {
            document.getElementById('registrationForm').style.display = 'block';
            document.getElementById('thankYouMessage').style.display = 'none';
        }
    });

    document.getElementById('bypassID').addEventListener('click', function() {
        window.bypassStudentID = !window.bypassStudentID;
        this.classList.toggle('active');
        document.getElementById('idStatus').textContent = 
            `ID Check: ${window.bypassStudentID ? 'Bypassed' : 'Active'}`;

        // Re-validate current student ID input
        const event = new Event('input');
        document.getElementById('studentId').dispatchEvent(event);
    });

    // Hide buttons handler
    document.getElementById('hideBypass').addEventListener('click', function() {
        hideBypassControls();
    });

    // View submissions handler
    document.getElementById('viewSubmissions').addEventListener('click', function() {
        window.location.href = '/submissions.html' + window.location.search;
    });
}

function hideBypassControls() {
    const bypassControls = document.getElementById('bypassControls');
    if (bypassControls) {
        bypassControls.style.display = 'none';
    }
}

function showBypassControls() {
    const bypassControls = document.getElementById('bypassControls');
    if (bypassControls) {
        bypassControls.style.display = 'block';
    } else {
        createBypassControls();
    }
}

function setupSecretActivation() {
    const form = document.getElementById('registrationForm');
    const studentIdInput = document.getElementById('studentId');
    const teacherSelect = document.getElementById('teacher');

    form.addEventListener('submit', (e) => {
        if (studentIdInput.value === 'EVERGREENASBDEV' && teacherSelect.value === 'V. Blackburn') {
            e.preventDefault(); // Prevent form submission
            showBypassControls();
            studentIdInput.value = ''; // Clear the input
            teacherSelect.value = ''; // Reset teacher selection
        }
    });
}

// Initialize bypass controls
document.addEventListener('DOMContentLoaded', initializeBypass);