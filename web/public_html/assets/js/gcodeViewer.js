var GcodeViewer = function(canvas) {
  var _stage,
    _txtLayer,
    _layer;

  var init = function() {
    _stage = new Kinetic.Stage({
      container: 'gcode-viewer',
      width: 640,
      height: 480
    });

    _layer = new Kinetic.Layer();
    _txtLayer = new Kinetic.Layer();
    _stage.add(_layer);
    //_stage.add(_txtLayer);

    /**
     * Ugly debug code
     */
    var bk = new Kinetic.Rect({
      x:0,
      y:0,
      width: _stage.getWidth(),
      height: _stage.getHeight(),
      fill:"white",opacity:0.01
    });

    //_txtLayer.add(bk);
    //var mouseText = new Kinetic.Text({
    //  fill: 'black',
    //  text: ''
    //});
    //
    //_txtLayer.add(mouseText);
    //
    //bk.on('mousemove', function() {
    //  var pos = _stage.getPointerPosition();
    //  mouseText.text('x ' + pos.x + ' / y ' + pos.y);
    //  mouseText.x(pos.x);
    //  mouseText.y(pos.y - 15);
    //  _txtLayer.draw();
    //});
    //
    //bk.on('click', function() {
    //  var pos = _stage.getPointerPosition();
    //  var point = new Kinetic.Ellipse({
    //    radius: {
    //      x: 2,
    //      y: 2
    //    },
    //    x: pos.x,
    //    y: pos.y,
    //    fill: 'red'
    //  });
    //  _txtLayer.add(point);
    //  _txtLayer.draw();
    //});

    _txtLayer.draw();
  };



  this.draw = function(data) {
    var parsedData;
    try {
      parsedData = jQuery.parseJSON(data);
    } catch(e) {}

    // is it json or gcode ? Yo ?
    if(parsedData) {
      drawGeoJson(parsedData);
    } else {
      drawGcode(data);
    }

    _layer.draw();
  };

  var drawGeoJson = function(data) {
    for(var i = 0; i < data.features.length; i++) {
      var feature = data.features[i];

      for(var j = 0; j < feature.geometry.coordinates.length; j++) {
        var coordinate = feature.geometry.coordinates[j];

        for(var k = 0; k < coordinate.length; k++) {

          var line = new Kinetic.Line({
            points: [
              coordinate[k-1 >= 0 ? k-1 : k][0],
              _stage.getHeight() - coordinate[k-1 >= 0 ? k-1 : k][1],
              coordinate[k][0],
              _stage.getHeight() - coordinate[k][1]],
            stroke: k % 2 ? 'black' : 'red',
            tension: 1
          });
          _layer.add(line);
        }
      }
    }
  };

  var drawGcode = function(data) {
    data = data.split('\n');

    var coords = [];

    var isSilent = false; // test Z in gcode to know if we trace or not
    var noPrevious = false;

    for(var i = 0; i < data.length; i++) {
      var command = data[i].split(' ');

      if(command[2] && command[2][0] === 'Z') {
        var zValue = command[2].substr(1);

        // if we just got out of a Z0 command (light just went on)
        noPrevious = zValue <= 0;

        zValue > 0 ? isSilent = false : isSilent = true;
      }

      if(command[2]&& command[2][0] === 'X') {
        //if(!isSilent) {
        var x = command[2].substr(1);
        var y = _stage.getHeight() - command[3].substr(1);
        var prevCoord;

        if(!noPrevious) {
          var line = new Kinetic.Line({
            points: [
              coords.length-1 >= 0 ? coords[coords.length-1].x : 0,
              coords.length-1 >= 0 ? coords[coords.length-1].y : 0,
              x,
              y
            ],
            stroke: i % 2 ? 'black' : 'red',
            tension: 1
          });

          _layer.add(line);
        }

        //}
        coords.push({x: x, y: y});
      }
    }
  };

  this.clear = function() {
    _layer.removeChildren();
    //context.clearRect(0, 0, canvas.width, canvas.height);
  };


  init();
};