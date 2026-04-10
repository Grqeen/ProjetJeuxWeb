const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Vérifier si existant
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: "Ce pseudo est déjà pris." });

    // Hacher le mdp
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Identifiants incorrects." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Identifiants incorrects." });

    // Créer token
    const token = jwt.sign(
        { userId: user._id, username: user.username }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
    );
    res.json({ token, username: user.username });
  } catch (err) {
    console.error("=== ERREUR LOGIN ===", err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
});

module.exports = router;
