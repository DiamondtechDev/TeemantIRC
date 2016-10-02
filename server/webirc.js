let dns = require("dns");
let fs = require("fs");
let path = require("path");
let config = require(__dirname+'/config');
let webirc_data_path = path.resolve(__dirname+'/../webirc.data.json');

let webirc_data = {};

function writeToFile() {
	fs.writeFile(webirc_data_path, JSON.stringify(webirc_data, null, '\t'), function (err) {if (err) throw err;});
}

function reload() {
	try {
		fs.accessSync(webirc_data_path, fs.F_OK);

		webirc_data = require(webirc_data_path);

		if (require.cache && require.cache[webirc_data_path]) {
			delete require.cache[webirc_data_path];
		}
	} catch(e) {
		writeToFile();
	}
}

function get_password(server_ip) {
	if(webirc_data[server_ip] != null)
		return webirc_data[server_ip];

	return null;
}

class WebIRCAuthenticator {
	constructor(userInfo) {
		this.userInfo = userInfo;
	}

	authenticate(connection) {
		let serverpass = get_password(connection.config.address);
		if(serverpass)
			connection.socket.write('WEBIRC '+serverpass+' '+connection.config.username+
				' '+this.userInfo.hostname+' '+this.userInfo.ipaddr+'\r\n');
	}
}

module.exports = {
	reload: reload,
	authenticator: WebIRCAuthenticator,
	get_password: get_password,
	writeToFile: writeToFile
}

process.on('SIGUSR1', () => {
	console.log("!!! Received SIGUSR1; Reloading webirc data.. !!!");
	reload();
});

reload();
