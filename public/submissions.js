document.addEventListener('DOMContentLoaded', () => {
    const submissionsBody = document.getElementById('submissionsBody');
    const exportBtn = document.getElementById('exportBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const backBtn = document.getElementById('backBtn');

    // Load submissions
    async function loadSubmissions() {
        try {
            const response = await fetch('/get-submissions');
            const data = await response.json();

            if (data.success && data.submissions.length > 0) {
                submissionsBody.innerHTML = data.submissions.map(sub => `
                    <tr>
                        <td>${sub.student_id}</td>
                        <td>${sub.teacher}</td>
                        <td>${new Date(sub.submission_time).toLocaleString()}</td>
                        <td>${sub.ip_address}</td>
                        <td>${sub.browser}</td>
                        <td>${sub.os}</td>
                        <td>${sub.device}</td>
                    </tr>
                `).join('');
            } else {
                submissionsBody.innerHTML = '<tr><td colspan="7" class="no-data">No submissions found</td></tr>';
            }
        } catch (error) {
            submissionsBody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading submissions</td></tr>';
        }
    }

    // Export to Excel
    exportBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/export-excel');
            const data = await response.json();

            if (data.success) {
                window.location.href = '/download-excel';
            } else {
                alert('Failed to export: ' + (data.error || 'No data to export'));
            }
        } catch (error) {
            alert('Failed to export submissions');
        }
    });

    // Clear all data
    clearDataBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL submission data? This cannot be undone!')) {
            try {
                const response = await fetch('/clear-data', { method: 'POST' });
                const data = await response.json();

                if (data.success) {
                    alert('All data has been cleared');
                    loadSubmissions(); // Reload the table
                } else {
                    alert('Failed to clear data');
                }
            } catch (error) {
                alert('Failed to clear data');
            }
        }
    });

    // Back button
    backBtn.addEventListener('click', () => {
        window.location.href = '/' + window.location.search;
    });

    // Initial load
    loadSubmissions();
});