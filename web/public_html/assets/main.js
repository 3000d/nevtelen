var socket = io();

var $serialListDropdown = $('#serial-list');
/**
 * Receive serial port list
 */
socket.on('serial-list', function(ports) {
  for(var i = 0; i < ports.length; i++) {
    $serialListDropdown.append($('<option />').html(ports[i].comName));
  }
});

$('#connect').on('click', function(e) {
  socket.emit('drawbot connect', {port: $serialListDropdown.val()});
  e.preventDefault();
});

$('#disconnect').on('click', function(e) {
  socket.emit('drawbot disconnect');
  e.preventDefault();
});

$('#lights-on').on('click', function(e) {
  socket.emit('drawbot lights-on');
  e.preventDefault();
});

$('#lights-off').on('click', function(e) {
  socket.emit('drawbot lights-off');
  e.preventDefault();
});

$('#jog-left').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'left'});
  e.preventDefault();
});

$('#jog-right').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'right'});
  e.preventDefault();
});

$('#jog-up').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'up'});
  e.preventDefault();
});

$('#jog-down').on('click', function(e) {
  socket.emit('drawbot jog', {direction: 'down'});
  e.preventDefault();
});