/*
 * Convert jpg to svg to gcode.
 *
 * d3000 - hello@3000d.be
 */

var path = require('path'),
  fs = require('fs'),
  root = require('../root'),
  exec = require('child_process').exec,
  util = require('util'),

  Communication = require(root.communication + '/communication'),
  GcodeConverter = require(root.process + '/GcodeConverter'),
  Watcher = require(root.common + '/Watcher');

var drawbot = new Communication();
var gcodeConverter = new GcodeConverter({});

var gcodeFiles = [];

var bmpWatcher = new Watcher({
  folder: path.resolve(root.data_bmp),
  extensions: ['bmp']
});

var jsonWatcher = new Watcher({
  folder: path.resolve(root.data_json),
  extensions: ['json']
});



drawbot.getSerialPortList(function(ports) {
  drawbot.connect(process.argv[2] || ports[0]);

  drawbot.on('connected', function() {
  });

  processGcodeFile();

  bmpWatcher.on('fileAdded', function(evt) {
    var jsonFileName = 'face_' + Math.round(new Date().getTime() / 1000) + '.json';

    // potrace -i -b geojson -k 0.4 -t 60 -o outputXXX.json bitmapXXX.BMP
    var cmd = 'potrace -i -b geojson -k 0.4 -t 60 -o ' + (root.data_json + '/' + jsonFileName) + ' ' + evt.path;

    exec(cmd, function(error, stdout, stderr) {
      if(error && error !== 'null') {
        drawbot.Log.error(error);
        return;
      }
      if(stderr) {
        drawbot.Log.error(error);
        return;
      }
      drawbot.log('-- Json file created: ' + jsonFileName);
    });
  });

  jsonWatcher.on('fileAdded', function(evt) {
    var json = require(evt.path);
    var gcode = gcodeConverter.convert(json);
    var gcodeFileName = 'face_' + Math.round(new Date().getTime() / 1000) + '.gcode';

    fs.writeFile(root.data_gcode + '/' + gcodeFileName, gcode, function(err) {
      if(err) {
        drawbot.Log.error('Could not save to gcode');
      } else {
        drawbot.log('-- GCode created: ' + gcodeFileName);
        gcodeFiles.push(gcodeFileName);

        if(!drawbot.isDrawing) {
          processGcodeFile();
        }
      }
    });
  });

  drawbot.on('drawFinished', function() {
    processGcodeFile(true);
  });
});

var processGcodeFile = function(removeLast) {
  if(removeLast) {
    var gcodeFileToRemove = gcodeFiles.pop();
    moveGcodeFile(gcodeFileToRemove);
  }
  var gcodeFile = getGcodeFile();
  if(gcodeFile) {
    var gcode = fs.readFileSync(root.data_gcode + '/' + gcodeFile, 'utf8');
    drawbot.batch(gcode);
  }
};

var getGcodeFile = function() {
  if(!gcodeFiles.length) {
    var gcodesInFolder = fs.readdirSync(root.data_gcode);
    for(var i = 0; i < gcodesInFolder.length; i++) {
      var fileName = gcodesInFolder[i].split('.');

      if(fileName[fileName.length-1] === 'gcode') {
        gcodeFiles.push(gcodesInFolder[i]);
      }
    }
  }

  if(gcodeFiles.length) {
    return gcodeFiles[gcodeFiles.length - 1];
  } else {
    return null;
  }
};

var moveGcodeFile = function(gcodeFileName) {
  fs.rename(root.data_gcode + '/' + gcodeFileName, root.data_gcode_processed + '/' + gcodeFileName);
};