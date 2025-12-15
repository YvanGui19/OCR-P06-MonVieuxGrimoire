const sharp = require("sharp");
const fs = require("fs");

// Middleware de traitement d'image : optimise et convertit les fichiers uploadés en WebP
module.exports = async (req, res, next) => {
  // Si aucun fichier n’est présent dans la requête, on passe au middleware suivant
  if (!req.file) return next();

  const dir = "images";

  // Vérifie l'existence du dossier de stockage et le crée si nécessaire
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Nettoyage du nom de fichier pour éviter les caractères problématiques
  // Supprime l'extension d'origine et remplace les espaces par des underscores
  const nameWithoutExt = req.file.originalname
    .replace(/\.[^/.]+$/, "")
    .split(" ")
    .join("_");

  // Génère un nom de fichier unique pour éviter les collisions
  const filename = `${Date.now()}-${nameWithoutExt}.webp`;

  // Conversion de l'image en WebP avec compression pour réduire le poids du fichier
  await sharp(req.file.buffer)
    .webp({ quality: 50 })
    .toFile(`${dir}/${filename}`);

  // Mise à jour des informations du fichier pour les contrôleurs suivants
  req.file.filename = filename;
  req.file.mimetype = "image/webp";

  next();
};
