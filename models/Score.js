const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true },
  score: { type: Number, required: true },
  time: { type: String, required: false }, // LA LIGNE À AJOUTER
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', ScoreSchema);