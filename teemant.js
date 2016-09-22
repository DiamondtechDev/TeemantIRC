#!/usr/bin/env node
'use strict';
let express = require("express");
let path = require("path");
let sockio = require('socket.io');
let app = express();
let pubdir = path.join(__dirname+"/public");
let port = 8080;

app.get("/", function(req, res){
	res.sendFile(pubdir+"/index.html");
});

app.use(express.static(__dirname + '/public'));

let io = sockio.listen(app.listen(port));
console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
	console.log(socket)
});
