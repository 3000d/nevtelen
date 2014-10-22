var socket = io();

var $serialListDropdown = $('#serial-list');
var $log = $('#log');
var $connect = $('#connect');
var $disconnect = $('#disconnect');
var $connectionFeedback = $('#connection-feedback');


/**
 *
 * Draw gCode
 *
 */

var gcodeViewer = new GcodeViewer(document.getElementById('gcode-viewer'));

$('#view-gcode').on('click', function(e) {
  e.preventDefault();

  var data = $('#write').val();

  if(data.length) {
    gcodeViewer.clear();
    gcodeViewer.draw(data);
  }
});




/**
 *
 * Listen to events on socket
 *
 */



/**
 * Receive serial port list
 */
socket.on('serial-list', function(ports) {
  if(ports.length) {
    $serialListDropdown.html('');
    for(var i = 0; i < ports.length; i++) {
      $serialListDropdown.append($('<option />').html(ports[i].comName));
    }
  }
});

socket.on('users connected', function(counter) {
  $('#connected-users').html(counter);
});


socket.on('log', function(string, type) {
  var $string = $('<i/>').html(string);
  if(type === 'error') {
    $string.addClass('text-danger');
  } else if(type === 'debug') {
    $string.addClass('text-info');
  } else if(type === 'warning') {
    $string.addClass('text-warning');
  } else if(type === 'success') {
    $string.addClass('text-success');
  }

  $log.append($string[0].outerHTML + '<br>');
  $log.scrollTop($log.prop('scrollHeight'));
});

checkConnected(false);

socket.on('drawbot connected', function() {
  checkConnected(true);
});
socket.on('drawbot disconnected', function() {
  checkConnected(false);
});


/**
 *
 * Click events
 *
 */


/**
 * Connection
 */
$connect.on('click', function(e) {
  socket.emit('drawbot connect', {port: $serialListDropdown.val()});
  e.preventDefault();
});


/**
 * Disconnection
 */
$disconnect.on('click', function(e) {
  socket.emit('drawbot disconnect');
  e.preventDefault();
});


/**
 * Turn the light on
 */
$('#light-on').on('click', function(e) {
  socket.emit('drawbot light', {on: true});
  e.preventDefault();
});


/**
 * Turn the light off
 */
$('#light-off').on('click', function(e) {
  socket.emit('drawbot light', {on: false});
  e.preventDefault();
});


/**
 * Jog left
 */
$('#jog-left').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'left'});
  e.preventDefault();
});


/**
 * Jog right
 */
$('#jog-right').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'right'});
  e.preventDefault();
});


/**
 * Jog up
 */
$('#jog-up').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'up'});
  e.preventDefault();
});


/**
 * Jog down
 */
$('#jog-down').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'down'});
  e.preventDefault();
});


/**
 * Go home
 */
$('#go-home').on('click', function(e) {
  socket.emit('drawbot go-home');
  e.preventDefault();
});

/**
 * Set home
 */
$('#set-home').on('click', function(e) {
  socket.emit('drawbot set-home');
});



/**
 * Write a line
 */
$('#writeLine-form').on('submit', function(e) {
  var dataToWrite = $('#writeLine').val();
  if(dataToWrite) {
    socket.emit('drawbot writeLine', dataToWrite);
  }
  e.preventDefault();
});

/**
 * Write text
 */
$('#write-form').on('submit', function(e) {
  e.preventDefault();
  var text = $('#write').val();

  if(text) {
    socket.emit('drawbot write', text);

    gcodeViewer.clear();
    gcodeViewer.draw(text);
  }

});


function checkConnected(isConnected) {
  if(isConnected) {
    $connect.attr('disabled', 'disabled');
    $disconnect.removeAttr('disabled');
    $connectionFeedback.find('span').html('CONNECTED').addClass('label-success').removeClass('label-danger');
  } else {
    $connect.removeAttr('disabled');
    $disconnect.attr('disabled', 'disabled');
    $connectionFeedback.find('span').html('NOT CONNECTED').addClass('label-danger').removeClass('label-success');
  }
}