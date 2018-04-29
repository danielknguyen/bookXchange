// load dependencies
var express = require('express'),
    dotenv = require('dotenv').config(),
    bodyParser = require('body-parser'),
    engines = require('consolidate'),
    morgan = require('morgan'),
    socket = require('socket.io'),
    app = express();
// app configuration
var appConfig = function() {
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname + '/views');
  app.engine('html', engines.nunjucks);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('dev'));
}();
// create port for server to listen on
var port = process.env.PORT || 27017;
var server = app.listen(port, function() {
  console.log('Express server is listening on port %s.', port);
});
// create web socket instance
var io = socket(server);
// load routes module
var routes = require('./routes/routes.js')(app);
