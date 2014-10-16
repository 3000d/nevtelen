/*
 * Convert jpg to svg to gcode.
 *
 * d3000 - hello@3000d.be
 */

var path = require('path'),
  root = require('../root'),
  util = require('util');

var Watcher = require(root.path + '/common/Watcher');



var jpgWatcher = new Watcher({
  folder: path.resolve(root.path, 'data/jpg'),
  extensions: ['jpg', 'jpeg']
});

var svgWatcher = new Watcher({
  folder: path.resolve(root.path, 'data/svg'),
  extensions: ['svg']
});



jpgWatcher.on('fileAdded', function(evt) {
  util.log('[new JPG] ' + evt.path + ' added');
});

svgWatcher.on('fileAdded', function(evt) {
  util.log('[new SVG] ' + evt.path + ' added');
});