document.addEventListener("DOMContentLoaded", function () {
    // Toggle Notification Dropdown
    const bell = document.getElementById("notification-bell");
    const dropdown = document.getElementById("notification-dropdown");

    bell.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (event) {
        if (!bell.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = "none";
        }
    });

    // Load training notifications
    function loadTrainingNotifications() {
        dropdown.innerHTML = "<li>Loading...</li>"; // Show loading state

        fetch("http://localhost:3000/get-scheduled-training")
            .then(response => response.json())
            .then(data => {
                dropdown.innerHTML = ""; // Clear loading message

                // Load from localStorage
                const localTraining = JSON.parse(localStorage.getItem("trainingSchedule")) || [];

                // Merge local and backend data
                const allTrainings = [...localTraining, ...data];

                if (allTrainings.length === 0) {
                    dropdown.innerHTML = "<li>No scheduled trainings.</li>";
                } else {
                    allTrainings.forEach(training => {
                        let name = training.employee_name || "User";
                        let date = training.scheduled_date || training.date;
                        let time = training.scheduled_time || training.time;

                        dropdown.innerHTML += `<li>📢 <strong>${name}</strong> training scheduled on <strong>${date}</strong> at <strong>${time}</strong></li>`;
                    });

                    // Highlight bell if notifications exist
                    bell.classList.add("has-notifications");
                }
            })
            .catch(error => {
                console.error("Error fetching scheduled training:", error);
                dropdown.innerHTML = "<li>Error loading notifications.</li>";
            });
    }

    // Load notifications on page load
    loadTrainingNotifications();

    // User authentication check
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "login.html"; // Redirect to login if not logged in
    } else {
        const shortEmail = userEmail.split("@")[0];
        document.getElementById("user-profile").textContent = `👤 ${shortEmail}`;
    }
});

// Logout function
window.logout = function () {
    localStorage.removeItem("userEmail");
    window.location.href = "login.html"; // Redirect to login page
};