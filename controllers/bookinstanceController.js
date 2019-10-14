const BookInstance = require('../models/bookinstance')
const Book = require('../models/book')
const validator = require('express-validator')
const async = require('async')

// Display list of all BookInstances.
// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate('book')
    .exec((err, listBookinstances) => {
      if (err) { return next(err) }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: listBookinstances })
    })
}

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err) }
      if (bookinstance == null) { // No results.
        const err = new Error('Book copy not found')
        err.status = 404
        return next(err)
      }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance })
    })
}

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, 'title')
    .exec((err, books) => {
      if (err) { return next(err) }
      // Successful, so render.
      res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books })
    })
}

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

  // Validate fields.
  validator.body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
  validator.body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').trim().escape(),
  validator.sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    })

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) { return next(err) }
          // Successful, so render.
          res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance })
        })
    } else {
      // Data from form is valid.
      bookinstance.save((err) => {
        if (err) { return next(err) }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url)
      })
    }
  }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance
    .findById(req.params.id)
    .populate('book')
    .exec((err, results) => {
      if (err) { return next(err) }
      if (results.bookinstance === null) { // No results.
        res.redirect('/catalog/bookinstances')
      }
      // Successful, so render.
      res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: results })
    })
}

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance
    .findById(req.params.id)
    .populate('book')
    .exec((err, results) => {
      if (err) { return next(err) }
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) { return next(err) }
        // Success - go to bookinstance list
        res.redirect('/catalog/bookinstances')
      })
    })
}

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel({
    bookinstance: (callback) => {
      BookInstance.findById(req.params.id).populate('book').exec(callback)
    },
    books: (callback) => {
      Book.find(callback)
    }

  }, (err, results) => {
    if (err) { return next(err) }
    if (results.bookinstance === null) { // No results.
      const err = new Error('Bookinstance not found')
      err.status = 404
      return next(err)
    }
    // Success.
    res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.books, bookinstance: results.bookinstance })
  })

  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, books) => {
      if (err) { return next(err) }
      // Successful, so render.
      res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books })
    })
}

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

  // Validate fields.
  validator.body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
  validator.body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').trim().escape(),
  validator.sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    })

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) { return next(err) }
          // Successful, so render.
          res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance })
        })
    } else {
      // Data from form is valid.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
        if (err) { return next(err) }
        // Successful - redirect to book detail page.
        res.redirect(thebookinstance.url)
      })
    }
  }
]
