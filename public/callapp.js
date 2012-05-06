var CallMap = function() {
  var that = this;
  this.markers = {};
  this.peers = {};
  this.initMap();

  var socket = this.socket = io.connect(':4000');

  socket.on('new client', function(id, coords) {
    that.addMarker(id, coords);
  });

  socket.on('client disconnected', function(id) {
    that.markers[id].setMap(null);
    delete that.markers[id];
  });

  this.setStatus('Waiting location...');
  this.getLocation(function(err, coords) {
    if(err) {
      that.setStatus('Could not get position!', true);
      return;
    }
    //TODO: handle errors
    socket.emit('new client', coords);
    that.addMarker(socket.socket.sessionid, coords, true);
    that.setStatus('Connected!');

    that.initLocalVideo();
  });

  socket.on('signal', function(id, message) {
    that.call(id);
    that.peers[id].processSignalingMessage(message);
  });

  var count = document.querySelector('#user_count');
  socket.on('total', function(total) {
    if(total < 2) {
      count.innerHTML = '1 user';
    } else {
      count.innerHTML = total + ' users';
    }

  });

  $('.camera').click(function() {
    $(this).toggleClass('big');
  })
};
io.util.mixin(CallMap, io.EventEmitter);


CallMap.prototype.initMap = function() {
  this.map = new google.maps.Map(document.getElementById("map_canvas"), {
    center: new google.maps.LatLng(59.434754,24.758284),
    zoom: 13,
    streetViewControl: false,
    panControl: false,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{
      stylers: [
        { gamma: 0.5 },
        { lightness: 15 },
        { hue: "#00b2ff" },
        { visibility: "on" }
      ]
    }]
  });
};


CallMap.prototype.addMarker = function(id, coords, you) {
  var that = this;

  var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);

  this.markers[id] = new google.maps.Marker({
    position: latlng,
    animation: google.maps.Animation.DROP,
    map: this.map,
    icon: (you)? "/img/your_marker.png": "/img/marker.png",
    shadow: new google.maps.MarkerImage(
      '/img/shadow.png',
      new google.maps.Size(42,26),
      new google.maps.Point(0,0),
      new google.maps.Point(13,26)
    )
  });
  if(you) {
    this.you = this.markers[id];
    this.map.setCenter(this.you.position);
  }
  this.markers[id].id = id;

  var infobox = new InfoBox({
    content: '<div class="info">' + ((you)? 'This is you': 'Click to call') + '</div>',
    closeBoxURL: '',
    pixelOffset: new google.maps.Size(-33, -50)
  });

  if(!you) {
    google.maps.event.addListener(this.markers[id], 'click', function() {
      that.call(id);
      infobox.close(that.map, this);
    });
  }
  google.maps.event.addListener(this.markers[id], 'mouseover', function() {
    infobox.open(that.map, this);
  });

  google.maps.event.addListener(this.markers[id], 'mouseout', function() {
    infobox.close(that.map, this);
  });
};

CallMap.prototype.getLocation = function(cb) {
  if(!navigator.geolocation) {
    cb && cb('Geolocation is not supported', null);
    return;
  }

  navigator.geolocation.getCurrentPosition(function(position) {
    coords = position.coords;
    cb && cb(null, {
      latitude: coords.latitude + Math.random() / 500, //Bit jitter for demo
      longitude: coords.longitude + Math.random() / 500
    });
  }, function(err) {
    cb && cb(err, null);
  });
};

CallMap.prototype.setStatus = function(msg, error) {
  if(error) {
    document.getElementById('status').innerHTML = '<span style="color: #f90">' + msg + '</span>';
  } else {
    document.getElementById('status').innerHTML = msg;
  }
};

CallMap.prototype.initLocalVideo = function() {
  var that = this;
  //TODO: handle errors
  navigator.getUserMedia = navigator.getUserMedia
                        || navigator.webkitGetUserMedia
                        || navigator.mozGetUserMedia
                        || navigator.msGetUserMedia;

  if(!navigator.getUserMedia) {
    console.log('There is no mediastream API support here!');
  } else {
    navigator.getUserMedia('video', function(stream) {
      var video = document.getElementById('local');
      var domURL = window.URL || window.webkitURL;
      that.localStream = stream;
      video.src  = domURL.createObjectURL(stream);
    }, function(error) {
      console.log("Failed to get a stream due to", error);
    });
  }
};

CallMap.prototype.call = function(target) {
  var that = this;
  window.webkitPeerConnection = window.webkitPeerConnection || window.webkitDeprecatedPeerConnection;

  var pc = this.peers[target] = new webkitPeerConnection(
    "STUN stun.l.google.com:19302", function(message) {
    that.socket.emit('signal', target, message);
  });

  if(this.localStream) {
    pc.addStream(this.localStream);
  }

  pc.onaddstream = function(event) {
    var url = webkitURL.createObjectURL(event.stream);
    var video = document.createElement('video');
    video.autoplay = true;
    video.src = url;
    $('#cameras').append(video);
  }
};

CallMap.prototype.hangup = function(target) {

};


window.cm = new CallMap();
