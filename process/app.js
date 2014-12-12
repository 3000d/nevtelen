/*
 * Convert jpg to svg to gcode.
 *
 * d3000 - hello@3000d.be
 */

var path = require('path'),
  fs = require('fs'),
  root = require('../root'),
  util = require('util'),

  Communication = require(root.communication + '/communication'),
  WebServer = require(root.web + '/web');

var drawbot = new Communication();
var webServer = new WebServer(drawbot);
webServer.startServer();

var gcodeFiles = fs.readdirSync(root.data_gcode);
var gcodeIterator = 0;
var currentGcodeFile;



drawbot.getSerialPortList(function(ports) {
  try {
    drawbot.Log.debug("drawbot - serial port list");
    drawbot.connect(process.argv[2] || ports[0].comName);
    processGcodeFile();
  } catch(e) {
    drawbot.Log.debug("drawbot - no serial port");

    // start debug code
    //processGcodeFile();
    // end debug code
  }

  drawbot.on('connected', function() {
    drawbot.Log.debug("drawbot - connected");
  });



  drawbot.on('drawStarted', function() {
    drawbot.log('-- DRAW STARTED');
  });

  drawbot.on('drawFinished', function() {
    drawbot.log('-- DRAW FINISHED');
    processGcodeFile();
  });
});

var processGcodeFile = function() {
  var gcode, gcodeFile;
  if(gcodeFiles.length) {
    gcodeFile = gcodeFiles[gcodeIterator];
    currentGcodeFile = gcodeFile;

    gcode = fs.readFileSync(root.data_gcode + '/' + gcodeFile, 'utf8');
    if(gcode) {
      drawbot.Log.debug('[PROCESS] DRAW NEW : ' + gcodeFile);

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

    gcodeIterator++;
    if(gcodeIterator === gcodeFiles.length) {
      gcodeIterator = 0;
    }
  }
};