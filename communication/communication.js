var root = require('../root'),
  fs = require('fs'),
  util = require('util'),
  events = require('events'),
  serialport = require("serialport"),
  SerialPort = serialport.SerialPort; // localize object constructor



/**
 * Communication class to talk with the drawbot
 */
var Communication = function() {
  var setup = fs.readFileSync(root.path + '/communication/setup.gcode').toString().split('\n');
  var firstArrow = true;
  var index = 0;
  var EOF = false;
  var serial;
  var self = this;
  var isConnected = false;

  var EVENT = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    LOG: 'log'
  };


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
      if(!portComName) {
        util.error('Called connect but no port defined');
        return;
      }

      isConnected = true;
      self.emit(EVENT.CONNECTED);

      serial = new SerialPort(portComName, {
        parser: serialport.parsers.readline("\n"),
        baudrate: 57600
      });

      serial.on("open", function () {
        //get data and log
        self.Log.trace('-- [COMM] communication opened on ' + portComName);

        serial.on('data', function(data) {

          //path is clear
          if(data.indexOf(">") >= 0)
          {
            if(data.length > 2) {
              self.Log.trace('in: ' + data);
            }

            //roger
            if(!firstArrow && !EOF)
            {
              self.Log.trace("ready " + setup[index]);
              serial.write(setup[index] + '\n', function(err, results){
                if(err) self.Log.error('ERROR ' + err);
                if(results) self.Log.debug('results ' + results);
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
      self.emit(EVENT.DISCONNECTED);
      serial.close();
      isConnected = false;
    }
  };

  this.write = function(data) {
    if(serial) {
      serial.write(data + '\n', function(err, results) {
        if(err) self.Log.error('ERROR ' + err, true);
      });
    }
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

  this.isSerialConnected = function() {
    return isConnected;
  };

  /**
   * Logging
   */

  this.Log = {
    trace: function(string) {
      util.log(string);
      self.emit(EVENT.LOG, string, 'trace');
    },
    error: function(string) {
      util.error(string);
      self.emit(EVENT.LOG, string, 'error');
    },
    debug: function(string) {
      util.debug(string);
      self.emit(EVENT.LOG, string, 'debug');
    }
  };
};

/**
 * Prototype inheritance for EventEmitter
 */
util.inherits(Communication, events.EventEmitter);


/**
 * Web server
 */
var Web = require(root.web + '/web');
var web = new Web(new Communication());
web.startServer();