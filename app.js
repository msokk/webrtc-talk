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

  // Notify everybody of the new client
  io.sockets.clients().forEach(function(s) {
    s.get('coordinates', function(err, coords) {
      if(coords != null) {
        socket.emit('new client', s.id, coords);
      }
    });
  });

  // Notify everybody of the new client
  socket.on('new client', function(coords) {
    socket.set('coordinates', coords, function() {
      socket.broadcast.emit('new client', socket.id, coords);
    });
  });

  //Notify everybody of disconnection
  socket.on('disconnect', function() {
    io.sockets.emit('client disconnected', socket.id);
  });

  //Exchange signals
  socket.on('signal', function(id, message) {
    io.sockets.socket(id).emit('signal', socket.id, message);
  });
});

console.log('CallMap running at port 4000');
