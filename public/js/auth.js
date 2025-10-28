document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageEl = document.getElementById('form-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                // Redireciona imediatamente para a página principal após o login
                window.location.href = '/';
            } else {
                const result = await response.json();
                messageEl.textContent = result.message;
                messageEl.style.color = 'red';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();
            
            if (response.ok) {
                messageEl.textContent = 'Registro bem-sucedido! Redirecionando para o login...';
                messageEl.style.color = 'lightgreen';
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                messageEl.textContent = result.message;
                messageEl.style.color = 'red';
            }
        });
    }
});