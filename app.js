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

  io.sockets.clients().forEach(function(s) {
    s.get('coordinates', function(err, coords) {
      if(coords != null) {
        console.log('client connected, sending list');
        socket.emit('coordinates', s.id, coords);
      }
    });
  });



  socket.on('coordinates', function(coords) {
    socket.set('coordinates', coords, function() {
      socket.broadcast.emit('coordinates', socket.id, coords);
    });

  });


  socket.on('disconnect', function () {
    io.sockets.emit('user disconnected', socket.id);
  });
});

console.log('Callapp running at port 4000');
