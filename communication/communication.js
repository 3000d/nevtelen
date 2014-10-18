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
    PORT_OPENED: 'portOpened',
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
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
      emit(EVENT.CONNECT);

      serial = new SerialPort(portComName, {
        parser: serialport.parsers.readline("\n"),
        baudrate: 57600
      });

      serial.on("open", function () {
        //get data and log

        serial.on('data', function(data) {

          //path is clear
          if(data.indexOf(">") >= 0)
          {
            self.log('in: ' + data);

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
      emit(EVENT.DISCONNECT);
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
    emit(EVENT.LOG, {
      data: data,
      err: err
    });
  };

  this.isConnected = isConnected;
};
util.inherits(Communication, events.EventEmitter);


/**
 * Web server
 */
var Web = require(root.web + '/web');
var web = new Web(new Communication());
web.startServer();