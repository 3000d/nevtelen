/*
 * Talks to a drawbot through serial port
 *
 * d3000 - hello@3000d.be
 */

var util = require('util'),
  root = require('../root'),
  path = require('path');

var Watcher = require(root.path + '/common/Watcher');

gcodeWatcher = new Watcher({
  folder: path.resolve(root.path, 'data/gcode'),
  extensions: ['gcode']
});

gcodeWatcher.on('fileAdded', function(evt) {
  util.log('[new GCODE] ' + evt.path + ' added');
});