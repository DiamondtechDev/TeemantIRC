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
		}, 2000)
	});
});
