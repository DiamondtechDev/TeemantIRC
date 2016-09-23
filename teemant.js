#!/usr/bin/env node
'use strict';
let express = require("express");
let path = require("path");
let sockio = require("socket.io");
let dns = require("dns");
let app = express();

let pubdir = path.join(__dirname+"/public");
let config = require(__dirname+'/server/config');
let ircclient = require(__dirname+'/server/irc');

let port = config.server.port || 8080;

let connections = {}

app.get("/", function(req, res){
	res.sendFile(pubdir+"/index.html");
});

app.use(express.static(__dirname + '/public'));

let io = sockio.listen(app.listen(port, function() {
	console.log("*** Listening on port " + port);
}));

function resolveHostname(hostname) {
	let promise = new Promise(function(resolve, reject) {
		dns.lookup(hostname, function(err, address, family) {
			if(err != null) return reject(err);
			resolve(address);
		});
	});
	return promise;
}

io.sockets.on('connection', function (socket) {
	console.log('clientID: '+socket.id+' connection: ', socket.request.connection._peername);
	connections[socket.id] = {}

	socket.on('userinput', function(data) {
		console.log(data);
	})

	socket.on('disconnect', function() {
		for (let d in connections[socket.id]) 
			connections[socket.id][d].disconnect();

		delete connections[socket.id];

		console.log('clientID: '+socket.id+' disconnect');
	});

	socket.on('error', (e) => {
		console.log(e);
	})

	socket.on('irc_create', function(connectiondata) {
		console.log(socket.id+" created irc connection: ", connectiondata);
		socket.emit('act_client', {type: 'connect_message', message: "Connecting to server..", error: false});

		let newConnection = new ircclient(connectiondata);
		newConnection.connect();

		connections[socket.id][connectiondata.server] = newConnection;

		newConnection.on('authenticated', () => {
			console.log("******** AUTH DONE **********");
			console.log("******** AUTH DONE **********");
			console.log("******** AUTH DONE **********");
			console.log("******** AUTH DONE **********");
			console.log("******** AUTH DONE **********");
			socket.emit('act_client', {type: "event_connect", address: connectiondata.server, network: newConnection.data.network,
										  supportedModes: newConnection.data.supportedModes, nickname: newConnection.config.nickname});
		});

		newConnection.on('error', (data) => {
			let message = "An error occured";
			let inconnect = false;

			if(!newConnection.authenticated) {
				message = "Failed to connect to the server!";
				inconnect = true;
			}

			socket.emit('act_client', {type: (inconnect ? 'server_message' : 'connect_message'), message: message, type: 'error', error: true});
		});

		newConnection.on('pass_to_client', (data) => {
			socket.emit('act_client', data);
		});

		newConnection.on('closed', (data) => {
			let message = "Connection closed";
			let inconnect = false;

			switch(data.type) {
				case "sock_closed_success":
					inconnect = true;
					break;
			}

			if(!newConnection.authenticated) {
				message = "Failed to connect to the server!";
				inconnect = true;
			}

			socket.emit('act_client', {type: (inconnect ? 'server_message' : 'connect_message'), message: message, type: 'error', error: true});
		});
	});
});
