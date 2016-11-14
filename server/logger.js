const util = require("util"),
	  config = require(__dirname+'/config');

module.exports.log = function() {
	console.log.apply(null, arguments);
}

module.exports.debugLog = function() {
	if(!config.server.debug) return;

	console.log.apply(null, arguments);
}

module.exports.errorLog = function(errObj, specify) {
	if(specify)
		console.error(specify);
	
	console.error(errObj);

	if(errObj.stack)
		console.error(errObj.stack);
}


module.exports.printRuntimeStats = function(runtime_stats, connections) {
	if(!config.server.printStats) return;

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

	if(users != 0) // Don't divide by zero lmao
		serversPerUser = servers/users;

	console.log(date+": Currently connected users: "+users+";",
		"IRC server connections: "+servers+";",
		"Average servers per user: "+serversPerUser+";",
		"Total connections made: "+runtime_stats.connectionsMade+";",
		"Uptime: "+process.uptime()+"s;");
}
