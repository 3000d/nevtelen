var express = require('express');
var serveIndex = require('serve-index');
var app = express();
var http = require('http').Server(app);
var util = require('util');
var io = require('socket.io')(http);
var root = require('../root');

var GcodeConverter = require(root.process + '/GcodeConverter');
var gcodeConverter = new GcodeConverter({});

var Web = function(drawbot) {
  app.use(express.static(__dirname + '/public_html/assets'));
  app.use(express.static(root.data));
  app.use(serveIndex(root.data));

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public_html/index.html');
  });

  io.on('connection', function(socket) {
    try {
      io.sockets.emit('users connected', io.sockets.server.eio.clientsCount);
    } catch(e) {}

    socket.on('disconnect', function() {
      util.log('disconnect ' + io.sockets.server.eio.clientsCount);
      try {
        io.sockets.emit('users connected', io.sockets.server.eio.clientsCount);
      } catch(e) {
        util.error(e);
      }
    });

    drawbot.on('log', function(string, type) {
      socket.emit('log', string, type);
    });

    if(drawbot.isSerialConnected()) {
      socket.emit('drawbot connected');
    }

    drawbot.on('connected', function() {
      socket.emit('drawbot connected');
    });
    drawbot.on('disconnected', function() {
      socket.emit('drawbot disconnected');
    });

    drawbot.getSerialPortList(function(ports) {
      socket.emit('serial-list', ports);
    });

    socket.on('drawbot connect', function(data) {
      drawbot.connect(data.port);
    });

    socket.on('drawbot disconnect', function() {
      drawbot.disconnect();
    });

    socket.on('drawbot writeLine', function(string) {
      drawbot.writeLine(string);
    });

    socket.on('drawbot write', function(text) {
      var parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch(e) {}

      console.log(text);

      // data is JSON. Convert !
      if(parsedData) {
        var gcode = gcodeConverter.convert(parsedData);
        drawbot.batch(gcode, true);
      } else {
        drawbot.batch(text, true);
      }
    });

    socket.on('drawbot jog', function(data) {
      drawbot.jog(data.direction);
    });

    socket.on('drawbot go-home', function() {
      drawbot.writeLine("G00 F2000 X0 Y0");
    });

    socket.on('drawbot set-home', function() {
      drawbot.writeLine("G92 X0 Y0");
    });

    socket.on('drawbot light', function(data) {
      if(data.on) {
        drawbot.writeLine('G00 F2000 Z255');
      } else {
        drawbot.writeLine('G00 F2000 Z0');
      }
    });
  });

  this.startServer = function() {
    http.listen(3000, function() {
      util.log(' -- [WEB] listening on localhost:3000');
    });
  };
};

module.exports = Web;
