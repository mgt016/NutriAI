document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('Uemail');
    
    if (!userEmail) {
        alert("User email not found! Please sign up again.");
        window.location.href = 'signup.html';
    }
});

document.getElementById('details-form').addEventListener('submit', async function (e) { // Make this function async
    e.preventDefault();
    clearErrors();

    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const goal = document.getElementById('goal').value;
    const activity = document.getElementById('activity').value;

    let isValid = true;
    if (!height || height < 50 || height > 250) { showError('height', 'Enter valid height'); isValid = false; }
    if (!weight || weight < 20 || weight > 300) { showError('weight', 'Enter valid weight'); isValid = false; }
    if (!gender) { showError('gender', 'Select gender'); isValid = false; }
    if (!goal) { showError('goal', 'Select goal'); isValid = false; }
    if (!activity) { showError('activity', 'Select activity level'); isValid = false; }
    
    if (!isValid) return;

    const userEmail = localStorage.getItem('Uemail');
    if (!userEmail) {
        alert("User email not found! Please sign up again.");
        window.location.href = 'signup.html';
        return;
    }

    const updatedUserData = { 
        email: userEmail, 
        height, 
        weight, 
        gender, 
        goal, 
        activityLevel: activity 
    };

    try {
        const response = await fetch('http://localhost:5550/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUserData)
        });

        const data = await response.json();

        if (data.status) {
            // Extract user ID from the response
            const userId = data.user._id;
            
            // Redirect with user ID as a URL parameter
            window.location.href = `index.html?userId=${userId}`;
        } else {
            alert(data.msg); // Show error message if the request fails
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
});

function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(element => element.textContent = '');
}
