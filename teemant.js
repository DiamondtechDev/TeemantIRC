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
			socket.emit('act_client', {type: 'event_connect', address: connectiondata.server, network: "IcyNet", supportedModes: {"o": "@", "h": "%", "v": "+"}, nickname: connectiondata.nickname, raw: connectiondata});
			socket.emit('act_client', {type: 'server_message', messageType: "notice", server: connectiondata.server, message: "Connection established"});
		}, 2000);

		setTimeout(function() {
			console.log("fake channel");
			socket.emit('act_client', {type: 'event_join_channel', server: connectiondata.server, name: "#channel"});
			socket.emit('act_client', {type: 'channel_nicks', channel: "#channel", server: connectiondata.server, nicks: ["+horse", "@scoper", "@aspire", "+random", "lol"]});
			socket.emit('act_client', {type: 'channel_topic', channel: "#channel", server: connectiondata.server, topic: "This channel is the best."});
			socket.emit('act_client', {type: 'channel_topic', channel: "#channel", server: connectiondata.server, set_by: "horse", time: Date.now()});
			socket.emit('act_client', {type: 'message', messageType: "privmsg", server: connectiondata.server, to: "#channel", from: "horse", message: "I like ponies"});

			setTimeout(function() {
				socket.emit('act_client', {type: 'nick_change', server: connectiondata.server, nick: "horse", newNick: "pony"});
			}, 2000)

			setTimeout(function() {
				socket.emit('act_client', {type: 'message', messageType: "action", server: connectiondata.server, to: "#channel", from: "pony", message: "Is the greatest pony fan"});
			}, 3000)

			setTimeout(function() {
				socket.emit('act_client', {type: 'event_join_channel', server: connectiondata.server, name: "#poni"});
				socket.emit('act_client', {type: 'channel_nicks', channel: "#poni", server: connectiondata.server, nicks: ["+horse", "@Diamond", "@aspire", "+random", "lol"]});
				socket.emit('act_client', {type: 'channel_topic', channel: "#poni", server: connectiondata.server, topic: "This channel is the second best."});
				socket.emit('act_client', {type: 'channel_topic', channel: "#poni", server: connectiondata.server, set_by: "Diamond", time: Date.now()});
			}, 5000)
		}, 4000);
	});
});
