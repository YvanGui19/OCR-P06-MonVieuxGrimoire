const Book = require("../models/book");
const fs = require("fs");

// Supprime un livre et son image associée
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Vérifie que l'utilisateur connecté est bien le propriétaire
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Not authorized" });
      }

      // Suppression du fichier image si présent
      const filename = book.imageUrl.split("/images/")[1];
      const path = `images/${filename}`;

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      // Suppression du livre en base
      Book.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: "Book deleted!" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// Ajoute une note à un livre et met à jour la note moyenne
exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = Number(req.body.rating);

  // Validation de la note
  if (isNaN(grade) || grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ error: "A valid grade between 0 and 5 is required" });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Vérifie si l'utilisateur a déjà noté le livre
      const existingRating = book.ratings.find((r) => r.userId === userId);
      if (existingRating) {
        return res
          .status(400)
          .json({ error: "User has already rated this book" });
      }

      // Ajoute la nouvelle note
      book.ratings.push({ userId, grade });

      // Recalcule la moyenne avec 1 chiffre après la virgule
      const total = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      // Sauvegarde et envoie une réponse adaptée pour le front
      book
        .save()
        .then((updated) => {
          res.status(200).json(updated);
        })
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// Récupère les 3 livres les mieux notés
exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// Récupère un livre spécifique par son ID
exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

// Récupère tous les livres
exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

// Modifie un livre existant et remplace éventuellement l'image
exports.modifyBook = (req, res, next) => {
  // Récupère les données et l'image si présente
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId; // Ne pas autoriser le changement du propriétaire

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Not authorized" });
      }

      // Suppression de l’ancienne image si une nouvelle est uploadée
      if (req.file) {
        const oldFilename = book.imageUrl.split("/images/")[1];
        const oldPath = `images/${oldFilename}`;

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // On ne permet pas de modifier les notes ni la moyenne ici
      delete bookObject.ratings;
      delete bookObject.averageRating;

      // Mise à jour en base
      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() =>
          res.status(200).json({ message: "Book updated successfully!" })
        )
        .catch((error) => res.status(401).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

// Création d’un nouveau livre avec image et initialisation de la note
exports.createBook = (req, res, next) => {
  try {
    console.log("Body book:", req.body.book);
    console.log("File:", req.file);

    if (!req.body.book) {
      return res.status(400).json({ error: "Book data is required" });
    }

    const bookObject = JSON.parse(req.body.book);

    // Validation de la note initiale
    const grade = Number(bookObject.ratings?.[0]?.grade);

    delete bookObject._id;
    delete bookObject._userId;

    if (isNaN(grade) || grade < 0 || grade > 5) {
      return res.status(400).json({
        error: "A valid grade between 0 and 5 is required",
      });
    }

    // Vérifie la présence d'une image
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Création du livre en base
    const book = new Book({
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
      ratings: [
        {
          userId: req.auth.userId,
          grade: grade,
        },
      ],
      averageRating: grade,
    });

    book
      .save()
      .then(() => res.status(201).json({ message: "Livre enregistré !" }))
      .catch((error) => res.status(400).json({ error }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
