var adminConfig = require('../config/adminconfig.js');

module.exports = function(app, connection) {

app.all('*', function(req, res, next) {
  if(req.secure || !adminConfig.https_redirect){
    return next();
  };
  res.redirect('https://' + req.host + req.url);
});

// Handle / root route.
app.get('/', function(req, res) {
	res.sendfile('./public/views/index.html');
});

}
