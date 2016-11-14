#!/usr/bin/env node
'use strict';
const express = require("express"),
	  path = require("path"),
	  sockio = require("socket.io"),
	  dns = require("dns"),
	  app = express(),
	  router = express.Router(),

	  pubdir = path.join(__dirname, "public"),
	  pkg    = require(__dirname+"/package.json"),

	  config = require(__dirname+'/server/config'),
	  logger = require(__dirname+'/server/logger'),

	  port = config.server.port || 8080;

let irclib = require(__dirname+'/server/teemant_irc');
let webirc = require(__dirname+'/server/webirc');

let runtime_stats = {
	connectionsMade: 0
};

let connections = {};

let customCTCPs = {
	VERSION: function(data, connection) {
		return "TeemantIRC ver. "+pkg.version+" - "+pkg.description+" - https://teemant.icynet.ml/";
	},
	SOURCE: function(data, connection) {
		return "https://github.com/DiamondtechDev/TeemantIRC";
	}
}

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

const io = sockio.listen(app.listen(port, function() {
	logger.log("*** Listening on http://localhost:" + port + "/");

	setInterval(() => {
		logger.printRuntimeStats(runtime_stats, connections);
	}, 3600000);
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

	logger.debugLog('clientID: '+socket.id+' from: ', userip);

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
		logger.debugLog("Host resolve for "+socket.id+" failed: ", err); 
	});

	logger.debugLog("Hostname of "+socket.id+" was determined to be "+connections[socket.id].host.hostname);

	socket.on('disconnect', function() {
		for (let d in connections[socket.id]) {
			if(connections[socket.id][d].ipaddr) continue;
			if(connections[socket.id][d].connected == true)
				connections[socket.id][d].disconnect();
		}

		delete connections[socket.id];

		logger.debugLog('clientID: '+socket.id+' disconnect');
	});

	socket.on('error', (e) => {
		logger.errorLog(e, "Socket error");
	});

	socket.on('userinput', (data) => {
		let serv = connections[socket.id][data.server];
		if(!serv) return;
		if(serv.authenticated == false) return;

		logger.debugLog("["+socket.id+"] ->", data);

		serv.handler.handleUserLine(data);
	})

	socket.on('irc_create', function(connectiondata) {
		logger.debugLog(socket.id+" created irc connection: ", connectiondata);

		socket.emit('act_client', {type: 'connect_message', message: "Connecting to server..", error: false});

		let newConnection = new irclib.IRCConnection(connectiondata, config.client, 
			{
				authenticationSteps: [
					new webirc.authenticator(connections[socket.id].host)
				], 
				ctcps: customCTCPs
			});

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
				logger.debugLog("["+socket.id+"] <-", line);
			});

			newConnection.on('debug_log', function(data) {
				logger.debugLog("["+socket.id+"] <-", data);
			});
		}

		newConnection.on('connerror', (data) => {
			logger.debugLog(data);

			if(newConnection.authenticated == false)
				socket.emit('act_client', {type: 'connect_message', server: connectiondata.server, 
					message: "Failed to connect to the server!", error: true});
		});

		newConnection.on('pass_to_client', (data) => {
			socket.emit('act_client', data);
		});

		newConnection.on('closed', (data) => {
			logger.debugLog(data);

			if(newConnection.authenticated == false)
				socket.emit('act_client', {type: 'connect_message', server: connectiondata.server, 
					message: "Failed to connect to the server!", error: true});
			else
				socket.emit('act_client', {type: 'event_server_quit', server: connectiondata.server});
		});
	});
});

process.on('SIGINT', () => {
	logger.log('!!! Received SIGINT; Terminating all IRC connections and exiting.. !!!');
	logger.printRuntimeStats(runtime_stats, connections);
	for(let c in connections) {
		for(let ircconn in connections[c]) {
			if(connections[c][ircconn].ipaddr) continue;
			connections[c][ircconn].disconnect();
		}
	}
	process.exit();
});
