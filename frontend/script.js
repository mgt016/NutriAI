document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation
    const navItems = document.querySelectorAll('.nav-items li');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            window.location.href = this.dataset.page;
        });
    });

    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop();
    const activeItem = document.querySelector(`.nav-items li[data-page="${currentPage}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Handle logout
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Implement logout logic here
            window.location.href = 'login.html';
        });
    }

    // Mobile menu toggle
    const menuToggle = document.createElement('button');
    menuToggle.classList.add('menu-toggle');
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        topBar.prepend(menuToggle);

        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Tab functionality for settings page
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
});

// Function to get userId from URL
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("userId"); // Extract userId
}

// Function to fetch user data from API
async function fetchUserData(userId) {
    try {
        if (!userId) throw new Error("User ID is missing in URL.");

        console.log("Fetching user data for userId:", userId);
        let response = await fetch(`http://localhost:5550/user/profileget/${userId}`);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        let data = await response.json();

        if (data.status) {
            localStorage.setItem("userData", JSON.stringify(data.data));
            updateUserUI(data.data);
        } else {
            console.error("User fetch error:", data.msg);
        }
    } catch (error) {
        console.error("API Error:", error);
        document.body.innerHTML = `<h3>Error fetching user data: ${error.message}</h3>`;
    }
}



// Function to update the UI with user data
function updateUserUI(user) {
    console.log("Updating UI with user data:", user);

    // 🌟 Update overview page (index.html)
    updateElement(".welcome", `Hello ${user.name}, Welcome !`);

    // 🌟 Update profile card (index.html & profile.html)
    
    updateElement(".profile-info .name", user.name);
    updateElement(".profile-info .email", user.email);
    updateElement(".profile-info .phone", user.phoneNumber);
    

    // 🌟 Update settings page (settings.html)
    updateInputValue("#name", user.name);
    updateInputValue("#email", user.email);
    updateInputValue("#phone", user.phoneNumber);

    // 🌟 Update profile page (profile.html)
    updateElement(".profile-name", user.name);
    updateInputValue("#email", user.email);
    updateInputValue("#gender", user.gender);
    updateInputValue("#phone", user.phoneNumber);
    updateInputValue("#birthday", formatDate(user.dateOfBirth));
    updateInputValue("#height", user.height);
    updateInputValue("#weight", user.weight);
    updateInputValue("#age", calculateAge(user.dateOfBirth));
    updateSelectValue("#activityLevel", user.activityLevel);
    updateSelectValue("#activity-level", user.activityLevel);

}
// Function to update text content of an element
function updateElement(selector, value) {
    let element = document.querySelector(selector);
    if (element) element.textContent = value;
}

// Function to update input field values
function updateInputValue(selector, value) {
    let input = document.querySelector(selector);
    if (input) input.value = value;
}

// Function to update select field values
function updateSelectValue(selector, value) {
    let select = document.querySelector(selector);
    if (select) select.value = value;
}

// Function to format date (YYYY-MM-DD)
function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
}

// Function to calculate age from date of birth
function calculateAge(dateString) {
    if (!dateString) return "";
    const birthDate = new Date(dateString);
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
}


// Function to update navigation links with userId
function updateNavigationLinks(userId) {
    if (!userId) return; // Exit if userId is not available

    document.querySelectorAll(".nav-items li").forEach((item) => {
        let page = item.getAttribute("data-page");
        item.addEventListener("click", () => {
            window.location.href = `${page}?userId=${userId}`;
        });
    });

    document.querySelectorAll(".action-buttons a").forEach((button) => {
        let href = button.getAttribute("href");
        button.setAttribute("href", `${href}?userId=${userId}`);
    });
}

// Load user data and update UI when page loads
document.addEventListener("DOMContentLoaded", () => {
    const userId = getUserIdFromUrl();
    if (userId) {
        fetchUserData(userId);
        updateNavigationLinks(userId);
    }
});
