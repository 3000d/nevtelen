var root = require('../root'),
  fs = require('fs'),
  util = require('util'),
  events = require('events'),
  osc = require("node-osc"),

/**
 * Osc class to talk with the ofx code
 */
var OSC = function() {
  var self = this;

  this.sendEOD = function()
  {
    //var client = new osc.Client('127.0.0.1', '3333');
    var client = new osc.Client('192.168.178.24', '3333');
    client.send('/EOD', 'true')
  }
}

module.exports = OSC;
