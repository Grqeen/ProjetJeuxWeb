document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        // Utilisateur connecté
        const liProfile = document.createElement('li');
        liProfile.innerHTML = `<a href="#" style="color:var(--gold); font-weight:bold;">${username}</a>`;
        
        const liLogout = document.createElement('li');
        liLogout.innerHTML = `<a href="#" id="logout-btn" style="color:#ff5252; cursor:pointer;">Déconnexion</a>`;
        
        navLinks.appendChild(liProfile);
        navLinks.appendChild(liLogout);

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.reload();
        });
    } else {
        // Utilisateur déconnecté
        const liLogin = document.createElement('li');
        liLogin.innerHTML = `<a href="login.html" style="color:var(--gold); border: 1px solid var(--gold); padding: 5px 15px; border-radius:3px; transition:0.3s;">Connexion</a>`;
        navLinks.appendChild(liLogin);
    }
});
