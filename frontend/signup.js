document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Reset error messages
    clearErrors();

    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phoneNumber = document.getElementById('phone').value.trim();
    const dateOfBirth = document.getElementById('dob').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    let isValid = true;

    // Name validation
    if (name.split(' ').filter(word => word.length >= 2).length < 2) {
        showError('name', 'Please enter your full name (first & last name)');
        isValid = false;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        showError('phone', 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    // Date of birth validation
    const dobDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (!dateOfBirth || age < 13 || age > 100) {
        showError('dob', 'Age must be between 13 and 100 years');
        isValid = false;
    }

    // Password validation
    const passwordRegex = /^(?=.*\d)(?=.*[\W_]).{8,}$/;
if (!passwordRegex.test(password)) {
    showError('password', 'Password must be at least 8 characters long, contain at least one number, and one special character');
    isValid = false;
}


    if (!isValid) return;

    // Send data to backend API
    try {
        const response = await fetch('http://localhost:5550/register', { // Change to your actual backend URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phoneNumber, password, dateOfBirth })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('Uemail', email); // Save user data in local storage
            alert('User registered successfully');
            window.location.href = 'userdetails.html'; // Redirect to login page
        } else {
            alert(data.msg); // Show backend error messages
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
});

// Helper functions for showing and clearing errors
function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}
