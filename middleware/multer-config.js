const multer = require("multer");

// Configuration du stockage en mémoire (RAM) au lieu du disque
// Les fichiers seront traités par Sharp avant d'être éventuellement sauvegardés
const storage = multer.memoryStorage();

module.exports = multer({
  storage: storage,

  // Filtre appliqué aux fichiers envoyés par le client
  // Ici, tous les fichiers sont acceptés (le contrôle du type est géré ailleurs)
  fileFilter: (req, file, callback) => {
    // null = pas d'erreur, true = fichier accepté
    callback(null, true);
  },
}).single("image"); // Attend un champ "image" dans la requête multipart/form-data
