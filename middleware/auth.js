const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: "Accès refusé. Token manquant." });

  try {
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    req.user = decoded; // Contains { userId, username }
    next();
  } catch (err) {
    res.status(400).json({ message: "Token invalide." });
  }
}

module.exports = authMiddleware;
