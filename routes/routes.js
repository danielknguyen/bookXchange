var routes = function(app, User, books, Book, Request) {

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
    var name = req.body.formName.toLowerCase();
    var city = req.body.formCity.toLowerCase();
    var state = req.body.formState.toUpperCase();
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
          res.redirect('/dashboard');
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
    var promise;
    if (req.session.user) {
      promise = new Promise(function(resolve, reject) {
        Book.find({ 'user_id': { $ne: req.session.user.userId } }, function(err, data) {
          if (err) {
            console.log(err);
          };
          resolve(data);
        });
      });

      promise.then(function isOk(results) {
        Request.find({ 'user_id': req.session.user.userId }, function(err, request) {
          if (err) {
            console.log(err);
          };
          var new_data = [];
          for (var i = 0; i < results.length; i++) {
            var s = false;
            for (var j = 0; j < request.length; j++) {
              if (results[i]._id == request[j].book_id) {
                s = true;
              };
            };
            if (s === false) {
              results[i].already_requested = 'false';
              new_data.push(results[i]);
            } else {
              results[i].already_requested = 'true';
              new_data.push(results[i]);
            };
          };
          res.render('books.html', {
            user: req.session.user,
            allBooks: new_data,
            error_message: req.flash('error'),
            success_message: req.flash('success')
          });
        });
      });
    } else {
      Book.find({}, function(err, data) {
        if (err) {
          console.log(err);
        };
        res.render('books.html', {
          allBooks: data,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      });
    };
  });
  app.get('/settings', isLoggedIn, function(req, res) {
    res.render('settings.html', {
      user: req.session.user,
      error_message: req.flash('error'),
      success_message: req.flash('success')
    });
  });
  app.post('/settings', isLoggedIn, function(req, res) {
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
  app.post('/settings/location', isLoggedIn, function(req, res) {
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

    var promise = new Promise(function(resolve, reject) {
      Book.find({ 'user_id': req.session.user.userId }, function(err, data) {
        if (err) {
          console.log(err);
        };
        myBooksCount = data.length;
        req.session.myBooksCount = data.length;
        resolve(myBooksCount);
      });
    });

    promise.then(function isOk(myBooksCount) {
      var promise2 = new Promise(function(resolve, reject) {
        Request.find({ 'user_id': req.session.user.userId }, function(err, data) {
          if (err) {
            console.log(err);
          };
          // console.log('requestslength ',data.length);
          yourTradeReqCount = data.length;
          req.session.yourTradeReqCount = data.length;
          var count = {
            myBooksCount: myBooksCount,
            yourTradeReqCount: yourTradeReqCount
          };
          resolve(count);
        });
      });
      promise2.then(function isOk(count) {
        Request.find({ 'ownerId': req.session.user.userId }, function(err, data) {
          if (err) {
            console.log(err);
          };
          tradeRequestToYouCount = data.length;
          req.session.tradeRequestToYouCount = data.length;
          // console.log('my books count and trade req count ', count.myBooksCount, count.yourTradeReqCount);
          // console.log('this is the trade request count to you ', tradeRequestToYouCount);

          res.render('dashboard.html', {
            user: req.session.user,
            my_books_count: count.myBooksCount,
            yourTradeReqCount: count.yourTradeReqCount,
            trade_requests_to_you_count: tradeRequestToYouCount,
            error_message: req.flash('error'),
            success_message: req.flash('success')
          });
        });
      });
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
  app.get('/books/user/:user_name/:user_id', function(req, res) {
    var user_id = req.params.user_id;
    var user_name = req.params.user_name;
    Book.find({ 'user_id': user_id }, function(err, books) {
      if (err) {
        console.log(err);
      };
      if (books.length !== 0) {
        res.render('userBooks.html', {
          user: req.session.user,
          user_name: user_name,
          myBooks: books,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      } else {
        res.render('userBooks.html', {
          user: req.session.user,
          myBooks:[],
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      }
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
  app.post('/dashboard/add/:volume_id', isLoggedIn, function(req, res) {
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
  app.post('/dashboard/remove/:volume_id', isLoggedIn, function(req, res) {
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
    Request.find({}, function(err, requests) {
      console.log(requests);
      res.render('allrequests.html', {
        user: req.session.user,
        data: requests,
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    });
  });
  app.get('/requests/new/give/for/:book_id', isLoggedIn, function(req, res) {
    var request_id = req.params.book_id;
    var promise = new Promise(function(resolve, reject) {
      Book.find({ 'user_id': req.session.user.userId }, function(err, data) {
        if (err) {
          console.log(err);
        };
        resolve(data);
      });
    });

    promise.then(function isOk(results) {
      var data = [];
      if (results.length !== 0) {
        Request.find({ 'user_id': req.session.user.userId }, function(err, requests) {
          if (err) {
            console.log(err);
          };
          var data = [];
          for (var i = 0; i < results.length; i++) {
            var s = false;
            for (var j = 0; j < requests.length; j++) {
              if (results[i]._id == requests[j].book_id_to_give) {
                console.log('book-id and book_id_to_give ', results[i]._id, requests[j].book_id_to_give);
                s = true;
                break;
              };
            };
            if (s === false) {
              console.log('data pushing ', results[i]);
              data.push(results[i]);
            };
          };
          res.render('give.html', {
            user: req.session.user,
            results: data,
            request_id: request_id,
            error_message: req.flash('error'),
            success_message: req.flash('success')
          });
        });
      } else {
        res.render('give.html', {
          user: req.session.user,
          results: data,
          request_id: request_id,
          error_message: req.flash('error'),
          success_message: req.flash('success')
        });
      };
    });
  });
  app.post('/requests/new/give/:request_id/:book_id', function(req, res) {
    var request_id = req.params.request_id;
    var book_id = req.params.book_id;

    var promise1 = new Promise(function(resolve, reject) {
      Book.findOne({ '_id': book_id }, function(err, book) {
        if (err) {
          console.log(err);
        };
        if (book.length !== 0) {
          resolve(book);
        } else {
          reject(book);
        };
      });
    });

    promise1.then(function isOk(book) {

      Request.update({ '_id': request_id }, {
        'book_id_to_give': book._id,
        'title_to_give': book.title,
        'status': 'Pending'
      },
      function(err, data) {
        if (err) {
          console.log(err);
        };
        // console.log('this is the data ', data);
        req.flash('success', book.title + ' was selected to offer for trade');
        res.redirect('/dashboard/myrequests');
      });
    }).catch(function notOk(err) {
      console.log(err);
    });
  });
  app.get('/requests/new/:request_id', isLoggedIn, function(req, res) {
    var newRequest = Request();
    var request_id = req.params.request_id;
    // console.log('request id ', request_id);
    var step1 = new Promise(function(resolve, reject) {
      Book.find({ '_id': request_id }, function(err, book) {
        if (err) {
          console.log(err);
        };
        if (book) {
          resolve(book);
        } else {
          reject(book);
        };
      });
    });

    step1.then(function isOk(data) {
      // console.log('this is the book data you want to trade ', data);
      // console.log(data[0]);
      User.findOne({ '_id': data[0].user_id }, function(err, user) {
        if (err) {
          console.log(err);
        };
        if (user) {
          var user_data = {
            name: user.name,
            location: user.city + ', ' + user.state
          };
          res.render('requestsNew.html', {
            user: req.session.user,
            trade_data: data[0],
            trade_user: user_data,
            book_id: request_id,
            error_message: req.flash('error'),
            success_message: req.flash('success')
          });
        } else {
          console.log(err);
          res.render('requestsNew.html', {
            user: req.session.user,
            trade_data: [],
            trade_user: [],
            book_id: request_id,
            error_message: req.flash('error'),
            success_message: req.flash('success')
          });
        }
      });
    }).catch(function notOk(err) {
      console.log(err);
    });
  });
  app.post('/requests/new/:book_id', isLoggedIn, function(req, res) {
    var newRequest = Request();
    var book_id = req.params.book_id;
    // console.log('book id ', book_id);
    var step1 = new Promise(function(resolve, reject) {
      Book.find({ '_id': book_id }, function(err, book) {
        if (err) {
          console.log(err);
        };
        if (book) {
          resolve(book);
        } else {
          reject(book);
        };
      });
    });

    step1.then(function isOk(data) {
      // console.log('this is the book data you want to trade ', data);
      // console.log(data[0]);
      newRequest.user_id = req.session.user.userId;
      newRequest.requestedBy = req.session.user.name;
      newRequest.title = data[0].title;
      newRequest.ownerId = data[0].user_id;
      newRequest.book_id = data[0]._id;
      newRequest.status = 'In progress';
      User.findOne({ '_id': data[0].user_id }, function(err, user) {
        if (err) {
          console.log(err);
        };
        if (user) {
          newRequest.owner = user.name;
          // console.log(newRequest);
          newRequest.save(function(err) {
            if (err) {
              console.log(err);
            };
            console.log("This is the new request ", newRequest._id);
            req.flash('success','Select a book to trade for ' + data[0].title);
            res.redirect('/requests/new/give/for/' + newRequest._id);
          });
        } else {
          console.log(err);
          res.redirect('/books');
        };
      });
    }).catch(function notOk(err) {
      console.log(err);
    });
  });
  app.get('/dashboard/myrequests', isLoggedIn, function(req, res) {
    Request.find({ 'user_id': req.session.user.userId }, function(err, requests) {
      // console.log(requests);
      res.render('myrequests.html', {
        user: req.session.user,
        request_data: requests,
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    });
  });
  app.get('/dashboard/myrequests/:request_id', isLoggedIn, function(req, res) {
    var request_id = req.params.request_id;
    Request.find({ '_id': request_id }, function(err, request) {
      if (err) {
        console.log(err);
      }
      res.render('singlerequest.html', {
        user: req.session.user,
        request_data: request,
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    });
  });
  app.post('/dashboard/myrequests/delete/:request_id', isLoggedIn, function(req, res) {
    Request.findOneAndRemove({ '_id': req.params.request_id }, function(err, results) {
      if (err) {
        console.log(err);
      };
      req.flash('success', results.title + ' was removed from your request list');
      res.redirect('/dashboard/myrequests');
    });
  });
  app.get('/dashboard/traderequeststoyou', isLoggedIn, function(req, res) {
    Request.find({ 'ownerId': req.session.user.userId }, function(err, requests) {
      var data = [];
      // console.log(requests);
      for (var i = 0; i < requests.length; i++) {
        // console.log(requests[i].title);
        // console.log(data.indexOf(requests[i].title));
        var rswitch = false;
        for (var j = 0; j < data.length; j++) {
          data[j].map(function(e) {
            if (e.title === requests[i].title) {
              rswitch = true;
              data[j].push(requests[i]);
            };
          });
        };
        if (rswitch === false) {
          data.push([requests[i]]);
        };
      };
      console.log(data);
      res.render('requests.html', {
        user: req.session.user,
        data: data,
        error_message: req.flash('error'),
        success_message: req.flash('success')
      });
    });
  });
  app.get('/users', function(req, res) {

    var promise0 = new Promise(function(resolve, reject) {
      if (req.session.user) {
        User.find({ '_id': { $ne: req.session.user.userId }}, function(err, users) {
          if (err) {
            console.log(err);
          };
          if (users.length === 0) {
            reject(users);
          } else {
            resolve(users)
          };
        });
      } else {
        User.find({}, function(err, users) {
          if (err) {
            console.log(err);
          };
          if (users.length === 0) {
            reject(users);
          } else {
            resolve(users)
          };
        });
      }
    });

    promise0.then(function isOk(users) {
      // console.log(users);
      var bookLength = [];
      var count = 0;
      for (var i = 0; i < users.length; i++) {
        Book.find({ 'user_id': users[i]._id }, function(err, book) {
          bookLength.push({
            user: book[0].user_id,
            length: book.length
          });
          count++;
          if (count === users.length) {
            // console.log(bookLength);
            for (var j = 0; j < users.length; j++) {
              // console.log(users[j]._id);
              bookLength.map(function(e) {
                if (e.user == users[j]._id) {
                  users[j].bookLength = e.length;
                };
              });
            };
            res.render('users.html', {
              user: req.session.user,
              data: users,
              error_message: req.flash('error'),
              success_message: req.flash('success')
            });
          };
        });
      };
    }).catch(function notOk(err) {
      console.log(err);
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
