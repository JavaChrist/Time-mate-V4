// SHOW HIDDEN - PASSWORD
const showHiddenPass = (loginPass, loginEye) => {
    const input = document.getElementById(loginPass),
        iconEye = document.getElementById(loginEye)

    iconEye.addEventListener('click', () => {
        // Change password to text
        if (input.type === 'password') {
            //Switch to text
            input.type = 'text'

            // Change icon
            iconEye.classList.add('ri-eye-line')
            iconEye.classList.remove('ri-eye-off-line')
        } else {
            //Change to password
            input.type = 'password'

            // Change icon
            iconEye.classList.remove('ri-eye-line')
            iconEye.classList.add('ri-eye-off-line')
        }
    })
}
showHiddenPass('login-pass', 'login-eye')
showHiddenPass('register-pass', 'register-eye')

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const auth = firebase.auth();

    // Vérifier si l'utilisateur est déjà connecté
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Si l'utilisateur est connecté, rediriger vers app.html
            window.location.href = './app.html';
        }
    });

    console.log('Login form:', loginForm);
    console.log('Register form:', registerForm);

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    console.log('Show register link:', showRegisterLink);
    console.log('Show login link:', showLoginLink);

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clicking show register');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clicking show login');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Gestion du login
    if (loginForm) {
        loginForm.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('Connexion réussie!');
                    // Redirection vers app.html
                    window.location.href = './app.html';
                })
                .catch((error) => {
                    alert('Erreur de connexion: ' + error.message);
                });
        });
    }

    // Gestion du register
    if (registerForm) {
        registerForm.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('Inscription réussie!');
                    // Après inscription réussie, on connecte automatiquement
                    // et on redirige vers app.html
                    window.location.href = './app.html';
                })
                .catch((error) => {
                    alert('Erreur d\'inscription: ' + error.message);
                });
        });
    }
});