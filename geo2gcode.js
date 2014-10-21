var settings = {
  zOn: 255,
  zOff: 0,
  feedrate: 2000,
  thresh: 5 //size of the smallest acceptable line
}
var gcode =[];

var json = require("./test-edges.json");

for(var f=0; f < json["features"].length; f++){
    var geo = json["features"][f]["geometry"];
    switch(geo["type"]){
      case "Polygon":
        for(var spoly=0; spoly<geo["coordinates"].length; spoly++){
          gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOff); //turn off to prepare seek
          gcode.push("G00 F" + settings.feedrate + " X" + geo["coordinates"][spoly][0][0] + " Y" + geo["coordinates"][spoly][0][0]); // seek to starting point
          gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOn); //turn on to draw

          for(var poly=0; poly<geo["coordinates"][spoly].length; poly++)
          {
            var X = geo["coordinates"][spoly][poly][0];
            var Y = geo["coordinates"][spoly][poly][1];

            var simplerRun = 0;
            while (geo["coordinates"][spoly][poly+simplerRun+1] !== undefined && Math.abs(geo["coordinates"][spoly][poly+simplerRun+1][0] - X) <= settings.thresh && Math.abs( geo["coordinates"][spoly][poly+simplerRun+1][1] - Y) <= settings.thresh)
            {
                simplerRun++;
            }
            X = geo["coordinates"][spoly][poly+simplerRun][0];
            Y = geo["coordinates"][spoly][poly+simplerRun][1];
            poly = poly+simplerRun;

            gcode.push("G00 F" + settings.feedrate + " X" + X + " Y" + Y); // push lines
          }
        }
      break;
      // TODO: other types
    }
}

console.log(gcode.join("\n"));

//console.log("LENGTH : " + gcode.length);
