/**
 * Converts png to gcode.
 * (png > bmp > json > gcode)
 * Svg is generated for preview
 *
 * How to use:
 * Put an image in data/source folder.
 * type :
 *    node convert.js [image.ext] "-k 0.4 -t 60"
 */

var root = require('../root'),
  fs = require('fs'),
  exec = require('child_process').exec;
  GcodeConverter = require(root.process + '/GcodeConverter');

var args = process.argv.slice(2);
var gcodeConverter = new GcodeConverter({feedrate: 2});
var sourceFileName, potraceArgs;

// get arguments from command line
sourceFileName = args[0];
potraceArgs = args[1] || '';

// get filename and file extension
var fileNameArr = sourceFileName.split('.');
var fileName = fileNameArr[fileNameArr.length-2];
var fileExtension = fileNameArr[fileNameArr.length - 1];
var sourceFile = root.data_source + '/' + sourceFileName;

if(fileExtension !== 'bmp') {
  convertToBmp(root.data_temp + '/' + fileName + '.bmp', function() {
    convertToSvg();
    convertToJson(function() {
      convertToGcode();
    });
  });
} else {
  convertToSvg();
  convertToJson(function() {
    convertToGcode();
  });
}



function convertToBmp(dest, callback) {
  var convertToBmp = 'convert ' + sourceFile + ' ' + dest;
  sourceFile = dest;
  _doExec(convertToBmp, callback);
}

function convertToSvg(callback) {
  var potraceSvg = 'potrace ' + potraceArgs + ' -o ' + (root.data_svg + '/' + (fileName + '.svg')) + ' -s ' + sourceFile;
  _doExec(potraceSvg, callback);

}

function convertToJson(callback) {
  var potrace = 'potrace -i -b geojson ' + potraceArgs + ' -o ' + (root.data_json + '/' + fileName + '.json') + ' ' + sourceFile;
  sourceFile = root.data_json + '/' + fileName + '.json';
  _doExec(potrace, callback);
}

function convertToGcode(callback) {
  var json = require(sourceFile);
  var gcode = gcodeConverter.convert(json);

  fs.writeFile(root.data_gcode + '/' + fileName + '.gcode', gcode, function(err) {
    if(err) {
      console.error('Could not save to gcode');
    } else {
    }
  });
}


function _doExec(command, callback) {
  exec(command, function(error, stdout, stderr) {
    if(!error && error === null) {
      if(callback)
        callback();
    } else {
      console.log('error ! ', error, stderr);
    }
  });
}