document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const photoInput = document.getElementById('foto');
    const photoError = document.getElementById('photoError');

    // Function to update photo validation status
    function updatePhotoValidation() {
        if (photoInput.files.length > 0) {
            // Photo is optional, but if provided, hide error and clear any custom validity
            photoError.style.display = 'none';
            photoInput.setCustomValidity('');
        } else {
            // Photo is optional, so no error or custom validity needed if not provided
            photoError.style.display = 'none';
            photoInput.setCustomValidity('');
        }
    }

    // Preview photo and validate photo input
    window.previewImage = function(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const output = document.getElementById('photoPlaceholder');
            output.src = reader.result;
        };
        reader.readAsDataURL(event.target.files[0]);
        updatePhotoValidation(); // Update validation status when photo is selected
    };

    // Check password match
    function validatePassword() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity("Las contraseñas no coinciden.");
        } else {
            confirmPassword.setCustomValidity('');
        }
    }

    password.onchange = validatePassword;
    confirmPassword.onkeyup = validatePassword;

    form.addEventListener('submit', function(event) {
        updatePhotoValidation(); // Ensure photo validation is checked on form submit
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    }, false);
});
