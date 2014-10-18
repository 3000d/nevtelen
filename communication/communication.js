var firstArrow = true;

var root = require('../root');
var fs = require('fs');
var util = require('util');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

/**
 * Communication class to talk with the drawbot
 */
var Communication = function() {
  var setup = fs.readFileSync(root.path + '/communication/setup.gcode').toString().split('\n');
  var index = 0;
  var EOF = false;
  var serial;
  var logFunction;
  var self = this;
  var isConnected = false;

  /**
   * get serial ports available
   * @param callback this will be called with ports as parameters
   */
  this.getSerialPortList = function(callback) {
    serialport.list(function(err, ports) {
      callback(ports);
    });
  };

  /**
   * Connect to drawbot on given port comName
   * @param portComName
   */
  this.connect = function(portComName) {
    if(!isConnected) {
      isConnected = true;

      if(!portComName) {
        util.error('Called connect but no port defined');
        return;
      }

      serial = new SerialPort(portComName, {
        parser: serialport.parsers.readline("\n"),
        baudrate: 57600
      });

      serial.on("open", function () {
        //get data and log

        serial.on('data', function(data) {
          self.log('in: ' + data);

          //path is clear
          if(data.indexOf(">") >= 0)
          {
            //roger
            if(!firstArrow && !EOF)
            {
              self.log("ready " + setup[index]);
              serial.write(setup[index] + '\n', function(err, results){
                if(err) self.log('ERROR ' + err, true);
                if(results) self.log('results ' + results);
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
    }
  };

  this.disconnect = function() {
    if(serial && isConnected) {
      serial.close();
      isConnected = false;
    }
  };

  this.write = function(data) {
    serial.write(data + '\n', function(err, results) {
      if(err) self.log('ERROR ' + err, true);
      if(results) self.log('results ' + results);
    });
  };

  this.jog = function(direction) {
    this.write('G91');

    if(direction === 'up') {
      this.write('G00 F2000 Y20');
    } else if(direction === 'down') {
      this.write('G00 F2000 Y-20');
    } else if(direction === 'left') {
      this.write('G00 F2000 X-20');
    } else if(direction === 'right') {
      this.write('G00 F2000 X20');
    }

    this.write('G90');
  };

  this.log = function(data, err) {
    if(err) {
      util.error(data);
    } else {
      util.log(data);
    }
    if(logFunction) logFunction(data, err);
  };

  /**
   * Used to get log in a custom function
   * @param fct
   */
  this.logFunction = function(fct) {
    logFunction = fct;
  };


  this.isConnected = isConnected;
};



/**
 * Web server
 */
var Web = require(root.web + '/web');
var web = new Web(new Communication());
web.startServer();