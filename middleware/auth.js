const jwt = require("jsonwebtoken");

// Middleware d'authentification basé sur JWT
// Vérifie la présence et la validité du token avant d'autoriser l'accès à la route
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");

    // Stocke l'identifiant utilisateur pour un usage ultérieur dans les contrôleurs
    req.auth = { userId: decodedToken.userId };

    next();
  } catch (error) {
    res.status(401).json({ message: "Accès non autorisé" });
  }
};
