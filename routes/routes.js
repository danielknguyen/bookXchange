var routes = function(app, User, books, Book) {

  var bcrypt = require('bcrypt-nodejs');

  app.get('/', function(req, res) {
    res.render('index.html', {
      user: req.session.user
    });
  });
  app.get('/register', function(req, res) {
    if (req.session.user) {
      req.flash('error', 'User already registered');
      res.redirect('/books');
    } else {
      res.render('register.html', {
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    };
  });
  app.post('/register', function(req, res) {
    var email = req.body.registerEmail.toLowerCase();
    var password = req.body.registerPassword;
    var verifyPassword = req.body.registerVerifyPw;
    var name = req.body.form_name.toLowerCase();
    var city = req.body.form_city.toLowerCase();
    var state = req.body.form_state.toUpperCase();
    // console.log('email, password, verifyPw: ', email, password, verifyPassword);

    // instantiate new user object
    var user = new User();

    User.findOne({ 'email': email }, function(err, person) {
      if (err) {
        console.log(err);
      }
      // user doesn't exist; add new user
      if (!person) {
        // check if both passwords match
        if (password !== verifyPassword) {
          // console.log('Passwords do not match');
          req.flash('error', 'Passwords do not match');
          res.redirect('/register');
        } else {
          // add user properties
          user.email = email;
          user.name =  name;
          user.city = city;
          user.state = state;
          user.password = user.generateHash(password);
          user.created_at = new Date();

          user.save(function(err) {
            if (err) {
              console.log(err);
            };
          });

          req.session.user = {
            name: user.name,
            userId: user._id,
            location: user.city + ', ' + user.state
          };

          console.log('New user has been registered ', user);
          req.flash('success', 'Successfully logged in!');
          res.redirect('/books');
        };
      } else {
        // user exists
        // console.log('Email already exists');
        req.flash('error', 'Email already exists');

        res.redirect('/register');
      };
    });
  });
  app.get('/login', function(req, res) {
    if (req.session.user) {
      req.flash('error', 'User already logged in');
      res.redirect('/books');
    } else {
      res.render('login.html', {
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    }
  });
  app.post('/login', function(req, res) {
    var user = new User();
    var email = req.body.loginEmail.toLowerCase();
    var password = req.body.loginPassword;

    User.findOne({ 'email': email }, function(err, person) {
      // if err throw err
      if (err) {
        throw err;
        // if user does not exist redirect to login page and display error
      } else if (!person) {
        req.flash('error', 'Incorrect email or does not exist');
        res.redirect('/login');
      } else {
        // Load hash from your password DB
        bcrypt.compare(password, person.password, function(err, result) {

          if (err) {
            throw err;
          };
          // if password is correct create session object and redirect to dashboard
          if (result === true) {

            req.session.user = {
              name: person.name,
              userId: person._id,
              location: user.city + ', ' + user.state
            };

            req.flash('success', 'You are logged in');
            res.redirect('/dashboard');
            // if password incorrect redirect back to login and display error message
          } else {
            req.flash('error', 'Password incorrect');
            res.redirect('/login');
          };
        });
      };
    });
  });
  app.get('/books', function(req, res) {
    res.render('books.html', {
      user: req.session.user,
      error_message: req.flash('error'),
      success_message: req.flash('success')
    });
  });
  app.get('/settings', isLoggedIn, function(req, res) {
    res.render('settings.html', {
      user: req.session.user,
      error_message: req.flash('error'),
      success_message: req.flash('success')
    });
  });
  app.post('/settings', function(req, res) {
    var user = new User();
    var userId = req.session.user.userId;
    var currentPassword = req.body.changePassword;
    var newPassword = req.body.newPassword;
    var verifyNewPassword = req.body.verifyNewPassword;

    // console.log('userId, currentPassword, newPassword, verifyPW ', userId, currentPassword, newPassword, verifyNewPassword);

    User.findOne({ '_id': userId }, function(err, person) {
      if (err) {
        console.log(err);
      };
      if (newPassword === verifyNewPassword) {
        bcrypt.compare(currentPassword, person.password, function(err, result) {
          if (err) {
            console.log(err);
          };
          if (result === true) {
            person.password = user.generateHash(newPassword);
            person.updated_at = new Date();
            person.save(function(err) {
              if (err) {
                console.log(err);
              };
              req.flash('success', 'Your password has successfully changed');
              res.redirect('/settings');
            });
          } else {
            req.flash('error', 'Your current password is incorrect');
            res.redirect('/settings');
          };
        });
      } else {
        req.flash('error', 'Your new password does not match');
        res.redirect('/settings');
      };
    });
  });
  app.post('/settings/location', function(req, res) {
    var userId = req.session.user.userId;
    var city = req.body.newCity.toLowerCase();
    var state = req.body.newState.toUpperCase();
    // console.log('userId, city, state ', userId, city, state);
    User.findOne({ '_id': userId }, function(err, person) {
      if (err) {
        console.log(err);
      };
      person.city = city;
      person.state = state;
      person.updated_at = new Date();
      person.save(function(err) {
        if (err) {
          console.log(err);
        };
        req.flash('success', 'Your location has successfully changed');
        res.redirect('/settings');
      });
    });
  });
  app.get('/logout', isLoggedIn, function(req, res) {
    req.session.destroy(function(err) {
      if (err) {
        next(err);
      } else {
        res.redirect('/login');
      };
    });
  });
  app.get('/dashboard', isLoggedIn, function(req, res) {
    var myBooksCount;
    var yourTradeReqCount;
    var tradeRequestToYouCount;

    Book.find({ 'user_id': req.session.user.userId }, function(err, data) {
      if (err) {
        console.log(err);
      };
      if (data.length === 0) {
        myBooksCount = 0;
        req.session.myBooksCount = 0;
        res.render('dashboard.html', {
          user: req.session.user,
          books: [],
          my_books_count: myBooksCount,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      } else {
        myBooksCount = data.length;
        req.session.myBooksCount = data.length;
        res.render('dashboard.html', {
          user: req.session.user,
          books: [],
          my_books_count: myBooksCount,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      };
    });

  });
  app.post('/dashboard', isLoggedIn, function(req, res) {
    var newBook = Book();
    var book = req.body.searchBook;

    books.search(book, function(error, results) {
      if (error) {
        console.log(error);
      }

      if (results.length !== 0) {
        req.session.book = book;
        res.render('dashboard.html', {
          user: req.session.user,
          books: results,
          my_books_count: req.session.myBooksCount,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      } else {
        req.flash('error', 'Books not found');
        res.redirect('/dashboard');
      };
    });
  });
  app.get('/dashboard/mybooks', isLoggedIn, function(req, res) {

    Book.find({ 'user_id': req.session.user.userId }, function(err, books) {
      if (err) {
        console.log(err);
      };
      if (books.length !== 0) {
        res.render('myBooks.html', {
          user: req.session.user,
          myBooks: books,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      } else {
        res.render('myBooks.html', {
          user: req.session.user,
          myBooks:[],
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      }
    });
  });
  app.post('/dashboard/add/:volume_id', function(req, res) {
    var volume_id = req.params.volume_id;
    // console.log(volume_id);
    // check first if book exists in library
    var promise1 = new Promise(function(resolve, reject) {
      Book.findOne( { "volume_id": volume_id }, function(err, data) {
        if (err) {
          console.log(err);
        };
        // if no data exist accept
        if (!data) {
          resolve(data);
        // if book exist in database reject
        } else {
          reject(data);
        };
      });
    });
    // add book to database if does not exist
    promise1.then(function isOk(err, results) {
      if (err) {
        console.log(err);
      };
      // console.log('this is the results ', results);
      books.lookup(volume_id, function(error, data) {
        if (error) {
          console.log(error);
        }

        if (data.length !== 0) {
          // console.log(data);
          var title = data.title;
          var subtitle = data.subtitle;
          var authors = [];
          for (var i = 0; i < data.authors.length; i++) {
            authors.push(data.authors[i]);
          };
          var publisher = data.publisher;
          var publishedDate = data.publishedDate;
          var link = data.link;
          var thumbnail = data.thumbnail;
          var description = data.description;

          var book = new Book({
            user_id: req.session.user.userId,
            volume_id: data.id,
            title: title,
            authors: authors,
            publisher: publisher,
            publishedDate: publishedDate,
            link: link,
            thumbnail: thumbnail,
            description: description
          });
          // save book in database
          book.save(function(err, book) {
            if (err) {
              console.log(err);
            };
            console.log('Successfully saved ', book);
          });
          // console.log('this is the book being added ', book);
          req.flash('success', book.title + ' has been added to your library');
          res.redirect('/dashboard/mybooks');
        } else {
          req.flash('error', 'Book not found');
          res.redirect('/dashboard');
        };
      });
    }).catch(function notOk(err) {
      console.log(err);
      req.flash('error', 'An error occured or book already exists in library');
      res.redirect('/dashboard');
    });
  });
  app.post('/dashboard/remove/:volume_id', function(req, res) {
    var volume_id = req.params.volume_id;
    Book.findOneAndRemove({
      $and: [
        { 'user_id': req.session.user.userId },
        { 'volume_id': volume_id}
      ]
    }, function(err, book) {
      if (err) {
        console.log(err);
      };
      // console.log(book.title + ' was deleted');
      req.flash('success', book.title + ' was deleted');
      res.redirect('/dashboard/mybooks');
    });
  });
  app.get('/requests', function(req, res) {
    res.render('requests.html', {
      user: req.session.user,
      error_message: req.flash('error'),
      success_message: req.flash('success')
    });
  });
  app.get('/users', function(req, res) {
    res.render('users.html', {
      user: req.session.user,
      error_message: req.flash('error'),
      success_message: req.flash('success')
    });
  });
};
// middleware to check if user is logged in
var isLoggedIn = function(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    req.flash('error', 'Login required');
    res.redirect('/login');
  }
};
// middleware to title case string
var titleCase = function(string) {
  var tempStr;
  for (var i = 0; i < string.length; i++) {
    tempStr = string[0].toUpperCase() + string.slice(1);
  };
  return tempStr;
};
module.exports = routes;
