var routes = function(app) {
  app.get('/', function(req, res) {
    res.render('index.html');
  });
};
module.exports = routes;
