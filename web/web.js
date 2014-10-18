var express = require('express');
var app = express();
var http = require('http').Server(app);
var util = require('util');
var io = require('socket.io')(http);
var root = require('../root');

var Web = function(drawbot) {
  app.use(express.static(root.web + '/public_html/assets'));

  app.get('/', function (req, res) {
    res.sendFile(root.web + '/public_html/index.html');
  });

  io.on('connection', function(socket) {

    drawbot.getSerialPortList(function(ports) {
      socket.emit('serial-list', ports);
    });

    socket.on('drawbot connect', function(data) {
      drawbot.connect(data.port);
    });
  });

  this.startServer = function() {
    http.listen(3000, function() {
      util.log(' -- [WEB] listening on localhost:3000');
    });
  };
};

module.exports = Web;