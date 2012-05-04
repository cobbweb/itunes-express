
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    applescript = require('applescript'),
    sio = require('socket.io');

var app = express();

var getNowPlaying = function(cb) {
    var script = [
      'tell application "iTunes"',
      '\t(artist of current track) & " - " & (name of current track)',
      'end tell'
    ].join("\n");

    applescript.execString(script, function(err, result) {
      cb(result);
    });
};

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  getNowPlaying(function(np) {
    res.render('index', { track: np });
  });
});

var server = http.createServer(app).listen(3000);
console.log("Express server listening on port 3000");

io = sio.listen(server);

io.sockets.on('connection', function(socket) {
  var lastNowPlaying;
  getNowPlaying(function(np) {
    lastNowPlaying = np;
    socket.emit('now playing', { track: np });
  });

  setInterval(function() {
    getNowPlaying(function(np) {
      if (np !== lastNowPlaying) {
        lastNowPlaying = np;
        socket.emit('now playing', { track: np });
      }
    });
  }, 500);
});
