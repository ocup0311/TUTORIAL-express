const Book = require('../models/book')
const Author = require('../models/author')
const Genre = require('../models/genre')
const BookInstance = require('../models/bookinstance')
const validator = require('express-validator')
const async = require('async')

exports.index = (req, res) => {
  async.parallel(
    {
      book_count: (callback) => {
        Book.countDocuments({}, callback) // Pass an empty object as match condition to find all documents of this collection
      },
      book_instance_count: (callback) => {
        BookInstance.countDocuments({}, callback)
      },
      book_instance_available_count: (callback) => {
        BookInstance.countDocuments({ status: 'Available' }, callback)
      },
      author_count: (callback) => {
        Author.countDocuments({}, callback)
      },
      genre_count: (callback) => {
        Genre.countDocuments({}, callback)
      },
    },
    (err, results) => {
      res.render('index', {
        title: '歐杯的圖書世界',
        error: err,
        data: results,
      })
    }
  )
}

// Display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, 'title author')
    .populate('author')
    .exec((err, listBooks) => {
      if (err) {
        return next(err)
      }
      // Successful, so render
      res.render('book_list', { title: '書籍目錄', book_list: listBooks })
    })
}

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel(
    {
      book: (callback) => {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback)
      },
      book_instance: (callback) => {
        BookInstance.find({ book: req.params.id }).exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.book == null) {
        // No results.
        const err = new Error('Book not found')
        err.status = 404
        return next(err)
      }
      // Successful, so render.
      res.render('book_detail', {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      })
    }
  )
}

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      authors: (callback) => {
        Author.find(callback)
      },
      genres: (callback) => {
        Genre.find(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('book_form', {
        title: '新增書籍',
        authors: results.authors,
        genres: results.genres,
      })
    }
  )
}

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = []
      } else {
        req.body.genre = new Array(req.body.genre)
      }
    }

    next()
  },

  // Validate fields.
  validator
    .body('title', 'Title must not be empty.')
    .isLength({ min: 1 })
    .trim(),
  validator
    .body('author', 'Author must not be empty.')
    .isLength({ min: 1 })
    .trim(),
  validator
    .body('summary', '摘要請介於 50~200 字')
    .isLength({ min: 50, max: 200 })
    .trim(),
  validator.body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields (using wildcard).
  validator.sanitizeBody('title').trim().escape(),
  validator.sanitizeBody('author').trim().escape(),
  validator.sanitizeBody('summary').trim().escape(),
  validator.sanitizeBody('isbn').trim().escape(),
  validator.sanitizeBody('genre.*').trim().escape(),
  // (req, res, next) => { console.log('3: ' + req.body.genre) },

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    })

    console.log('book:', book)

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          authors: (callback) => {
            Author.find(callback)
          },
          genres: (callback) => {
            Genre.find(callback)
          },
        },
        (err, results) => {
          if (err) {
            return next(err)
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = 'true'
            }
          }

          res.render('book_form', {
            title: '新增書籍',
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          })
        }
      )
    } else {
      // Data from form is valid. Save book.
      book.save((err) => {
        if (err) {
          return next(err)
        }
        // successful - redirect to new book record.
        res.redirect(book.url)
      })
    }
  },
]

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
  async.parallel(
    {
      book: (callback) => {
        Book.findById(req.params.id).exec(callback)
      },
      books_bookinstances: (callback) => {
        BookInstance.find({ book: req.params.id }).exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.book === null) {
        // No results.
        res.redirect('/catalog/books')
      }
      // Successful, so render.
      res.render('book_delete', {
        title: '刪除書籍',
        book: results.book,
        book_bookinstances: results.books_bookinstances,
      })
    }
  )
}

// Handle Book delete on POST.
exports.book_delete_post = (req, res, next) => {
  async.parallel(
    {
      book: (callback) => {
        Book.findById(req.body.bookid).exec(callback)
      },
      books_bookinstances: (callback) => {
        BookInstance.find({ book: req.body.bookid }).exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      // Success
      if (results.books_bookinstances.length > 0) {
        // Book has bookinstances. Render in same way as for GET route.
        res.render('book_delete', {
          title: '刪除書籍',
          book: results.book,
          book_bookinstances: results.books_bookinstances,
        })
      } else {
        // Book has no bookinstances. Delete object and redirect to the list of books.
        Book.findByIdAndRemove(req.body.bookid, (err) => {
          if (err) {
            return next(err)
          }
          // Success - go to book list
          res.redirect('/catalog/books')
        })
      }
    }
  )
}

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  // Get book, authors and genres for form.
  async.parallel(
    {
      book: (callback) => {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback)
      },
      authors: (callback) => {
        Author.find(callback)
      },
      genres: (callback) => {
        Genre.find(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.book === null) {
        // No results.
        const err = new Error('Book not found')
        err.status = 404
        return next(err)
      }
      // Success.
      // Mark our selected genres as checked.
      for (let i = 0; i < results.genres.length; i++) {
        for (let j = 0; j < results.book.genre.length; j++) {
          if (
            results.genres[i]._id.toString() ===
            results.book.genre[j]._id.toString()
          ) {
            results.genres[i].checked = 'true'
          }
        }
      }
      res.render('book_form', {
        title: '更新書籍資訊',
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      })
    }
  )
}

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = []
      } else {
        req.body.genre = new Array(req.body.genre)
      }
    }
    next()
  },

  // Validate fields.
  validator
    .body('title', 'Title must not be empty.')
    .isLength({ min: 1 })
    .trim(),
  validator
    .body('author', 'Author must not be empty.')
    .isLength({ min: 1 })
    .trim(),
  validator
    .body('summary', 'Summary must not be empty.')
    .isLength({ min: 1 })
    .trim(),
  validator.body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  validator.sanitizeBody('title').trim().escape(),
  validator.sanitizeBody('author').trim().escape(),
  validator.sanitizeBody('summary').trim().escape(),
  validator.sanitizeBody('isbn').trim().escape(),
  validator.sanitizeBody('genre.*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    })

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          authors: (callback) => {
            Author.find(callback)
          },
          genres: (callback) => {
            Genre.find(callback)
          },
        },
        (err, results) => {
          if (err) {
            return next(err)
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = 'true'
            }
          }
          res.render('book_form', {
            title: '更新書籍資訊',
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          })
        }
      )
    } else {
      // Data from form is valid. Update the record.
      Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
        if (err) {
          return next(err)
        }
        // Successful - redirect to book detail page.
        res.redirect(thebook.url)
      })
    }
  },
]
