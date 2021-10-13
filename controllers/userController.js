const passport = require('passport')
const validator = require('express-validator')

exports.user_signup_get = (req, res) => {
  res.render('signup', { title: '註冊新帳戶', info: req.flash('info') })
}

exports.user_signup_post = [
  // Validate fields.
  validator
    .body('username', 'username must be more than 6 characters')
    .isLength({ min: 6 })
    .trim(),
  validator
    .body('password', 'password must be more than 6 characters')
    .isLength({ min: 6 })
    .trim(),
  validator
    .body('first_name')
    .isLength({ min: 1 })
    .trim()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  validator
    .body('family_name')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  validator.body('email', 'Invalid email').isEmail().normalizeEmail().trim(),

  // Sanitize fields.
  validator.sanitizeBody('username').trim().escape(),
  validator.sanitizeBody('password').trim().escape(),
  validator.sanitizeBody('first_name').trim().escape(),
  validator.sanitizeBody('family_name').trim().escape(),
  validator.sanitizeBody('email').trim().escape(),

  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    if (!errors.isEmpty()) {
      // Successful, so render.
      res.render('signup', {
        title: '註冊新帳戶',
        user: req.body,
        errors: errors.array(),
      })
    } else {
      next()
    }
  },

  passport.authenticate('signup', {
    successRedirect: '/',
    failureRedirect: '/users/signup',
    failureFlash: true,
  }),
]

exports.user_login_get = (req, res) => {
  console.log(res.locals)
  res.render('login', { title: '登入', info: req.flash('info') })
}

exports.user_login_post = [
  // Sanitize fields.
  validator.sanitizeBody('username').trim().escape(),
  validator.sanitizeBody('password').trim().escape(),

  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req)

    if (!errors.isEmpty()) {
      // Successful, so render.
      res.render('login', {
        title: '登入',
        user: req.body,
        errors: errors.array(),
      })
    } else {
      next()
    }
  },

  passport.authenticate('login', {
    successRedirect: '/users/profile',
    failureRedirect: '/users/login',
    failureFlash: true,
  }),
]

exports.user_logout = (req, res) => {
  req.logOut()
  req.session.destroy(() => {
    // res.clearCookie('connect.sid')
    res.redirect('/users/login')
  })
}

exports.user_profile = [
  (req, res) => {
    res.render('profile', { user: req.user })
  },
]
