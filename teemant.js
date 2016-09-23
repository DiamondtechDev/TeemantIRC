#!/usr/bin/env node
'use strict';
let express = require("express");
let path = require("path");
let sockio = require('socket.io');
let app = express();
let pubdir = path.join(__dirname+"/public");
let port = 8080;

let connections = {}

app.get("/", function(req, res){
	res.sendFile(pubdir+"/index.html");
});

app.use(express.static(__dirname + '/public'));

let io = sockio.listen(app.listen(port, function() {
	console.log("*** Listening on port " + port);
}));

io.sockets.on('connection', function (socket) {
	console.log('clientID: '+socket.id+' connection: ', socket.request.connection._peername);
	connections[socket.id] = {}

	socket.on('disconnect', function() {
		for (let d in connections[socket.id]) d.disconnect("Client exited");

		delete connections[socket.id];

		console.log('clientID: '+socket.id+' disconnect');
	});

	socket.on('irc_create', function(connectiondata) {
		console.log(socket.id+" created irc connection: ", connectiondata);

		socket.emit('act_client', {type: 'connect_message', data: "Attempting connection..", error: false});

		setTimeout(function() {
			console.log("fake connect");
			socket.emit('act_client', {type: 'event_connect', address: connectiondata.server, network: "IcyNet", raw: connectiondata});
			socket.emit('act_client', {type: 'server_message', messageType: "notice", server: connectiondata.server, to: connectiondata.server, from: null, message: "Connection established"});
		}, 2000);

		setTimeout(function() {
			console.log("fake channel");
			socket.emit('act_client', {type: 'event_join_channel', server: connectiondata.server, name: "#channel"});
			// Spam the client with messages (for testing)
			setInterval(function() {
				socket.emit('act_client', {type: 'server_message', messageType: "privmsg", server: connectiondata.server, to: "#channel", from: "horse", message: "I like ponies"});
			}, 4000);
		}, 4000);
	});
});
