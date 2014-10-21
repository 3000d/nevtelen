var settings = {
  zOn: 255,
  zOff: 0,
  feedrate: 2000
}
var gcode =[];

var json = require("./test-edges.json");

for(var f=0; f < json["features"].length; f++){
    var geo = json["features"][f]["geometry"];
    switch(geo["type"]){
      case "Polygon":
        for(var spoly=0; spoly<geo["coordinates"].length; spoly++){
          gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOff); //turn off to prepare seek
          for(var poly=0; poly<geo["coordinates"][spoly].length; poly++)
          {
            if(poly==1){//turn on to draw all the next lines
              gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOn); //turn off to prepare seek
            }
            gcode.push("G00 F"+settings.feedrate+" X"+geo["coordinates"][spoly][poly][0]+" Y"+geo["coordinates"][spoly][poly][1]); // push lines
          }
        }
      break;
      // TODO: other types
    }
}

console.log(gcode.join("\n"));
