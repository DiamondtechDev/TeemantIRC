#!/usr/bin/env node
'use strict';
let express = require("express");
let path = require("path");
let sockio = require("socket.io");
let dns = require("dns");
let app = express();
let router = express.Router();

let pubdir = path.join(__dirname, "public");
let config = require(__dirname+'/server/config');
let ircclient = require(__dirname+'/server/irc');

let port = config.server.port || 8080;

let runtime_stats = {
	connectionsMade: 0
};

let connections = {};

process.stdin.resume();

router.get("/", function(req, res){
	res.sendFile(pubdir+"/index.html");
});

router.get("/:server", function(req, res){
	res.sendFile(pubdir+"/index.html");
});

app.use('/', express.static(pubdir, { maxAge: 365*24*60*60*1000 }));
app.use('/:server', express.static(pubdir, { maxAge: 365*24*60*60*1000 }));
app.use('/', router);

function printRuntimeStats() {
	let date = new Date();
	let users = 0;
	let servers = 0;
	let serversPerUser = 0;

	for(let uid in connections) {
		let ca = connections[uid];
		users += 1;
		for(let snam in ca) {
			if(!snam) continue;
			if(snam == "host") continue;
			servers += 1;
		}
	}

	if(servers != 0)
		serversPerUser = users/servers;

	console.log(date+": Currently connected users: "+users+"; IRC server connections: "+servers+"; Average servers per user: "+serversPerUser+"; Total connections made: "+runtime_stats.connectionsMade);
}

let io = sockio.listen(app.listen(port, function() {
	console.log("*** Listening on http://localhost:" + port + "/");
	setInterval(printRuntimeStats, 3600000);
}));

function resolveHostname(ipaddr) {
	let promise = new Promise(function(resolve, reject) {
		dns.reverse(ipaddr, function(err, hostnames) {
			if(err != null) return reject(err);
			resolve(hostnames);
		});
	});
	return promise;
}

io.sockets.on('connection', function (socket) {
	let userip = socket.handshake.headers['x-real-ip'] || socket.handshake.headers['x-forwarded-for'] || 
				 socket.request.connection._peername.address || "127.0.0.1";

	if(userip.indexOf('::ffff:') == 0)
		userip = userip.substring(7);

	if(config.server.debug)
		console.log('clientID: '+socket.id+' from: ', userip);

	// New object for connections
	connections[socket.id] = {
		host: {
			ipaddr: userip,
			hostname: userip
		}
	}

	// Get the hostname of the connecting user
	let hostQuery = resolveHostname(userip);
	hostQuery.then((arr) => {
		if(arr.length > 0)
			connections[socket.id].host.hostname = arr[0];
	}).catch((err) => {
		if(config.server.debug)
			console.log("Host resolve for "+socket.id+" failed: ", err); 
	});

	if(config.server.debug)
		console.log("Hostname of "+socket.id+" was determined to be "+connections[socket.id].host.hostname);

	socket.on('disconnect', function() {
		for (let d in connections[socket.id]) {
			if(connections[socket.id][d].ipaddr) continue;
			if(connections[socket.id][d].connected == true)
				connections[socket.id][d].disconnect();
		}

		delete connections[socket.id];

		if(config.server.debug)
			console.log('clientID: '+socket.id+' disconnect');
	});

	socket.on('error', (e) => {
		console.log(e);
	});

	socket.on('userinput', (data) => {
		let serv = connections[socket.id][data.server];
		if(!serv) return;
		if(serv.authenticated == false) return;

		if(config.server.debug)
			console.log("["+socket.id+"] ->", data);

		serv.handler.handleUserLine(data);
	})

	socket.on('irc_create', function(connectiondata) {
		if(config.server.debug)
			console.log(socket.id+" created irc connection: ", connectiondata);

		socket.emit('act_client', {type: 'connect_message', message: "Connecting to server..", error: false});

		let newConnection = new ircclient(connectiondata, connections[socket.id].host);
		newConnection.connect();

		connections[socket.id][connectiondata.server] = newConnection;

		newConnection.on('authenticated', () => {
			socket.emit('act_client', {type: "event_connect", address: connectiondata.server, network: newConnection.data.network,
										supportedModes: newConnection.data.supportedModes, nickname: newConnection.config.nickname,
										max_channel_length: newConnection.data.max_channel_length});

			runtime_stats.connectionsMade += 1;
		});

		if(config.server.debug) {
			newConnection.on('line', function(line) {
				console.log("["+socket.id+"] <-", line);
			});

			newConnection.on('debug_log', function(data) {
				console.log("["+socket.id+"] <-", data);
			});
		}

		newConnection.on('connerror', (data) => {
			let message = "An error occured";
			let inconnect = true;
		
			if(data['message'])
				message = data.message;

			if(newConnection.authenticated == false) {
				message = "Failed to connect to the server!";
				inconnect = false;
			}

			if(config.server.debug)
				console.log(data);

			socket.emit('act_client', {type: (inconnect == true ? 'server_message' : 'connect_message'), server: connectiondata.server, message: message, error: true});
		});

		newConnection.on('pass_to_client', (data) => {
			socket.emit('act_client', data);
		});

		newConnection.on('closed', (data) => {
			let message = "Connection closed";
			let inconnect = true;

			if(newConnection.authenticated == false) {
				message = "Failed to connect to the server!";
				
				if(config.server.debug)
					console.log(data);

				inconnect = false;
			}

			socket.emit('act_client', {type: (inconnect == true ? 'server_message' : 'connect_message'), server: connectiondata.server, message: message, error: true});
			
			if(inconnect)
				socket.emit('act_client', {type: 'event_server_quit', server: connectiondata.server});
		});
	});
});

process.on('SIGINT', () => {
	console.log('!!! Received SIGINT; Terminating all IRC connections and exiting.. !!!');
	for(let c in connections) {
		for(let ircconn in connections[c]) {
			if(connections[c][ircconn].ipaddr) continue;
			connections[c][ircconn].disconnect();
		}
	}
	process.exit();
});
