const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true },
  score: { type: Number, required: true }, // Points bruts
  time: { type: String, required: false },  // Chrono formaté (ex: "01:06")
  survivalSeconds: { type: Number, required: false }, // Pour le tri (ex: 66)
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', ScoreSchema);