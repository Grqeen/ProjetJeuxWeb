const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const authMiddleware = require('../middleware/auth');

// Récupérer le top 10 pour un jeu
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Logique de tri : 
    // Escape = temps le plus court (score croissant)
    // Defense = survie la plus longue (survivalSeconds décroissant)
    // Autres = points (score décroissant)
    let sortCriteria = { score: -1 }; 
    if (gameId === 'escape') sortCriteria = { score: 1 };
    if (gameId === 'defense') sortCriteria = { survivalSeconds: -1 };

    const topScores = await Score.find({ gameId })
                                 .sort(sortCriteria)
                                 .limit(10)
                                 .populate('user', 'username');
    
    const formattedScores = topScores.map(s => ({
        id: s._id,
        username: s.user ? s.user.username : 'Inconnu',
        score: s.score,
        time: s.time,
        survivalSeconds: s.survivalSeconds,
        date: s.date
    }));

    res.json(formattedScores);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des scores." });
  }
});

// Enregistrer ou mettre à jour un score
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gameId, score, time, survivalSeconds } = req.body; 
    const existing = await Score.findOne({ user: req.user.userId, gameId });
    
    if (existing) {
      let isBetter = false;
      if (gameId === 'escape') {
          isBetter = score < existing.score;
      } else if (gameId === 'defense') {
          isBetter = survivalSeconds > (existing.survivalSeconds || 0);
      } else {
          isBetter = score > existing.score;
      }
      
      if (isBetter) {
        existing.score = score;
        existing.time = time;
        existing.survivalSeconds = survivalSeconds;
        existing.date = Date.now();
        await existing.save();
        res.status(200).json({ message: "Nouveau record !" });
      } else {
        res.status(200).json({ message: "Record actuel meilleur." });
      }
    } else {
      const newScore = new Score({
        user: req.user.userId,
        gameId,
        score,
        time,
        survivalSeconds
      });
      await newScore.save();
      res.status(201).json({ message: "Score enregistré !" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la sauvegarde." });
  }
});

module.exports = router;