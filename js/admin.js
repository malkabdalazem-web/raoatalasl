/*
  Rawat Alasal Tech Tricks - Admin Logic
  - Login Handling
*/

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleLogin(e) {
    e.preventDefault();

    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    if (password === 'hbh71hbh') {
        localStorage.setItem('isAdmin', 'true');
        window.location.href = 'products.html';
    } else {
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = 'كلمة السر غير صحيحة';
    }
}
