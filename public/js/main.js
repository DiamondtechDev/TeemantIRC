window.onload = function() {

	var messages = [];
	var socket = io.connect('http://localhost:8080');

	socket.on('connect', function (data) {
		alert("socketio works!")
	});
}
