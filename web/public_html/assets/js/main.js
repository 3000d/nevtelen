var socket = io();

var $serialListDropdown = $('#serial-list');
var $log = $('#log');
var $connect = $('#connect');
var $disconnect = $('#disconnect');
var $connectionFeedback = $('#connection-feedback');

/**
 * Receive serial port list
 */
socket.on('serial-list', function(ports) {
  for(var i = 0; i < ports.length; i++) {
    $serialListDropdown.append($('<option />').html(ports[i].comName));
  }
});


socket.on('log', function(string, err) {
  $log.append(string + '<br>');
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
$('#lights-on').on('click', function(e) {
  socket.emit('drawbot lights', {on: true});
  e.preventDefault();
});


/**
 * Turn the light off
 */
$('#lights-off').on('click', function(e) {
  socket.emit('drawbot lights-off', {on: false});
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
 * Write
 */
$('#write-form').on('submit', function(e) {
  var dataToWrite = $('#write').val();
  if(dataToWrite) {
    socket.emit('drawbot write', {string: dataToWrite});
  }
  e.preventDefault();
});


function checkConnected(isConnected) {
  if(isConnected) {
    $connect.attr('disabled', 'disabled');
    $disconnect.removeAttr('disabled');
    $connectionFeedback.html('CONNECTED').css({color: '#0f0'})
  } else {
    $connect.removeAttr('disabled');
    $disconnect.attr('disabled', 'disabled');
    $connectionFeedback.html('NOT CONNECTED').css({color: '#f00'})
  }
}