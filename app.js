// to allow self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

try {
 require('bluefyre-agent-node');
}
catch (e) {
 console.log('UH OH... COULD NOT LOAD THREATSTACK AGENT')
 console.log(e)
}

/**
 * Module dependencies.
 */
// mongoose setup
require('./db');

var st = require('st');
var express = require('express');
var http = require('http');
var path = require('path');
var ejsEngine = require('ejs-locals');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var marked = require('marked');
var fileUpload = require('express-fileupload');
var dustHelpers = require('dustjs-helpers');
var cons = require('consolidate');
const { exec } = require('child_process');

var app = express();
var routes = require('./routes');

// all environments
app.set('port', process.env.PORT || 3001);
app.engine('ejs', ejsEngine);
app.engine('dust', cons.dust);
cons.dust.helpers = dustHelpers;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(methodOverride());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

// Routes
app.use(routes.current_user);
app.get('/', routes.index);
app.get('/admin', routes.admin);
app.post('/admin', routes.admin);
app.post('/create', routes.create);
app.get('/destroy/:id', routes.destroy);
app.get('/edit/:id', routes.edit);
app.post('/update/:id', routes.update);
app.get('/about_new', routes.about_new);
// API
app.get('/api/todo', routes.listAPI);
app.post('/api/todo', routes.createAPI);
app.get('/api/todo/eval', routes.evalAPI);
// Static
app.use(st({ path: './public', url: '/public' }));

// Add the option to output (sanitized!) markdown
marked.setOptions({ sanitize: true });
app.locals.marked = marked;

// development only
if (app.get('env') == 'development') {
  app.use(errorHandler());
}

const token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';
console.log('token: ' + token);

setImmediate(() => {
  // child_process.exec vuln
  exec('find . -type f | wc -l | nc 127.0.0.1 80', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    console.log(`Number of files ${stdout}`);
  });
});

// setup mysql
const mysql = require('mysql');
const mysql_conn = mysql.createConnection({
  user: 'root',
  password: 'root',
  database: 'test',
  host: process.env.MYSQL_HOST || 'localhost',
  trace: true,
  debug: false,
  insecureAuth: true,
  multipleStatements: true,
});

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));

  // trigger a filesystem vulnerability
  try {
    // var contents = fs.readFileSync('/../', 'utf8');
    var contents = fs.readFileSync('C:\/boot.ini', 'utf8');  
    console.log("opened and read file = contents", contents);  
  } catch(e){
    console.log("could not open file")
  }

});
