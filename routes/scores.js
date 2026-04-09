const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const authMiddleware = require('../middleware/auth');

// Récupérer le top 10 pour un jeu
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    // Trier par score décroissant, limiter à 10, et récupérer le username
    const topScores = await Score.find({ gameId })
                                 .sort({ score: -1 })
                                 .limit(10)
                                 .populate('user', 'username');
    
    // Reformater pour le frontend de façon plus simple
    const formattedScores = topScores.map(s => ({
        id: s._id,
        username: s.user ? s.user.username : 'Inconnu',
        score: s.score,
        date: s.date
    }));

    res.json(formattedScores);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des scores." });
  }
});

// Enregistrer un nouveau score (nécessite d'être connecté)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gameId, score } = req.body;
    const newScore = new Score({
      user: req.user.userId,
      gameId,
      score
    });
    await newScore.save();
    res.status(201).json({ message: "Score enregistré avec succès !", score: newScore });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'enregistrement du score." });
  }
});

module.exports = router;
