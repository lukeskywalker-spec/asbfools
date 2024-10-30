document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const studentIdInput = document.getElementById('studentId');
    const submitBtn = document.getElementById('submitBtn');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const studentIdError = document.getElementById('studentIdError');

    // Check if IP has already submitted
    fetch('/check-ip')
        .then(response => response.json())
        .then(data => {
            if (data.exists && !window.bypassIP) {
                form.style.display = 'none';
                thankYouMessage.style.display = 'block';
                thankYouMessage.innerHTML = '<h2>You have already submitted an entry!</h2>';
            }
        });

    // Add footer text
    const footerText = document.createElement('div');
    footerText.textContent = 'Made by Ilkay Aya';
    footerText.style.position = 'fixed';
    footerText.style.bottom = '0';
    footerText.style.left = '50%';
    footerText.style.transform = 'translateX(-50%)';
    footerText.style.fontSize = '10px';
    footerText.style.color = '#888';
    footerText.style.padding = '10px';

    document.body.appendChild(footerText);

    // Validate student ID
    studentIdInput.addEventListener('input', () => {
        // Special case for bypass code
        if (studentIdInput.value === 'EVERGREENASBDEV' || 'EVERGREENASBTEST') {
            studentIdError.style.display = 'none';
            submitBtn.disabled = false;
            studentIdInput.setCustomValidity(''); // Clear validation message
            return;
        }
                
        const isValid = /^\d{7}$/.test(studentIdInput.value);
        studentIdError.style.display = 'none';
        submitBtn.disabled = !isValid;

        if (isValid) {
            fetch(`/check-student/${studentIdInput.value}`)
                .then(response => response.json())
                .then(data => {
                    if (data.exists && !window.bypassStudentID) {
                        submitBtn.disabled = true;
                        studentIdError.textContent = 'Sorry, this Student ID has already been used.';
                        studentIdError.style.display = 'block';
                    }
                });
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            studentId: studentIdInput.value,
            teacher: document.getElementById('teacher').value,
            bypassIP: window.bypassIP,
            bypassStudentID: window.bypassStudentID
        };

        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                form.style.display = 'none';
                thankYouMessage.style.display = 'block';
            } else {
                studentIdError.textContent = data.error || 'An error occurred';
                studentIdError.style.display = 'block';
            }
        } catch (error) {
            studentIdError.textContent = 'An error occurred while submitting the form';
            studentIdError.style.display = 'block';
        }
    });
});