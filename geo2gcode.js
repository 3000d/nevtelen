var settings = {
  zOn: 180,
  zOff: 0,
  feedrate: (process.argv[3] || 2000),
  thresh: (process.argv[4] || 5) //size of the smallest acceptable line
};

var json = require(process.argv[2] || "./test-edges.json");

var gcode = [];

for(var f=0; f < json["features"].length; f++){
    var geo = json["features"][f]["geometry"];
    switch(geo["type"]){
      case "Polygon":
        for(var spoly=0; spoly<geo["coordinates"].length; spoly++){
          gcode.push("G00 F" + settings.feedrate + " Z" + settings.zOff); //turn off to prepare seek
          gcode.push("G00 F" + settings.feedrate + " X" + geo["coordinates"][spoly][0][0] + " Y" + geo["coordinates"][spoly][0][1]); // seek to starting point
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

//console.log("LENGTH : " + gcode.length);

var centerGcode = function(gcode){
  var xmin = 10000;
  var xmax = -10000;
  var ymin = 10000;
  var ymax = -10000;
  for(var i=0; i<gcode.length; i++)
  {
    var split = gcode[i].split(' ');
    if(split[0] == 'G00' && split[2][0] == 'X')
    {
      if(parseInt(split[2].substr(1), 10) < xmin) xmin = split[2].substr(1);
      if(parseInt(split[2].substr(1), 10) > xmax) xmax = split[2].substr(1);
      if(parseInt(split[3].substr(1), 10) < ymin) ymin = split[3].substr(1);
      if(parseInt(split[3].substr(1), 10) > ymax) ymax = split[3].substr(1);
    }
  }

  xcut = (xmax - xmin) / 2;
  ycut = (ymax - ymin) / 2;

  for(var i=0; i<gcode.length; i++)
  {
    var split = gcode[i].split(' ');
    if(split[0] == 'G00' && split[2][0] == 'X')
    {
      split[2] = "X" + (parseInt(split[2].substr(1), 10) - xcut);
      split[3] = "Y" + (parseInt(split[3].substr(1), 10) - ycut);
    }
    gcode[i] = split.join(" ");
  }

  return gcode;
}

gcode = centerGcode(gcode);

gcode.splice(0, "G00 F" + settings.feedrate + " Z" + settings.zOff, 'G00 F'+settings.feedrate+' X0 Y0');

console.log(gcode.join("\n"));
