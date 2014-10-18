var firstArrow = true;

var root = require('../root');
var fs = require('fs');
var util = require('util');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

/**
 * Web server
 */
var Web = require(root.web + '/web');

var Communication = function() {
  var setup = fs.readFileSync(root.path + '/communication/setup.gcode').toString().split('\n');
  var index = 0;
  var EOF = false;
  var serial;

  this.getSerialPortList = function(callback) {
    serialport.list(function(err, ports) {
      callback(ports);
    });
  };

  this.connect = function(portComName) {
    if(!portComName) {
      util.error('Called connect but no port defined');
      return;
    }

    serial = new SerialPort(portComName, {
      parser: serialport.parsers.readline("\n"),
      baudrate: 57600
    });

    serial.on("open", function () {
      util.log('-- port opened --');

      //get data and log

      serial.on('data', function(data) {
        console.log('in: ' + data);

        //path is clear
        if(data.indexOf(">") >= 0)
        {
          //roger
          if(!firstArrow && !EOF)
          {
            util.log("ready " + setup[index]);
            serial.write(setup[index] + '\n', function(err, results){
              if(err) console.log('ERROR ' + err);
              if(results) console.log('results ' + results);
              firstArrow = true;
              if(index < setup.length)
                index++;
              else
                EOF = true;
            });
          }else
          {
            firstArrow = false;
          }
        }
      });
    });
  };
};



var web = new Web(new Communication());
web.startServer();