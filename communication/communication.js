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

  this.EVENT = {
    CONNECTED: 'connected',
    PORT_OPENED: 'portOpened',
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
        self.emit(EVENT.PORT_OPENED);
        //get data and log
        self.log('-- [COMM] communication opened on ' + portComName);

        serial.on('data', function(data) {
          //path is clear
          if(data.indexOf(">") >= 0)
          {
            // log only when there's relevant information
            if(data.length > 2) {
              self.log('in: ' + data);
            }

            //roger
            if(!firstArrow && !EOF)
            {
              self.log("ready " + setup[index]);
              serial.writeLine(setup[index] + '\n', function(err, results){
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

  /**
   * Send a line to a robot and add a \n
   * @param string
   */
  this.writeLine = function(string) {
    if(serial) {
      serial.write(string + '\n', function(err, results) {
        if(err) self.Log.error('ERROR ' + err, true);
      });
    }
  };

  /**
   * Splits a text in line and send it to robot
   * @param text
   */
  this.write = function(text) {
    // TODO split text by line and send it to serial
  };

  /**
   * Move the robot around
   * @param direction {'up', 'down', 'left', 'right'}
   */
  this.jog = function(direction) {
    this.writeLine('G91');

    if(direction === 'up') {
      this.writeLine('G00 F2000 Y20');
    } else if(direction === 'down') {
      this.writeLine('G00 F2000 Y-20');
    } else if(direction === 'left') {
      this.writeLine('G00 F2000 X-20');
    } else if(direction === 'right') {
      this.writeLine('G00 F2000 X20');
    }

    this.writeLine('G90');
  };

  /**
   * Check if we're connected to drawbot.
   * Useful when a user connects, so we can
   * directly tell him the state of the robot
   * @returns {boolean}
   */
  this.isSerialConnected = function() {
    return isConnected;
  };


  /**
   * Logging
   *
   * trace: for output purpose
   * error: for errors (displayed in red on web page)
   * debug: only for debugging, temporary logs (displayed in blue on web page)
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

  // proxy method for confort
  this.log = function(string) {
    this.Log.trace(string);
  }
};

/**
 * Prototype inheritance for EventEmitter
 */
util.inherits(Communication, events.EventEmitter);

module.exports = Communication;