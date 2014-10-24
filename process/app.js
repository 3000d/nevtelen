/*
 * Convert jpg to svg to gcode.
 *
 * d3000 - hello@3000d.be
 */

var path = require('path'),
  fs = require('fs'),
  root = require('../root'),
  exec = require('child_process').exec,
  osc = new (require(root.communication + '/osc')),
  util = require('util'),

  Communication = require(root.communication + '/communication'),
  GcodeConverter = require(root.process + '/GcodeConverter'),
  Watcher = require(root.common + '/Watcher');
  WebServer = require(root.web + '/web');

var drawbot = new Communication();
var gcodeConverter = new GcodeConverter({feedrate: 2});
var webServer = new WebServer(drawbot);
webServer.startServer();

var gcodeFiles = [];
var processedGcodeFiles = [];
var currentGcodeFile;

var isProcessStarted = false;

var bmpWatcher = new Watcher({
  folder: path.resolve(root.data_bmp),
  extensions: ['bmp', 'BMP']
});

var jsonWatcher = new Watcher({
  folder: path.resolve(root.data_json),
  extensions: ['json']
});



drawbot.getSerialPortList(function(ports) {
  try {
    drawbot.connect(process.argv[2] || ports[0].comName);
  } catch(e) {}

  drawbot.on('connected', function() {
  });

  //processGcodeFile();

  bmpWatcher.on('fileAdded', function(evt) {
    var fileName = evt.path.split('/');
    fileName = fileName[fileName.length-1].split('.');
    fileName = fileName[fileName.length-2];
    var jsonFileName = fileName + '.json';

    // potrace -i -b geojson -k 0.4 -t 60 -o outputXXX.json bitmapXXX.BMP

    var potrace = 'potrace -i -b geojson -k 0.4 -t 60 -o ' + (root.data_json + '/' + jsonFileName) + ' ' + evt.path;
    var compare = 'compare -metric mae ' + root.process + '/background.bmp ' + evt.path + ' ' + root.data_temp + '/diff.bmp';

    exec(compare, function(error, stdout, strerr){
      if((error && error !== 'null'))
      {
        drawbot.Log.error('compare : error : ' + error);
        return;
      }else
      {
        drawbot.Log.debug('compare says: ' + stdout.split(' ')[0]);
        if(stdout.split(' ')[0] > 1250)
        {
          drawbot.Log.debug('gotit');
          exec(potrace, function(error, stdout, stderr) {
            if((error && error !== 'null') || stderr) {
              drawbot.Log.error('potrace ' + error);
              return;
            }
            //drawbot.log('-- Json file created: ' + jsonFileName);
          });
        }else
        {
          //fs.unlinkSync(evt.path);
          drawbot.Log.debug('compare : discard');
        }
      }
    });
  });

  jsonWatcher.on('fileAdded', function(evt) {
    try {
      var json = require(evt.path);
      var gcode = gcodeConverter.convert(json);

      var fileName = evt.path.split('/');
      fileName = fileName[fileName.length-1].split('.');
      fileName = fileName[fileName.length-2];
      var gcodeFileName = fileName + '.gcode';

      fs.writeFile(root.data_gcode + '/' + gcodeFileName, gcode, function(err) {
        if(err) {
          drawbot.Log.error('Could not save to gcode');
        } else {
          drawbot.Log.error('-- GCode: ' + gcodeFileName);
          gcodeFiles.push(gcodeFileName);

          if(!isProcessStarted) {
            processGcodeFile();
            isProcessStarted = true;
          }
        }
      });
    } catch(e) {
      drawbot.Log.error('could not convert json to gcode');
    }
  });

  drawbot.on('drawStarted', function() {
    drawbot.log('-- DRAW STARTED');
    osc.sendSOD();
  });

  drawbot.on('drawFinished', function() {
    drawbot.log('-- DRAW FINISHED');
    osc.sendEOD();
    processGcodeFile(true);
  });
});

var processGcodeFile = function(removeLast) {
  if(removeLast && currentGcodeFile) {
    for(var i = 0; i < gcodeFiles.length; i++) {
      if(gcodeFiles[i] === currentGcodeFile) {
        gcodeFiles.splice(i, 1);
      }
    }
    moveGcodeFile(currentGcodeFile);
  }
  var gcode, gcodeFile;
  if(gcodeFiles.length) {
    gcodeFile = gcodeFiles[gcodeFiles.length - 1];
    currentGcodeFile = gcodeFile;

    gcode = fs.readFileSync(root.data_gcode + '/' + gcodeFile, 'utf8');
    if(gcode) drawbot.Log.debug('[PROCESS] DRAW NEW : ' + gcodeFile);
  } else {
    var randIndex = Math.floor(Math.random() * processedGcodeFiles.length);
    gcodeFile = processedGcodeFiles[randIndex];
    gcode = fs.readFileSync(root.data_gcode_processed + '/' + processedGcodeFiles[randIndex]);
    currentGcodeFile = null;
    if(gcode) drawbot.Log.debug('[PROCESS] DRAW OLD : ' + gcodeFile);
  }

  if(gcode) {
    // start debug code
    //drawbot.isDrawing = true;
    //drawbot.emit('drawStarted');
    //setTimeout(function() {
    //  drawbot.isDrawing = false;
    //  drawbot.emit('drawFinished');
    //}, 5000);
    // end debug code

    drawbot.batch(gcode);
  }
};

//var getGcodeFile = function() {
//  if(!gcodeFiles.length) {
//    var gcodesInFolder = fs.readdirSync(root.data_gcode);
//    for(var i = 0; i < gcodesInFolder.length; i++) {
//      var fileName = gcodesInFolder[i].split('.');
//
//      if(fileName[fileName.length-1] === 'gcode') {
//        gcodeFiles.push(gcodesInFolder[i]);
//      }
//    }
//  }
//
//  if(gcodeFiles.length) {
//    return gcodeFiles[gcodeFiles.length - 1];
//  } else {
//    return null;
//  }
//};

var moveGcodeFile = function(gcodeFileName) {
  fs.renameSync(root.data_gcode + '/' + gcodeFileName, root.data_gcode_processed + '/' + gcodeFileName);
  processedGcodeFiles.push(gcodeFileName);
};
