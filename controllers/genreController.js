const Genre = require('../models/genre')
const Book = require('../models/book')
const async = require('async')
const validator = require('express-validator')

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, listGenre) {
      if (err) { return next(err) }
      // Successful, so render
      res.render('genre_list', { title: '類別目錄', genre_list: listGenre })
    })
}

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id)
        .exec(callback)
    },

    genre_books: function (callback) {
      Book.find({ genre: req.params.id })
        .exec(callback)
    }

  }, function (err, results) {
    if (err) { return next(err) }
    if (results.genre == null) { // No results.
      const err = new Error('Genre not found')
      err.status = 404
      return next(err)
    }
    // Successful, so render
    res.render('genre_detail', { title: `類別 ${results.genre.name} 資訊`, genre: results.genre, genre_books: results.genre_books })
  })
}

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: '新增類別' })
}

// Handle Genre create on POST.
exports.genre_create_post = [

  // Validate that the name field is not empty.
  validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),

  // Sanitize (escape) the name field.
  validator.sanitizeBody('name').escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre(
      { name: req.body.name }
    )

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: '新增類別', genre: genre, errors: errors.array() })
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name })
        .exec((err, foundGenre) => {
          if (err) { return next(err) }

          if (foundGenre) {
            // Genre exists, redirect to its detail page.
            res.redirect(foundGenre.url)
          } else {
            genre.save(function (err) {
              if (err) { return next(err) }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url)
            })
          }
        })
    }
  }
]

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel({
    genre: (callback) => {
      Genre.findById(req.params.id).exec(callback)
    },
    genres_books: (callback) => {
      Book.find({ genre: req.params.id }).exec(callback)
    }
  }, (err, results) => {
    if (err) { return next(err) }
    if (results.genre === null) { // No results.
      res.redirect('/catalog/genres')
    }
    // Successful, so render.
    res.render('genre_delete', { title: '刪除類別資訊', genre: results.genre, genre_books: results.genres_books })
  })
}

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel({
    genre: (callback) => {
      Genre.findById(req.body.genreid).exec(callback)
    },
    genres_books: (callback) => {
      Book.find({ genre: req.body.genreid }).exec(callback)
    }
  }, (err, results) => {
    if (err) { return next(err) }
    // Success
    if (results.genres_books.length > 0) {
      // Genre has books. Render in same way as for GET route.
      res.render('genre_delete', { title: '刪除類別資訊', genre: results.genre, genre_books: results.genres_books })
    } else {
      // Genre has no books. Delete object and redirect to the list of genres.
      Genre.findByIdAndRemove(req.body.genreid, (err) => {
        if (err) { return next(err) }
        // Success - go to genre list
        res.redirect('/catalog/genres')
      })
    }
  })
}

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id)
    .exec((err, results) => {
      if (err) { return next(err) }
      if (results === null) { // No results.
        const err = new Error('Book not found')
        err.status = 404
        return next(err)
      }
      res.render('genre_form', { title: '更新類別資訊', genre: results })
    })
}

// Handle Genre update on POST.
exports.genre_update_post = [

  // Validate that the name field is not empty.
  validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),

  // Sanitize (escape) the name field.
  validator.sanitizeBody('name').escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    })

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: '更新類別資訊', genre: genre, errors: errors.array() })
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) { return next(err) }
        // Successful - redirect to book detail page.
        res.redirect(thegenre.url)
      })
    }
  }
]
