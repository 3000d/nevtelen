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
  var firstArrow = true;
  var index = 0;
  var EOF = false;
  var serial;
  var self = this;
  var isConnected = false;
  var cmdBuffer = fs.readFileSync(root.path + '/communication/setup.gcode').toString().split('\n'); //init the buffer with setup code

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
      self.emit(self.EVENT.CONNECTED);

      serial = new SerialPort(portComName, {
        parser: serialport.parsers.readline("\n"),
        baudrate: 57600
      });

      serial.on("open", function () {
        self.emit(self.EVENT.PORT_OPENED);
        //get data and log
        self.log('-- [COMM] communication opened on ' + portComName);

        serial.on('data', function(data) {
          //path is clear

          if(data.length > 2){
            self.log('IN: ' + data);
          }else if(data.indexOf(">") >= 0) // TODO : better string
          {
            //roger
            if(!firstArrow)
            {
              this.write(); // send next line
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
      self.emit(self.EVENT.DISCONNECTED);
      serial.close();
      isConnected = false;
    }
  };

  /**
   * Send a line to a robot and add a \n
   * @param string
   */
  this.writeLine = function(string) {
      this.cmdBuffer.push(string);
  };

  /**
   * send the next line to the robot
   */
  this.write = function() {
    // TODO : split text by line and send it to serial
    if(serial) {
      var cmd = buffer.splice(0, 1);
      self.Log.debug('SENDING : ' + cmd);
      serial.write(cmd + '\n', function(err, results) {
        if(err) self.Log.error('ERROR ' + err, true);
      });
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
      self.emit(self.EVENT.LOG, string, 'trace');
    },
    error: function(string) {
      util.error(string);
      self.emit(self.EVENT.LOG, string, 'error');
    },
    debug: function(string) {
      util.debug(string);
      self.emit(self.EVENT.LOG, string, 'debug');
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
