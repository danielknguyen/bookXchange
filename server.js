// load dependencies
var express = require('express'),
    dotenv = require('dotenv').config(),
    bodyParser = require('body-parser'),
    engines = require('consolidate'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    socket = require('socket.io'),
    books = require('google-books-search'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    app = express();

// load db instance
var db = require('./libs/db.js');
// load user module
var User = require('./models/userSchema.js');
var Book = require('./models/bookSchema.js');

// app configuration
var appConfig = function() {
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname + '/views');
  app.engine('html', engines.nunjucks);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('dev'));
}();

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
   mongooseConnection: db.connection,
   // 1 day in seconds
   ttl: 86400,
   autoRemove: 'native'
  }),
  cookie: {
   secure: false,
   // 30 min in milli
   maxAge: 1800000
  }
}));

app.use(flash());

// set success and error variables on every request
app.use(function(req, res, next) {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(function(req, res, next) {
  if (req.session.user) {
    User.findOne({ '_id': req.session.user.userId }, function(err, user) {
      // console.log(req.session.user);
      if (user) {
        req.session.user = {
          name: user.name,
          userId: user._id,
          location: user.city + ', ' + user.state 
        };
      } else {
        req.session.user = undefined;
      };
      next();
    });
  } else {
    next();
  };
});

// create port for server to listen on
var port = process.env.PORT || 27017;

var server = app.listen(port, function() {
  console.log('Express server is listening on port %s.', port);
});

// create web socket instance
var io = socket(server);

// load routes module
var routes = require('./routes/routes.js')(app, User, books, Book);
