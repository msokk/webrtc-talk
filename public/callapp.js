var CallMap = function() {
  var that = this;
  this.markers = {};

  var socket = window.socket = io.connect();


  var map = new google.maps.Map(document.getElementById("map_canvas"), {
    center: new google.maps.LatLng(59.434754,24.758284),
    zoom: 12,
    streetViewControl: false,
    panControl: false,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [
      {
        stylers: [
          { gamma: 0.5 },
          { lightness: 15 },
          { hue: "#00b2ff" },
          { visibility: "on" }
        ]
      }
    ]
  });

  socket.on('coordinates', function(id, coords) {
    console.log(arguments);
    var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);

    that.markers[id] = new google.maps.Marker({
      position: latlng,
      animation: google.maps.Animation.DROP,
      map: map,
      icon: "/img/marker.png",
      shadow: new google.maps.MarkerImage(
        '/img/shadow.png',
        new google.maps.Size(42,26),
        new google.maps.Point(0,0),
        new google.maps.Point(13,26)
      ),
      title: id
    });
  });

  socket.on('user disconnected', function(id) {
    that.markers[id].setMap(null);
    delete that.markers[id];
  });


  this.on('position', function(pos) {
    var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    map.setCenter(latlng);
    socket.emit('coordinates', pos.coords);

    that.markers[socket.socket.sessionid] = new google.maps.Marker({
        position: latlng,
        animation: google.maps.Animation.DROP,
        map: map,
        icon: "/img/marker.png",
        shadow: new google.maps.MarkerImage(
          '/img/shadow.png',
          new google.maps.Size(42,26),
          new google.maps.Point(0,0),
          new google.maps.Point(13,26)
        ),
        title: socket.socket.sessionid

    });


  });

  this.getLocation();
  navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  navigator.getUserMedia_('video', function(stream){
    var video = document.getElementById("camera");
    var domURL = window.URL || window.webkitURL;
    video.src  = domURL.createObjectURL(stream);
  }, function(error){
      console.log("Failed to get a stream due to", error);
  });

};
io.util.mixin(CallMap, io.EventEmitter);

CallMap.prototype.getLocation = function() {
  var that = this;
  navigator.geolocation.getCurrentPosition(function(position) {
    that.emit('position', position);
  }, function(error) {

  });
};



window.cm = new CallMap();
