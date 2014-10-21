var settings = {
  zOn: 255,
  zOff: 0,
  feedrate: 2000,
  thresh: 5
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
            var X = geo["coordinates"][spoly][poly][0];
            var Y = geo["coordinates"][spoly][poly][1];

            if(poly==1){//turn on to draw all the next lines
              gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOn); //turn off to prepare seek
            }

            if(poly < geo["coordinates"][spoly].length - 1) //are we not at the end of path ?
            {
              var X2 = geo["coordinates"][spoly][poly+1][0];
              var Y2 = geo["coordinates"][spoly][poly+1][1];

              if(Math.abs(X2 - X) <= settings.thresh && Math.abs(Y2-Y) <= settings.thresh)
              {
                X = X2;
                Y = Y2;
                poly = poly+1;
              }
            }

            gcode.push("G00 F" + settings.feedrate + " X" + X + " Y" + Y); // push lines
          }
        }
      break;
      // TODO: other types
    }
}

console.log(gcode.join("\n"));

//console.log("LENGTH : " + gcode.length);
