var util = require('util'),
  events = require('events'),
  chokidar = require('chokidar');

var Watcher = function(opts) {
  this.settings = opts;

  var self = this;

  var watcher = chokidar.watch(this.settings.folder, {ignored: /[\/\\]\./, persistent: true, ignoreInitial: true});

  watcher.on('add', function (path) {
    var isExtOk = false;

    var ext = path.split('.');
    ext = ext[ext.length-1];

    for(var i = 0; i < self.settings.extensions.length; i++) {
      if(self.settings.extensions[i] === ext) {
        isExtOk = true;
      }
    }

    if(!self.settings.extensions || isExtOk) {
      self.emit('fileAdded', {
        path: path
      });
    }
  }).on('error', function(error) {
    self.emit('error', error);
  });
};

util.inherits(Watcher, events.EventEmitter);
module.exports = Watcher;