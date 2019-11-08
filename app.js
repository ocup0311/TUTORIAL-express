const createError = require('http-errors')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const flash = require('connect-flash')
const bcrypt = require('bcrypt-nodejs')
const session = require('express-session')

const User = require('./models/user')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const catalogRouter = require('./routes/catalog')
const compression = require('compression')
const helmet = require('helmet')

const app = express()

// Set up mongoose connection
const mongoose = require('mongoose')
const mongoDB = process.env.MONGODB_URI || 'your mongoDB url'
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use(helmet()) // 不確定放哪步驟，add/disable specific headers

// 設置 session
app.use(session({
  secret: 'ocupsecret',
  saveUninitialized: true,
  resave: false
}))

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
passport.use('login', new LocalStrategy({
  passReqToCallback: true
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
}))

// 驗證signup
passport.use('signup', new LocalStrategy({
  passReqToCallback: true
}, (req, username, password, done) => {
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
          family_name: req.body.family_name
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
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(compression()) // Compress all routes

app.use(express.static(path.join(__dirname, 'public')))

// passport
app.use(passport.initialize())
app.use(passport.session())

// 設置全域變數
app.use((req, res, next) => {
  app.locals.user = req.user
  next()
})

app.use(flash())

// 設置路徑
app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/catalog', catalogRouter)
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
