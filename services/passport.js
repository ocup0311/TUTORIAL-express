const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt-nodejs')

const User = require('../models/user')

// 從user資料中撈ID
passport.serializeUser(function (user, done) {
  done(null, user._id)
})

// 以ID去撈user資料
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

// 驗證login
passport.use(
  'login',
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        const isValidPassword = (user, password) => {
          return bcrypt.compareSync(password, user.password)
        }

        if (err) {
          return done(err)
        }

        if (!user) {
          return done(null, false, req.flash('info', 'User not found.'))
        }

        if (!isValidPassword(user, password)) {
          return done(null, false, req.flash('info', 'Invalid password'))
        }

        return done(null, user)
      })
    }
  )
)

// 驗證signup
passport.use(
  'signup',
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      const findOrCreateUser = () => {
        User.findOne({ username: username }, (err, user) => {
          if (err) {
            return done(err)
          }
          if (user) {
            return done(null, false, req.flash('info', 'User already exists'))
          } else {
            const newUser = new User({
              username: username,
              password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null),
              email: req.body.email,
              first_name: req.body.first_name,
              family_name: req.body.family_name,
            })

            newUser.save(function (err, user) {
              if (err) {
                throw err
              }

              return done(null, user)
            })
          }
        })
      }

      process.nextTick(findOrCreateUser)
    }
  )
)
