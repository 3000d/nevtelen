/*
 * Talks to a drawbot through serial port
 *
 * d3000 - hello@3000d.be
 */

var util = require('util'),
  root = require('../root'),
  path = require('path'),
  communication = new (require('./communication'))(),
  osc = new (require('./osc'))(),
  Web = require(root.web + '/web');


/**
 * Starting the web server
 * We give the server a Communication instance
 * so that it can interact with the API.
 */
var web = new Web(communication);
web.startServer();

communication.on('drawFinished', function() {
  console.log('-- YO -- draw finished');
  osc.sendEOD();
});

/**
 * Watch gcode folder to send to drawbot
 */
var Watcher = require(root.common + '/Watcher');
gcodeWatcher = new Watcher({
  folder: path.resolve(root.data_gcode),
  extensions: ['gcode']
});

gcodeWatcher.on('fileAdded', function(evt) {
  util.log('[new GCODE] ' + evt.path + ' added');


  // TODO get text from gcode file
  // communication.batch();Log.
});
