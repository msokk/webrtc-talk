var express = require('express')
  , io = require('socket.io');

var app = express();

app.configure(function() {
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
});

var server = app.listen('4000')
  , io = io.listen(server);


io.sockets.on('connection', function(socket) {
  console.log(socket);
});

console.log('Callapp running at port 4000');
