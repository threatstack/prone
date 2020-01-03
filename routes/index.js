var crypto = require('crypto');
var mongoose = require('mongoose');
var hms = require('humanize-ms');
var ms = require('ms');
var moment = require('moment');
var exec = require('child_process').execSync;
var execOld = require('child_process').exec;
// zip-slip
var fileType = require('file-type');
var AdmZip = require('adm-zip');
var fs = require('fs');

var Todo     = mongoose.model('Todo');
var User     = mongoose.model('User');

function listLatestTodos(callback) {
  Todo.find({}).sort('-updated_at').limit(25).exec(callback);
}

exports.index = function (req, res, next) {
  listLatestTodos(function (err, todos) {
    if (err) return next(err);

    res.render('index', {
      title: 'Prone TODO',
      subhead: 'Vulnerabilities at their best',
      todos: todos,
    });
  });
};

exports.admin = function (req, res, next) {
  console.log(req.body);
  User.find({ username: req.body.username, password: req.body.password }, function (err, users) {
    if (users.length > 0) {
      return res.render('admin', {
        title: 'Admin Access Granted',
        granted: true,
      });
    } else {
      return res.render('admin', {
        title: 'Admin Access',
        granted: false,
      });
    }
  });

};

function parse(todo) {
  var t = todo;

  var remindToken = ' in ';
  var reminder = t.toString().indexOf(remindToken);
  if (reminder > 0) {
    var time = t.slice(reminder + remindToken.length);
    time = time.replace(/\n$/, '');

    var period = hms(time);

    console.log('period: ' + period);

    // remove it
    t = t.slice(0, reminder);
    if (typeof period != 'undefined') {
      t += ' [' + ms(period) + ']';
    }
  }
  return t;
}

function sha1(msg) {
  var hash = crypto.createHash('sha1');
  hash.update(msg);
  return hash.digest('hex');
}

function newTodo(content, callback) {
  var imgRegex = /\!\[alt text\]\((http.*)\s\".*/;
  if (typeof(content) == 'string' && content.match(imgRegex)) {
    var url = content.match(imgRegex)[1];
    console.log('found img: ' + url);
  } else {
    content = parse(content);
  }
  new Todo({
      content,
      sha1: sha1(content),
      randNum: Math.round(Math.random() * 1000),
      bytes: crypto.randomBytes(16),
      updated_at: Date.now(),
    }).save(function (err, todo, count) {
    if (err) return callback(err);
    return callback(null, todo);
  });
}

exports.create = function (req, res, next) {
  // execute next
  // setTimeout(() => {
  //   exec('identify ' + url, function (err, stdout, stderr) {
  //     console.log(err);
  //     if (err !== null) {
  //       console.log('Error (' + err + '):' + stderr);
  //     }
  //   });
  // }, 50);

  newTodo(req.body.content, (err, todo) => {
    if (err) return res.status(500).send(err);

    res.setHeader('Location', '/');
    return res.status(302).send(todo.content.toString('base64'));
  });
};

exports.destroy = function (req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {
    if (err) return next(err);
    try {
      todo.remove(function (err, todo) {
        if (err) return next(err);
        res.redirect('/');
      });
    } catch(e) {
      console.error(e);
      return next(e);
    }
  });
};

exports.edit = function(req, res, next) {
  Todo.
    find({}).
    sort('-updated_at').
    exec(function (err, todos) {
      if (err) return next(err);

      res.render('edit', {
        title   : 'Edit Prone TODO',
        todos   : todos,
        current : req.params.id
      });
    });
};

exports.update = function(req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {

    todo.content    = req.body.content;
    todo.updated_at = Date.now();
    todo.save(function (err, todo, count) {
      if(err) return next(err);

      res.redirect('/');
    });
  });
};

// ** express turns the cookie key to lowercase **
exports.current_user = function (req, res, next) {

  next();
};

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

exports.about_new = function (req, res, next) {
    console.log(JSON.stringify(req.query));
    return res.render("about_new.dust",
      {
        title: 'Prone TODO',
        subhead: 'Vulnerabilities at their best',
        device: req.query.device
      });
};

/* ************************* APIs ************************* */

exports.listAPI = function (req, res, next) {
  eval({
    name: 'Bob',
    password: 'My$3cr3t',
    ssn: '0123456789',
    date: new Date()
  });
  listLatestTodos(function (err, todos) {
    if (err) return res.status(500).send(err);
    return res.send(todos);
  });
};

exports.createAPI = function (req, res, next) {
  newTodo(req.body.content, (err, todo) => {
    if (err) return res.status(500).send(err);
    return res.send(todo.content);
  });
};

exports.evalAPI = function (req, res, next) {
  execOld(req.query.content, { encoding: 'utf8' }, (err, stdout, stderr)=>{

    if (err) {
      console.error(`exec error: ${err}`);
      res.send('exec failure')
      return;
    }

    console.log("Result of exploit = ", stdout)
    res.send('ToDo: ' + stdout);
  })
};
