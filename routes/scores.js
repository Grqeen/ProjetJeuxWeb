const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const authMiddleware = require('../middleware/auth');

// Récupérer le top 10 pour un jeu
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    // Pour 'escape', trier par temps croissant (le plus rapide en premier)
    // Pour les autres jeux, trier par score décroissant
    const sortOrder = gameId === 'escape' ? 1 : -1;
    const topScores = await Score.find({ gameId })
                                 .sort({ score: sortOrder })
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

// Enregistrer ou mettre à jour un score (nécessite d'être connecté)
// Un seul score par joueur par jeu, mis à jour uniquement si meilleur
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gameId, score } = req.body;
    
    // Chercher si le joueur a déjà un score pour ce jeu
    const existing = await Score.findOne({ user: req.user.userId, gameId });
    
    if (existing) {
      // Pour 'escape' : le meilleur temps = le plus bas
      // Pour les autres jeux : le meilleur score = le plus haut
      const isBetter = gameId === 'escape' 
        ? score < existing.score 
        : score > existing.score;
      
      if (isBetter) {
        existing.score = score;
        existing.date = Date.now();
        await existing.save();
        res.status(200).json({ message: "Nouveau record ! Temps mis à jour.", score: existing });
      } else {
        res.status(200).json({ message: "Ton record actuel est meilleur, pas de mise à jour." });
      }
    } else {
      // Premier score pour ce joueur sur ce jeu
      const newScore = new Score({
        user: req.user.userId,
        gameId,
        score
      });
      await newScore.save();
      res.status(201).json({ message: "Score enregistré avec succès !", score: newScore });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'enregistrement du score." });
  }
});

module.exports = router;
