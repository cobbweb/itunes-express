
/**
 * Module dependencies.
 */

var express     = require('express')
var http        = require('http')
var applescript = require('applescript')
var sio         = require('socket.io')
var fs          = require('fs')
var _           = require('underscore')
var app         = express()

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

app.configure(function() {
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.errorHandler())
})

app.get('*', function(req, res) {
  getNowPlaying(function(np) {
    fs.readFile('./index.html', 'utf-8', function(err, template) {
      var _template = _.template(template)
      var html = _template({ track: np, host: req.headers.host })
      res.send(html)
    })
  })
})

var server = http.createServer(app).listen(3000)
console.log("Express server listening on port 3000")

io = sio.listen(server)

io.on('connection', function(socket) {
  var lastNowPlaying
  getNowPlaying(function(np) {
    lastNowPlaying = np
    io.sockets.emit('now playing', { track: np })
  })

  setInterval(function() {
    getNowPlaying(function(np) {
      if (np !== lastNowPlaying) {
        lastNowPlaying = np
        io.sockets.emit('now playing', { track: np })
      }
    })
  }, 500)
})