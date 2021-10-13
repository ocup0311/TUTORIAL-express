require('dotenv').config()
require('./services/passport')
const { MONGODB_URI, PASSPORT_SECRET, COOKIES_SECRET } = require('./configs')
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const passport = require('passport')
const flash = require('connect-flash')
const session = require('express-session')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const catalogRouter = require('./routes/catalog')
const compression = require('compression')
const helmet = require('helmet')

const app = express()

// Set up mongoose connection
const mongoose = require('mongoose')
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use(helmet()) // 不確定放哪步驟，add/disable specific headers
app.use(cookieParser(COOKIES_SECRET))

// 設置 session
app.use(
  session({
    secret: PASSPORT_SECRET,
    saveUninitialized: true,
    resave: false,
    cookie: { secure: process.env.NODE_ENV === 'production' ? true : false },
  })
)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(compression()) // Compress all routes

app.use(express.static(path.join(__dirname, 'public')))

// passport
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// 設置全域變數
app.use((req, res, next) => {
  app.locals.user = req.user
  next()
})

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
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
