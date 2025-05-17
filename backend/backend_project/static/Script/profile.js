// profile.js
// Remove all localStorage related code for user data and editing
// The profile data is now loaded by Django templates.

// Get the profile image element and the modal elements
const profilePreview = document.getElementById('profilePreview');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');

// Get profile picture related elements
const imgInput = document.getElementById('img-input');
// Removed uploadBox
const profileActions = document.getElementById('profileActions'); // Container for remove button
const removeBtn = document.getElementById('removeBtn');
// Replaced updateBtn with uploadChangeBtn
const uploadChangeBtn = document.getElementById('uploadChangeBtn');
const uploadChangeBtnText = document.getElementById('uploadChangeBtnText'); // Span inside the button
const profilePictureForm = document.getElementById('profilePictureForm'); // Get the form

// URLs and data passed from the Django template (defined in a <script> tag in the HTML)
// const updatePictureUrl = "{% url 'update_profile_picture' %}"; // Defined globally in HTML
// const defaultImageUrl = "{% static 'CSS/assets/blue.avif' %}"; // Defined globally in HTML
// const initialProfilePictureUrl = "{{ customer.profile_picture_url|default:'' }}"; // Defined globally in HTML


// Helper function to get CSRF cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Profile picture preview in modal
if (profilePreview) {
  profilePreview.addEventListener('click', function() {
    // Only open modal if there is an image source and it's visible
    if (this.src && !this.classList.contains('hide')) {
        modalImage.src = this.src;
        modal.classList.remove('hide');
    }
  });
}

// Function to close the profile picture preview modal
function closeModal() {
  modal.classList.add('hide');
}

// --- Profile Picture Update Functionality ---

// Function to update the UI based on whether a profile picture exists
function updateProfilePictureUI(imageUrl) {
    // Check if the imageUrl is a non-empty string. Using a simple check here;
    // a more robust check might verify it's a valid URL format or starts with MEDIA_URL.
    const hasPicture = imageUrl && typeof imageUrl === 'string';

    if (hasPicture) {
        profilePreview.src = imageUrl;
        profilePreview.classList.remove('hide'); // Show the image
        uploadChangeBtnText.textContent = 'Change Picture'; // Change button text
        uploadChangeBtn.classList.add('hide'); // Hide the upload button
        profileActions.classList.remove('hide'); // Show remove button container
        removeBtn.classList.remove('hide'); // Show remove button
    } else {
        profilePreview.src = ''; // Clear the image source
        profilePreview.classList.add('hide'); // Hide the image
        uploadChangeBtnText.textContent = 'Upload Picture'; // Change button text
        uploadChangeBtn.classList.remove('hide'); // Show the upload button
        profileActions.classList.add('hide'); // Hide remove button container
        removeBtn.classList.add('hide'); // Hide remove button
    }
     // Clear the file input value
     imgInput.value = '';
}

// Event listener for the combined "Upload/Change" button
if (uploadChangeBtn && imgInput) {
    uploadChangeBtn.addEventListener('click', function() {
        // Trigger the hidden file input when the button is clicked
        imgInput.click();
    });
}

// Event listener for when a file is selected (triggered by button click)
if (imgInput && typeof updatePictureUrl !== 'undefined') { // Check if element and URL exist
    imgInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const formData = new FormData();
            formData.append('profile_picture', this.files[0]);

            const csrftoken = getCookie('csrftoken');

            // Indicate loading state if desired
            // uploadChangeBtnText.textContent = 'Uploading...';
            // uploadChangeBtn.disabled = true;

            fetch(updatePictureUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            })
            .then(response => {
                // Re-enable button and reset text regardless of success/failure if you added loading state
                // uploadChangeBtn.disabled = false;
                // updateProfilePictureUI(profilePreview.src); // This would reset text prematurely if upload failed

                if (!response.ok) {
                    // Handle non-2xx responses
                    return response.json().then(err => { throw new Error(err.message || 'Failed to upload profile picture'); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update the displayed profile picture using the URL from the backend
                    updateProfilePictureUI(data.profile_picture_url);
                    // Removed the line below:
                    // window.location.reload();
                    // Optionally, display a success message here using JavaScript if you prefer not to reload.
                    // For now, rely on Django's messages framework if the user reloads or navigates.
                    console.log("Profile picture updated successfully!");
                } else {
                    // Handle error
                     console.error("Failed to upload profile picture:", data.message);
                     alert("Failed to upload profile picture: " + data.message);
                     // Clear the file input on error
                    imgInput.value = '';
                    // Update UI to reflect no new picture was set based on the *current* displayed image
                    // Check if current src is empty or hidden - simplified the check
                    updateProfilePictureUI(profilePreview.classList.contains('hide') ? null : profilePreview.src);
                }
            })
            .catch(error => {
                console.error('Error uploading profile picture:', error);
                alert('An error occurred while uploading the profile picture: ' + error.message);
                 // Clear the file input on error
                imgInput.value = '';
                 // Update UI to reflect no new picture was set based on the *current* displayed image
                 // Check if current src is empty or hidden - simplified the check
                updateProfilePictureUI(profilePreview.classList.contains('hide') ? null : profilePreview.src);
                 // Re-enable button and reset text on error if you added loading state
                // uploadChangeBtn.disabled = false;
                // updateProfilePictureUI(profilePreview.src);
            });
        } else {
            // If user cancelled file selection, just clear the input
            imgInput.value = '';
        }
    });
}


// Event listener for the "Remove" button
if (removeBtn && typeof updatePictureUrl !== 'undefined') { // Check if element and URL exist
    removeBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to remove your profile picture?")) {
            const formData = new FormData();
            formData.append('clear_picture', 'true'); // Indicate that we want to clear the picture

            const csrftoken = getCookie('csrftoken');

            fetch(updatePictureUrl, {
                method: 'POST',
                body: formData,
                 headers: {
                    'X-CSRFToken': csrftoken // Include the CSRF token in the headers
                }
            })
            .then(response => {
                 if (!response.ok) {
                    // Handle non-2xx responses
                    return response.json().then(err => { throw new Error(err.message || 'Failed to remove profile picture'); });
                 }
                 return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update the UI to show the default state (no picture)
                    updateProfilePictureUI(null); // Pass null to show default/empty state
                    // Removed the line below:
                    // window.location.reload();
                     // Optionally, display a success message here using JavaScript.
                     console.log("Profile picture removed successfully!");
                } else {
                    // Handle error
                    console.error("Failed to remove profile picture:", data.message);
                    alert("Failed to remove profile picture: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error removing profile picture:', error);
                alert('An error occurred while removing the profile picture: ' + error.message);
            });
        }
    });
}


// --- Removed Account Deletion Functionality ---
// Removed:
// - confirmDeleteAccount function
// - closeDeleteModal function
// - Variables related to the delete modal (deleteModal, deletePasswordInput)


// --- Removed Functionality ---
// Removed:
// - All localStorage interactions (getItem, setItem, removeItem) for user data.
// - loadUserData function (data loaded by Django template).
// - editAttrBrl function (related to localStorage and borrowed books).
// - Password change modal and related functions (openPasswordModal, updatePassword, setError, closePasswordModal, togglePasswordVisibility, password strength indicator).
// - Form editing functionality (enableEdit, saveField).
// - The DOMContentLoaded logic that adjusted links based on localStorage roles (now handled by Django template).

// Keep session storage cleanup if these items are used elsewhere in your app
window.sessionStorage.removeItem('edit');
window.sessionStorage.removeItem('editedBook');
window.sessionStorage.removeItem('coverPath');
window.sessionStorage.removeItem('description');

// Ensure other scripts like header.js, footer.js, theme.js are correctly linked and handle UI independently.

// Note: The Borrowed/Favorited counts are now loaded directly by the Django view.
// The JavaScript variables booksBorrowed and booksFavorited are no longer updated by JS in this version.
// Theme preference handling should be in theme.js


// Re-initialize UI state based on the image displayed by the template on page load
document.addEventListener('DOMContentLoaded', function() {
    const profilePreview = document.getElementById('profilePreview');
    const uploadChangeBtn = document.getElementById('uploadChangeBtn');
    const uploadChangeBtnText = document.getElementById('uploadChangeBtnText');
    const profileActions = document.getElementById('profileActions'); // Container for remove button
    const removeBtn = document.getElementById('removeBtn'); // Get remove button here too
    // Get the initial profile picture URL passed from the template
    // const initialProfilePictureUrl = "{{ customer.profile_picture_url|default:'' }}"; // Defined globally in HTML


    if (profilePreview && uploadChangeBtn && uploadChangeBtnText && profileActions && removeBtn && typeof initialProfilePictureUrl !== 'undefined') {
        // Check if the initialProfilePictureUrl has a value
        const hasProfilePicture = initialProfilePictureUrl !== '';

        if (hasProfilePicture) {
            // Set the image source from the initial URL
            profilePreview.src = initialProfilePictureUrl;
            profilePreview.classList.remove('hide'); // Show the image
            // If a picture exists, hide upload button and show remove button
            uploadChangeBtn.classList.add('hide');
            profileActions.classList.remove('hide'); // Show remove button container
            removeBtn.classList.remove('hide'); // Ensure remove button is visible
            // Set initial text for the change button (though it's hidden)
            uploadChangeBtnText.textContent = 'Change Picture';

        } else {
            // If no picture, hide the image and show upload button
            profilePreview.src = ''; // Explicitly set to empty
            profilePreview.classList.add('hide'); // Hide the image
            uploadChangeBtn.classList.remove('hide'); // Show the upload button
            profileActions.classList.add('hide'); // Hide remove button container
            removeBtn.classList.add('hide'); // Ensure remove button is hidden
             // Set initial text for the upload button
             uploadChangeBtnText.textContent = 'Upload Picture';
        }
    }
});