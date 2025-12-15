const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Contrôleur d'inscription : crée un nouvel utilisateur sécurisé
exports.signup = (req, res, next) => {
  // Hash du mot de passe avant stockage en base
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      // Création d'une nouvelle instance utilisateur avec le mot de passe chiffré
      const user = new User({
        email: req.body.email,
        password: hash,
      });

      // Enregistrement de l'utilisateur en base de données
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// Contrôleur de connexion : vérifie les identifiants et génère un token JWT
exports.login = (req, res, next) => {
  // Recherche de l'utilisateur par son email
  User.findOne({ email: req.body.email })
    .then((user) => {
      // Si l'utilisateur n'existe pas, on renvoie une erreur d'authentification
      if (!user) {
        return res
          .status(401)
          .json({ error: "Paire identifiant/mot de passe incorrect" });
      }

      // Comparaison entre le mot de passe fourni et le hash stocké en base
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          // Si le mot de passe est invalide, on bloque la connexion
          if (!valid) {
            return res
              .status(401)
              .json({ error: "Paire identifiant/mot de passe incorrect" });
          }

          // Génération d'un token JWT contenant l'identifiant utilisateur et une date d'expiration
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              expiresIn: "24h",
            }),
          });
        })
        // Erreur serveur lors de la comparaison du mot de passe
        .catch((error) => res.status(500).json({ error }));
    })
    // Erreur serveur lors de la recherche utilisateur
    .catch((error) => res.status(500).json({ error }));
};
