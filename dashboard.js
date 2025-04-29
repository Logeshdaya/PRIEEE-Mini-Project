document.addEventListener('DOMContentLoaded', function() {
    const storedRequests = JSON.parse(localStorage.getItem('trainingRequests')) || [];
    const tableBody = document.querySelector('#training-requests tbody');

    storedRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.name}</td>
            <td>${request.email}</td>
            <td>${request.department}</td>
            <td>${request.domain}</td>
            <td>${request.experience}</td>
            <td>${request.skillset}</td>
            <td>
                <input type="date" class="schedule-date">
                <input type="time" class="schedule-time">
                <button class="schedule-btn">Send Schedule</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
});

document.addEventListener('click', async function(event) {
    if (event.target.classList.contains('schedule-btn')) {
        const row = event.target.closest('tr');
        const email = row.children[1].textContent;
        const date = row.querySelector('.schedule-date').value;
        const time = row.querySelector('.schedule-time').value;

        if (!date || !time) {
            alert('❌ Please select a date and time before scheduling.');
            return;
        }

        console.log("📩 Sending email to:", email, "| Date:", date, "| Time:", time);

        try {
            const response = await fetch('http://localhost:5000/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, date, time })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ " + data.message);
            } else {
                alert("❌ Email failed: " + data.error);
                console.error("❌ Error response:", data);
            }

        } catch (error) {
            alert('❌ Error sending email');
            console.error("❌ Fetch error:", error);
        }

        let scheduledTrainings = JSON.parse(localStorage.getItem('scheduledTrainings')) || [];
        scheduledTrainings.push({ email, date, time });
        localStorage.setItem('scheduledTrainings', JSON.stringify(scheduledTrainings));
    }
});

            
