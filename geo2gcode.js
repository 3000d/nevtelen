var GcodeConverter = require('./process/GcodeConverter');

var gcodeConverter = new GcodeConverter({
  feedrate: (process.argv[3] || 2000),
  threshold: (process.argv[4] || 5),
  scale: (process.argv[5] || 1)
});

var json = require(process.argv[2] || "./test-edges.json");
var gcode = gcodeConverter.convert(json);

console.log(gcode);