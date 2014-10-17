var firstArrow = true;

var fs = require('fs');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

var setup = fs.readFileSync('setup.gcode').toString().split('\n');

var index = 0;

var EOF = false;

var sp = new SerialPort("/dev/ttyACM0", {
  parser: serialport.parsers.readline("\n"),
  baudrate: 57600
});

sp.on("open", function () {
  console.log('open');

  //get data and log

  sp.on('data', function(data) {
    console.log('in: ' + data);

    //path is clear
    if(data.indexOf(">") >= 0)
    {
	//roger
	if(!firstArrow && !EOF)
	{
		console.log("ready " + setup[index]);
		sp.write(setup[index] + '\n', function(err, results){
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
