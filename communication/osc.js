var root = require('../root'),
  fs = require('fs'),
  util = require('util'),
  events = require('events'),
  osc = require("node-osc");

/**
 * Osc class to talk with the ofx code
 */
var OSC = function() {
  var self = this;
  var client = new osc.Client('127.0.0.1', 3333);

  this.sendEOD = function() {
    client.send('/EOD', 'true')
  };

  this.sendSOD = function() {
    client.send('/SOD', 'true')
  };
};

module.exports = OSC;
