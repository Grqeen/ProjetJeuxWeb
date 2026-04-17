require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Pour analyser les requêtes JSON

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// === ROUTES API ICI ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scores', require('./routes/scores'));

// Redirection globale vers l'accueil si on tape une URL non gérée par l'API
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});


// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connecté avec succès à MongoDB Atlas !");
}).catch(err => {
    console.error("====== ERREUR DE CONNEXION MONGODB ======");
    console.error("Vérifiez l'URL dans .env et l'autorisation IP (0.0.0.0/0) sur Atlas");
    console.error(err.message);
});

// Indispensable pour que Vercel puisse utiliser l'application Express
module.exports = app;
